import { NextResponse } from "next/server";
import { processFortuneQueue } from "@/lib/services/fortune-processor";
import { getDailyHoroscope, HOROSCOPE_SIGNS } from "@/lib/horoscope-scraper";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const maxDuration = 300; // 5 minutes max

export async function GET(req: Request) {
  try {
     // 1. Auth Check
    const authHeader = req.headers.get('authorization');
    const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;
    const isDev = process.env.NODE_ENV === 'development';
    
    // In production, require cron or manual authorized trigger
    if (!isCron && !isDev && authHeader !== `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`) {
        // Relaxing auth slightly for testing via Postman with Anon key if needed, or strict Cron Secret
        if (process.env.NODE_ENV === 'production' && !isCron) {
            return new NextResponse("Unauthorized", { status: 401 });
        }
    }

    const results: any = {
        fortune_processing: null,
        horoscope_scraping: null
    };

    // 2. ALWAYS: Process Fortune Queue
    // This runs every 10 minutes
    try {
        console.log("[Master Cron] Starting Fortune Processing...");
        const fortuneResult = await processFortuneQueue('tr');
        results.fortune_processing = fortuneResult;
        console.log("[Master Cron] Fortune Processing Complete:", fortuneResult);
    } catch (e: any) {
        console.error("[Master Cron] Fortune Processing Failed:", e);
        results.fortune_processing = { error: e.message };
    }

    // 3. CONDITIONAL: Daily Horoscope Scraping
    // Check if we are between 00:00 and 02:00 TRT (UTC+3)
    // Vercel runs in UTC. TRT is UTC+3.
    // 00:00 TRT = 21:00 UTC (previous day)
    // Let's rely on checking the DB. If "today's" horoscopes don't exist for Koç, run it.
    
    // Check if we already have data for today
    const today = new Date().toISOString().split('T')[0];
    const { count } = await supabaseAdmin
        .from('horoscopes')
        .select('*', { count: 'exact', head: true })
        .eq('effective_date', today)
        .eq('sign', 'koc')
        .eq('scope', 'daily');

    // If no daily horoscope for Koç today, trigger scraping
    if (count === 0) {
        console.log("[Master Cron] Starting Daily Horoscope Scraping...");
        const scrapeResults = [];
        
        for (const sign of HOROSCOPE_SIGNS) {
            const content = await getDailyHoroscope(sign);
            if (content) {
                await supabaseAdmin.from('horoscopes').upsert({
                    sign,
                    scope: 'daily',
                    general: content,
                    effective_date: today,
                    language: 'tr',
                    updated_at: new Date().toISOString()
                }, { onConflict: 'sign,scope,effective_date' });
                scrapeResults.push({ sign, status: 'success' });
            } else {
                scrapeResults.push({ sign, status: 'failed' });
            }
             // Be polite
            await new Promise(r => setTimeout(r, 1000));
        }
        results.horoscope_scraping = { run: true, details: scrapeResults };
    } else {
        results.horoscope_scraping = { run: false, reason: "Already exists for today" };
    }

    return NextResponse.json(results);

  } catch (error: any) {
    console.error("[Master Cron] Critical Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
