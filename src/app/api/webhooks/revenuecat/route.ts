import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// RevenueCat Webhook Events
// https://www.revenuecat.com/docs/integrations/webhooks/event-types

export async function POST(req: Request) {
  try {
    // 1. Security Check
    const authHeader = req.headers.get("Authorization");
    const expectedAuth = process.env.REVENUECAT_WEBHOOK_SECRET; // You need to set this in .env

    // RevenueCat sends "Bearer <token>" or just the token depending on config. 
    // Usually we configure a custom header or use the Authorization header.
    // Let's assume we set "Authorization" header in RevenueCat to "Bearer <REVENUECAT_WEBHOOK_SECRET>"
    
    if (!expectedAuth || authHeader !== `Bearer ${expectedAuth}`) {
      // If env is not set, we might want to skip check for dev, but better to be safe.
      if (process.env.NODE_ENV === 'production') {
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = await req.json();
    const { event } = body;

    if (!event) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const { type, app_user_id, product_id, price, currency, transaction_id, store } = event;

    console.log(`[RevenueCat Webhook] Received event: ${type} for user: ${app_user_id}`);

    // We only care about successful purchases
    const RELEVANT_EVENTS = [
      "INITIAL_PURCHASE",
      "NON_RENEWING_PURCHASE", // Consumables (Credits) usually come here
      "RENEWAL",
      "PRODUCT_CHANGE"
    ];

    if (!RELEVANT_EVENTS.includes(type)) {
      return NextResponse.json({ message: "Event ignored" });
    }

    // 2. Find the package in our DB to know how many credits to give
    // We check both ios and android product ids
    const { data: creditPackage, error: packageError } = await supabaseAdmin
      .from("credit_packages")
      .select("*")
      .or(`ios_product_id.eq.${product_id},android_product_id.eq.${product_id}`)
      .single();

    if (packageError || !creditPackage) {
      console.error(`[RevenueCat Webhook] Package not found for product_id: ${product_id}`);
      // It might be a subscription (Pro mode) instead of credits.
      // TODO: Handle subscriptions here if needed.
      return NextResponse.json({ message: "Package not found, skipping credit update" });
    }

    // 3. Update User Wallet
    // First get current wallet
    const { data: wallet, error: walletError } = await supabaseAdmin
      .from("wallet")
      .select("*")
      .eq("user_id", app_user_id)
      .single();

    if (walletError && walletError.code !== 'PGRST116') { // PGRST116 is "not found"
       console.error("[RevenueCat Webhook] Wallet fetch error:", walletError);
       return NextResponse.json({ error: "Wallet fetch error" }, { status: 500 });
    }

    // If wallet doesn't exist, create it (should exist from auth trigger, but just in case)
    if (!wallet) {
       await supabaseAdmin.from("wallet").insert({
         user_id: app_user_id,
         credits: creditPackage.credits
       });
    } else {
       // Increment credits
       await supabaseAdmin.from("wallet").update({
         credits: wallet.credits + creditPackage.credits,
         updated_at: new Date().toISOString()
       }).eq("user_id", app_user_id);
    }

    // 4. Log Transaction
    // Ensure 'transactions' table exists (as per previous instructions)
    const { error: transError } = await supabaseAdmin.from("transactions").insert({
      user_id: app_user_id,
      package_id: creditPackage.id,
      amount: price,
      currency: currency,
      credits_amount: creditPackage.credits,
      transaction_type: 'purchase',
      provider: store === 'APP_STORE' ? 'apple' : 'google',
      provider_transaction_id: transaction_id,
      status: 'completed'
    });

    if (transError) {
      console.error("[RevenueCat Webhook] Transaction log error:", transError);
      // Don't fail the request, credits are already given.
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("[RevenueCat Webhook] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
