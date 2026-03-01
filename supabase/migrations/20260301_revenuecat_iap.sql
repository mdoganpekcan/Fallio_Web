-- ============================================================
-- RevenueCat IAP: Transactions Table & RPCs
-- Migration: 20260301_revenuecat_iap.sql
-- ============================================================

-- Enums (idempotent)
do $$ begin
  create type transaction_status as enum ('pending', 'completed', 'failed', 'refunded');
exception when duplicate_object then null; end $$;

do $$ begin
  create type transaction_type as enum (
    'purchase', 'revenuecat_initial_purchase', 'revenuecat_renewal',
    'revenuecat_non_renewing_purchase', 'revenuecat_cancellation',
    'revenuecat_expiration', 'revenuecat_refund', 'ad_reward', 'admin_grant'
  );
exception when duplicate_object then null; end $$;

-- These may already exist from the main schema — idempotent re-creation
do $$ begin
  create type subscription_status as enum ('active', 'cancelled', 'expired');
exception when duplicate_object then null; end $$;

do $$ begin
  create type subscription_cycle as enum ('monthly', 'yearly');
exception when duplicate_object then null; end $$;

-- ============================================================
-- 1. TRANSACTIONS TABLE
-- ============================================================
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  amount numeric(12, 4) not null default 0,
  currency text not null default 'USD',
  package_id uuid references public.credit_packages(id) on delete set null,
  transaction_type transaction_type not null default 'purchase',
  provider text not null default 'revenuecat',
  -- Idempotency key: prevents double-processing the same RC event
  provider_transaction_id text unique,
  status transaction_status not null default 'completed',
  credits_amount integer not null default 0,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists transactions_user_id_idx on public.transactions(user_id);
create index if not exists transactions_provider_tx_idx on public.transactions(provider_transaction_id);
create index if not exists transactions_created_at_idx on public.transactions(created_at desc);

-- RLS: Only service role can write; users can read their own
alter table public.transactions enable row level security;

drop policy if exists "Users can read own transactions" on public.transactions;
create policy "Users can read own transactions"
  on public.transactions for select
  using (auth.uid() = (select auth_user_id from public.users where id = user_id));

-- ============================================================
-- 2. ADD is_premium COLUMN TO users (if missing)
-- ============================================================
alter table if exists public.users
  add column if not exists is_premium boolean not null default false;

-- ============================================================
-- 3. RPC: handle_credit_transaction
--    Atomically adds credits to a user's wallet and logs the transaction.
--    Called by the RevenueCat webhook for consumable purchases.
-- ============================================================
create or replace function public.handle_credit_transaction(
  p_user_id uuid,
  p_amount integer,
  p_transaction_type text,
  p_provider_transaction_id text default null,
  p_currency text default 'USD',
  p_price_usd numeric default 0
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_transaction_id uuid;
  v_tx_type transaction_type;
begin
  -- Cast string to enum safely
  begin
    v_tx_type := p_transaction_type::transaction_type;
  exception when invalid_text_representation then
    v_tx_type := 'purchase'::transaction_type;
  end;

  -- Idempotency check
  if p_provider_transaction_id is not null then
    select id into v_transaction_id
    from public.transactions
    where provider_transaction_id = p_provider_transaction_id;

    if found then
      -- Already processed → return the existing transaction id
      return v_transaction_id;
    end if;
  end if;

  -- Upsert wallet credits atomically
  insert into public.wallet (user_id, credits)
  values (p_user_id, p_amount)
  on conflict (user_id)
  do update set
    credits = public.wallet.credits + p_amount,
    updated_at = now();

  -- Log the transaction
  insert into public.transactions (
    user_id,
    amount,
    currency,
    transaction_type,
    provider,
    provider_transaction_id,
    status,
    credits_amount
  )
  values (
    p_user_id,
    p_price_usd,
    p_currency,
    v_tx_type,
    'revenuecat',
    p_provider_transaction_id,
    'completed',
    p_amount
  )
  returning id into v_transaction_id;

  return v_transaction_id;
end;
$$;

-- ============================================================
-- 4. RPC: update_subscription_status
--    Manages subscription lifecycle events from RevenueCat.
--    Handles: active (initial/renewal), cancelled, expired states.
-- ============================================================
create or replace function public.update_subscription_status(
  p_user_id uuid,
  p_product_id text,
  p_new_status text,  -- 'active' | 'cancelled' | 'expired'
  p_expires_at timestamptz default null,
  p_provider_transaction_id text default null,
  p_price_usd numeric default 0,
  p_currency text default 'USD'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sub_status subscription_status;
  v_is_premium boolean;
  v_tx_type transaction_type;
  v_cycle subscription_cycle;
begin
  -- Map status string to enum
  case p_new_status
    when 'active' then
      v_sub_status := 'active';
      v_is_premium := true;
    when 'cancelled' then
      v_sub_status := 'cancelled';
      v_is_premium := false;
    when 'expired' then
      v_sub_status := 'expired';
      v_is_premium := false;
    else
      v_sub_status := 'active';
      v_is_premium := true;
  end case;

  -- Determine subscription cycle from product_id
  if p_product_id ilike '%yearly%' or p_product_id ilike '%annual%' then
    v_cycle := 'yearly';
  else
    v_cycle := 'monthly';
  end if;

  -- Upsert subscription record
  insert into public.subscriptions (
    user_id,
    plan_name,
    cycle,
    status,
    price,
    started_at,
    expires_at
  )
  values (
    p_user_id,
    'Premium',
    v_cycle,
    v_sub_status,
    p_price_usd,
    now(),
    p_expires_at
  )
  on conflict (user_id)
  do update set
    status = v_sub_status,
    expires_at = coalesce(p_expires_at, public.subscriptions.expires_at),
    price = case when p_price_usd > 0 then p_price_usd else public.subscriptions.price end,
    cycle = v_cycle;

  -- Sync is_premium flag on users table
  update public.users
  set is_premium = v_is_premium
  where id = p_user_id;

  -- Log cancelation/expiration in transactions (no credits for these events)
  if p_new_status in ('cancelled', 'expired') and p_provider_transaction_id is not null then
    -- Only log if not already processed (idempotency)
    insert into public.transactions (
      user_id,
      amount,
      currency,
      transaction_type,
      provider,
      provider_transaction_id,
      status,
      credits_amount
    )
    values (
      p_user_id,
      0,
      p_currency,
      case p_new_status
        when 'cancelled' then 'revenuecat_cancellation'::transaction_type
        else 'revenuecat_expiration'::transaction_type
      end,
      'revenuecat',
      p_provider_transaction_id,
      'completed',
      0
    )
    on conflict (provider_transaction_id) do nothing;
  end if;
end;
$$;

-- ============================================================
-- 5. Add UNIQUE constraint on subscriptions.user_id
--    (needed for ON CONFLICT in update_subscription_status)
-- ============================================================
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'subscriptions_user_id_key'
    and conrelid = 'public.subscriptions'::regclass
  ) then
    alter table public.subscriptions add constraint subscriptions_user_id_key unique (user_id);
  end if;
exception when others then
  null; -- Constraint may already exist from a different migration
end;
$$;
