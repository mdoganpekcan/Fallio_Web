import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getDailyHoroscope, HOROSCOPE_SIGNS } from '@/lib/horoscope-scraper';

export const maxDuration = 300; // 5 minutes max for crawling

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // Allow manual run for testing if no secret set or dev mode
      if (process.env.NODE_ENV === 'production') {
        return new NextResponse('Unauthorized', { status: 401 });
      }
    }

    const today = new Date().toISOString().split('T')[0];
    const results = [];

    for (const sign of HOROSCOPE_SIGNS) {
      // 1. Scrape content
      const content = await getDailyHoroscope(sign);
      
      if (!content) {
        console.warn(`[Cron] No content for ${sign}`);
        results.push({ sign, status: 'failed' });
        continue;
      }

      // 2. Upsert to Supabase
      const { error } = await supabaseAdmin
        .from('horoscopes')
        .upsert({
          sign,
          scope: 'daily',
          general: content,
          love: '',   // Scraped content is generic
          money: '',
          health: '',
          effective_date: today,
          language: 'tr',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'sign,scope,effective_date'
        });

      if (error) {
        console.error(`[Cron] DB error for ${sign}:`, error);
        results.push({ sign, status: 'db-error', error: error.message });
      } else {
        results.push({ sign, status: 'success' });
      }
      
      // Polite delay between requests
      await new Promise(r => setTimeout(r, 1000));
    }

    return NextResponse.json({ 
      success: true, 
      date: today,
      results 
    });
  } catch (error: any) {
    console.error('[Cron] Horoscope error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
