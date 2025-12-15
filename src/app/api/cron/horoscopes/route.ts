import { NextResponse } from "next/server";
import { generateHoroscopes } from "@/lib/services/horoscope-generator";

export async function GET(req: Request) {
  try {
    // Güvenlik Kontrolü (Vercel Cron veya Localhost)
    const authHeader = req.headers.get('authorization');
    const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;
    const isDev = process.env.NODE_ENV === 'development';
    
    if (!isCron && !isDev) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // --- AKILLI CRON MANTIĞI ---
    // Tek bir cron job ile tüm periyotları yönetiyoruz.
    // URL parametresi varsa onu kullan (manuel tetikleme için), yoksa tarihe göre karar ver.
    
    const { searchParams } = new URL(req.url);
    let typesToProcess = [];

    if (searchParams.get("type")) {
        // Manuel olarak belirli bir tip istendiyse sadece onu yap
        typesToProcess.push(searchParams.get("type"));
    } else {
        // Otomatik mod: Tarihe göre karar ver
        const today = new Date();
        
        // 1. Her gün "daily" çalışır
        typesToProcess.push("daily");

        // 2. Pazartesi günleri (Day 1) "weekly" çalışır
        if (today.getDay() === 1) {
            typesToProcess.push("weekly");
        }

        // 3. Ayın 1. günü "monthly" çalışır
        if (today.getDate() === 1) {
            typesToProcess.push("monthly");
        }
    }

    console.log(`[Horoscope Cron] Processing types: ${typesToProcess.join(", ")}`);

    const results = await generateHoroscopes(typesToProcess);

    return NextResponse.json({ processed: results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

