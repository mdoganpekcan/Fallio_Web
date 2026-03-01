import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";

// ── Zod Schema ──────────────────────────────────────────────────────────────
const PriceSchema = z.object({
  amount_in_micros: z.number().optional(),
  currency_code: z.string().optional(),
});

const RevenueCatEventSchema = z.object({
  id: z.string(),
  type: z.string(),
  app_user_id: z.string(),
  product_id: z.string().optional().default(""),
  expiration_at_ms: z.number().nullable().optional(),
  price: PriceSchema.optional(),
  product_identifier: z.string().optional(),
});

const WebhookPayloadSchema = z.object({
  event: RevenueCatEventSchema,
  api_version: z.string().optional(),
});

// ── Constants ────────────────────────────────────────────────────────────────

// Product IDs containing credits → consumable purchase
const CREDIT_PRODUCT_PATTERNS: { pattern: string; credits: number }[] = [
  { pattern: "coin_100", credits: 100 },
  { pattern: "credits_100", credits: 100 },
  { pattern: "coin_500", credits: 500 },
  { pattern: "credits_500", credits: 500 },
  { pattern: "coin_250", credits: 250 },
  { pattern: "credits_250", credits: 250 },
];

// Events that activate a premium subscription
const SUBSCRIPTION_ACTIVE_EVENTS = ["INITIAL_PURCHASE", "RENEWAL", "UNCANCELLATION"];
// Events that deactivate a premium subscription
const SUBSCRIPTION_CANCEL_EVENTS = ["CANCELLATION", "EXPIRATION", "BILLING_ISSUE"];
// All events we care about (others are silently ignored — 200 OK)
const ALL_HANDLED_EVENTS = [
  ...SUBSCRIPTION_ACTIVE_EVENTS,
  ...SUBSCRIPTION_CANCEL_EVENTS,
  "NON_RENEWING_PURCHASE",
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function getCreditAmount(productId: string): number {
  for (const { pattern, credits } of CREDIT_PRODUCT_PATTERNS) {
    if (productId.includes(pattern)) return credits;
  }
  return 0;
}

function getPriceUsd(price?: z.infer<typeof PriceSchema>): number {
  if (!price?.amount_in_micros) return 0;
  return price.amount_in_micros / 1_000_000;
}

function getExpirationDate(expirationAtMs?: number | null): string | null {
  if (!expirationAtMs) return null;
  return new Date(expirationAtMs).toISOString();
}

// ── Route Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // ── 1. Auth ──────────────────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    const secret = process.env.REVENUECAT_WEBHOOK_SECRET;

    if (!authHeader || authHeader !== `Bearer ${secret}`) {
      console.warn("[RevenueCat Webhook] Unauthorized attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── 2. Parse & Validate Payload ──────────────────────────────────────────
    const rawBody = await req.json();
    const parsed = WebhookPayloadSchema.safeParse(rawBody);

    if (!parsed.success) {
      console.error("[RevenueCat Webhook] Invalid payload:", parsed.error.flatten());
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { event } = parsed.data;
    const { type, app_user_id, product_id, expiration_at_ms, price, id: eventId } = event;

    console.log(
      `[RevenueCat Webhook] Event: ${type} | User: ${app_user_id} | Product: ${product_id} | EventID: ${eventId}`
    );

    // ── 3. Ignore unhandled event types (return 200 to prevent RC retries) ───
    if (!ALL_HANDLED_EVENTS.includes(type)) {
      console.log(`[RevenueCat Webhook] Ignored event type: ${type}`);
      return NextResponse.json({ message: "Event ignored", type });
    }

    const priceUsd = getPriceUsd(price);
    const currency = price?.currency_code ?? "USD";
    const expiresAt = getExpirationDate(expiration_at_ms);

    // ── 4a. Consumable Credit Purchases ─────────────────────────────────────
    if (type === "NON_RENEWING_PURCHASE") {
      const creditsToAdd = getCreditAmount(product_id);

      if (creditsToAdd > 0) {
        const { error: rpcError } = await supabaseAdmin.rpc(
          "handle_credit_transaction",
          {
            p_user_id: app_user_id,
            p_amount: creditsToAdd,
            p_transaction_type: "revenuecat_non_renewing_purchase",
            p_provider_transaction_id: eventId,
            p_currency: currency,
            p_price_usd: priceUsd,
          }
        );

        if (rpcError) {
          console.error("[RevenueCat Webhook] Credit RPC failed:", rpcError);
          return NextResponse.json({ error: "Credit update failed" }, { status: 500 });
        }

        console.log(
          `[RevenueCat Webhook] ✅ Added ${creditsToAdd} credits to user ${app_user_id}`
        );
      } else {
        // Unknown credit product → log only
        console.warn(
          `[RevenueCat Webhook] NON_RENEWING_PURCHASE for unknown product: ${product_id}. No credits added.`
        );
        // Log the transaction for audit purposes
        await supabaseAdmin.from("transactions").insert({
          user_id: app_user_id,
          amount: priceUsd,
          currency,
          transaction_type: "purchase",
          provider: "revenuecat",
          provider_transaction_id: eventId,
          status: "completed",
          credits_amount: 0,
          metadata: { product_id, event_type: type },
        });
      }

      return NextResponse.json({ success: true });
    }

    // ── 4b. Subscription Activation (INITIAL_PURCHASE, RENEWAL, UNCANCELLATION)
    if (SUBSCRIPTION_ACTIVE_EVENTS.includes(type)) {
      // Log the purchase as a transaction first (for revenue tracking)
      const txType =
        type === "INITIAL_PURCHASE"
          ? "revenuecat_initial_purchase"
          : "revenuecat_renewal";

      // Skip credit grant for subscription products (they unlock entitlements, not credits)
      const { error: rpcError } = await supabaseAdmin.rpc(
        "update_subscription_status",
        {
          p_user_id: app_user_id,
          p_product_id: product_id,
          p_new_status: "active",
          p_expires_at: expiresAt,
          p_provider_transaction_id: eventId,
          p_price_usd: priceUsd,
          p_currency: currency,
        }
      );

      if (rpcError) {
        console.error(
          `[RevenueCat Webhook] Subscription activation failed:`,
          rpcError
        );
        return NextResponse.json(
          { error: "Subscription activation failed" },
          { status: 500 }
        );
      }

      // Log a transaction record for revenue reporting
      const { error: txError } = await supabaseAdmin
        .from("transactions")
        .insert({
          user_id: app_user_id,
          amount: priceUsd,
          currency,
          transaction_type: txType,
          provider: "revenuecat",
          provider_transaction_id: eventId,
          status: "completed",
          credits_amount: 0,
          metadata: { product_id, event_type: type, expires_at: expiresAt },
        });

      if (txError && txError.code !== '23505') { // 23505 is unique_violation
         console.error("[RevenueCat Webhook] Failed to log subscription transaction:", txError);
      }

      console.log(
        `[RevenueCat Webhook] ✅ Subscription ACTIVATED for user ${app_user_id} (expires: ${expiresAt})`
      );

      return NextResponse.json({ success: true });
    }

    // ── 4c. Subscription Cancellation / Expiration / Billing Issue ───────────
    if (SUBSCRIPTION_CANCEL_EVENTS.includes(type)) {
      const newStatus = type === "EXPIRATION" ? "expired" : "cancelled";

      const { error: rpcError } = await supabaseAdmin.rpc(
        "update_subscription_status",
        {
          p_user_id: app_user_id,
          p_product_id: product_id,
          p_new_status: newStatus,
          p_expires_at: null,
          p_provider_transaction_id: eventId,
          p_price_usd: 0,
          p_currency: currency,
        }
      );

      if (rpcError) {
        console.error(
          `[RevenueCat Webhook] Subscription deactivation failed:`,
          rpcError
        );
        return NextResponse.json(
          { error: "Subscription deactivation failed" },
          { status: 500 }
        );
      }

      console.log(
        `[RevenueCat Webhook] ✅ Subscription ${newStatus.toUpperCase()} for user ${app_user_id}`
      );

      return NextResponse.json({ success: true });
    }

    // Fallthrough (should not reach here)
    return NextResponse.json({ message: "Event processed" });
  } catch (error) {
    console.error("[RevenueCat Webhook] Unhandled error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
