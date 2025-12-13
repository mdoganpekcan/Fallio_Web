-- Falio Admin Panel schema (PostgreSQL / Supabase)
-- Gerekli: pgcrypto uzantısı (uuid için)

create extension if not exists "pgcrypto";

-- Enums (idempotent)
do $$ begin create type user_status as enum ('active','banned'); exception when duplicate_object then null; end $$;
do $$ begin create type fortune_status as enum ('pending','completed'); exception when duplicate_object then null; end $$;
do $$ begin create type subscription_cycle as enum ('monthly','yearly'); exception when duplicate_object then null; end $$;
do $$ begin create type subscription_status as enum ('active','cancelled','expired'); exception when duplicate_object then null; end $$;
do $$ begin create type notification_status as enum ('queued','sent','error'); exception when duplicate_object then null; end $$;
do $$ begin create type horoscope_scope as enum ('daily','weekly','monthly'); exception when duplicate_object then null; end $$;
do $$ begin create type earning_rule_type as enum ('ad','daily','invite'); exception when duplicate_object then null; end $$;
do $$ begin create type admin_role as enum ('admin','moderator'); exception when duplicate_object then null; end $$;

-- Users
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  zodiac_sign text,
  avatar_url text,
  city text,
  status user_status not null default 'active',
  created_at timestamptz not null default now(),
  unique (email),
  unique (auth_user_id)
);

-- Fortune tellers
create table if not exists public.fortune_tellers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  name text not null,
  bio text,
  avatar_url text,
  expertise text[] not null default '{}',
  price integer not null default 0,
  rating numeric(3,1) not null default 5.0,
  is_online boolean not null default false,
  is_ai boolean not null default false,
  ai_provider text,
  ai_model text,
  created_at timestamptz not null default now()
);
create index if not exists fortune_tellers_user_id_idx on public.fortune_tellers(user_id);

-- Profiles (teller referansı sonradan geliyor)
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  birthdate date,
  gender text,
  bio text,
  preferred_teller_id uuid references public.fortune_tellers(id) on delete set null,
  last_login timestamptz,
  unique (user_id)
);

-- Fortunes
create table if not exists public.fortunes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  teller_id uuid references public.fortune_tellers(id) on delete set null,
  type text not null,
  status fortune_status not null default 'pending',
  user_note text,
  response text,
  is_read boolean not null default false,
  user_rating smallint,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists fortunes_user_id_idx on public.fortunes(user_id);
create index if not exists fortunes_teller_id_idx on public.fortunes(teller_id);

create table if not exists public.fortune_images (
  id uuid primary key default gen_random_uuid(),
  fortune_id uuid not null references public.fortunes(id) on delete cascade,
  url text not null,
  created_at timestamptz not null default now()
);
create index if not exists fortune_images_fortune_id_idx on public.fortune_images(fortune_id);

-- Wallet
create table if not exists public.wallet (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  credits integer not null default 0,
  diamonds integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (user_id)
);

-- Subscriptions
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  plan_name text not null,
  cycle subscription_cycle not null,
  status subscription_status not null default 'active',
  price numeric(10,2) not null default 0,
  perks text[] not null default '{}',
  started_at timestamptz not null default now(),
  expires_at timestamptz
);
create index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);

-- Admin users (Auth ile eşleştirmek için)
create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete cascade,
  email text not null,
  role admin_role not null,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  last_login timestamptz,
  unique (email),
  unique (auth_user_id)
);

-- Notifications
create table if not exists public.notifications (
  id bigint primary key generated always as identity,
  user_id uuid references public.users(id) on delete set null,
  segment text,
  title text not null,
  message text not null,
  status notification_status not null default 'queued',
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  created_by uuid references public.admin_users(id) on delete set null
);
create index if not exists notifications_user_id_idx on public.notifications(user_id);

-- Settings
create table if not exists public.settings (
  id integer primary key default 1,
  theme text not null default 'dark',
  ai_enabled boolean not null default true,
  support_email text not null,
  instagram text,
  twitter text,
  facebook text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists settings_id_key on public.settings(id);

-- AI settings (provider keys + base prompt)
create table if not exists public.ai_settings (
  id integer primary key default 1,
  base_prompt text not null default '',
  claude_api_key text,
  claude_model text,
  gemini_api_key text,
  gemini_model text,
  openai_api_key text,
  openai_model text,
  updated_at timestamptz not null default now()
);
create unique index if not exists ai_settings_id_key on public.ai_settings(id);

-- Horoscopes
create table if not exists public.horoscopes (
  id uuid primary key default gen_random_uuid(),
  sign text not null,
  scope horoscope_scope not null,
  love text,
  money text,
  health text,
  general text,
  effective_date date not null default current_date,
  updated_at timestamptz not null default now(),
  unique (sign, scope, effective_date)
);

-- Credit packages
create table if not exists public.credit_packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  credits integer not null,
  price numeric(10,2) not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (name)
);

-- Earning rules
create table if not exists public.earning_rules (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type earning_rule_type not null,
  diamonds integer not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Messages
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  fortune_id uuid not null references public.fortunes(id) on delete cascade,
  sender_type text not null,
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists messages_fortune_id_idx on public.messages(fortune_id);

-- Logs
create table if not exists public.logs (
  id bigint primary key generated always as identity,
  actor_admin_id uuid references public.admin_users(id) on delete set null,
  action text not null,
  entity text,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index if not exists logs_actor_admin_id_idx on public.logs(actor_admin_id);

-- View for dashboard lists
create or replace view public.fortunes_view as
select
  f.id,
  u.full_name as user_name,
  f.type,
  t.name as teller_name,
  f.status,
  f.created_at
from public.fortunes f
left join public.users u on u.id = f.user_id
left join public.fortune_tellers t on t.id = f.teller_id;

-- Seed settings (id=1) if missing
insert into public.settings (id, support_email)
values (1, 'destek@falio.app')
on conflict (id) do nothing;

insert into public.ai_settings (id, base_prompt)
values (1, 'Sen {{fortune_type}} konusunda uzman bir falcısın. Aşağıdaki not ve görselleri gerçek bir falcı gibi yorumla.')
on conflict (id) do nothing;

-- Ensure new columns exist on upgraded databases
alter table if exists public.fortune_tellers
  add column if not exists ai_provider text,
  add column if not exists ai_model text;

alter table if exists public.fortunes
  add column if not exists is_read boolean not null default false,
  add column if not exists user_rating smallint;

-- Seed admin (Auth’ta user oluşturduktan sonra AUTH_ID ile doldurun)
-- insert into public.admin_users (email, role, display_name, auth_user_id)
-- values ('admin@falio.app', 'admin', 'Demo Admin', '<AUTH_USER_ID>')
-- on conflict (email) do nothing;
