import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    const secret = process.env.REVENUECAT_WEBHOOK_SECRET;

    if (!authHeader || authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { event } = body;

    if (!event) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { type, app_user_id, product_id, price } = event;
    console.log(`[RevenueCat] Received event: ${type} for user: ${app_user_id} - Product: ${product_id}`);

    // Sadece desteklenen eventleri işle
    if (!["INITIAL_PURCHASE", "RENEWAL", "NON_RENEWING_PURCHASE"].includes(type)) {
      console.log(`[RevenueCat] Ignored event type: ${type}`);
      return NextResponse.json({ message: "Event ignored" });
    }

    // 1. Kredileri Yükle (RPC ile)
    let creditsToAdd = 0;
    // Basit bir eşleştirme (Gerçek senaryoda veritabanından paket detaylarını çekmek daha iyidir)
    if (product_id.includes("coin_100")) creditsToAdd = 100;
    else if (product_id.includes("coin_500")) creditsToAdd = 500;
    else if (product_id.includes("premium")) creditsToAdd = 0; // Aboneliklerde kredi verilmiyorsa

    if (creditsToAdd > 0) {
      const { error: rpcError } = await supabaseAdmin.rpc("handle_credit_transaction", {
        p_user_id: app_user_id,
        p_amount: creditsToAdd,
        p_transaction_type: `revenuecat_${type.toLowerCase()}`
      });

      if (rpcError) {
        console.error("[RevenueCat] Credit update failed:", rpcError);
        return NextResponse.json({ error: "Credit update failed" }, { status: 500 });
      }
      console.log(`[RevenueCat] Added ${creditsToAdd} credits to user ${app_user_id}`);
    }

    // 2. İşlemi Logla
    const { error: logError } = await supabaseAdmin.from("transactions").insert({
      user_id: app_user_id,
      amount: price?.amount_in_micros ? price.amount_in_micros / 1000000 : 0,
      currency: price?.currency_code || "USD",
      package_id: null, // Paket ID eşleşmesi yapılabilir
      transaction_type: "purchase",
      provider: "revenuecat",
      provider_transaction_id: event.id,
      status: "completed",
      credits_amount: creditsToAdd
    });

    if (logError) {
      console.error("[RevenueCat] Transaction log failed:", logError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[RevenueCat] Webhook error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
