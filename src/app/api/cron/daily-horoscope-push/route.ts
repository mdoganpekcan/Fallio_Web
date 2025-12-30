import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lang = searchParams.get('lang') || 'tr';

  try {
    console.log(`[Smart-Push] Starting daily horoscope push for language: ${lang}`);

    // 1. Get all active users with a zodiac sign and push token
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, full_name, zodiac_sign, user_devices(push_token)')
      .not('zodiac_sign', 'is', null);

    if (userError) throw userError;

    console.log(`[Smart-Push] Found ${users?.length} users with zodiac signs.`);

    const notifications = [];

    for (const user of users) {
      if (!user.user_devices || user.user_devices.length === 0) continue;

      // 2. Get today's horoscope for this user's sign
      // Map Turkish sign to slug if needed (already handled in DB usually)
      const { data: horoscope } = await supabase
        .from('horoscopes')
        .select('general')
        .eq('sign', user.zodiac_sign?.toLowerCase())
        .eq('scope', 'daily')
        .eq('language', lang)
        .order('effective_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!horoscope) continue;

      // 3. Prepare push notification
      const message = lang === 'tr' 
        ? `Günaydın ${user.full_name || ''}! Bugün ${user.zodiac_sign} burcu için harika bir gün. İşte yorumun...`
        : `Good morning ${user.full_name || ''}! Stars are aligned for ${user.zodiac_sign} today. Here is your reading...`;

      for (const device of user.user_devices) {
        notifications.push({
          to: device.push_token,
          sound: 'default',
          title: lang === 'tr' ? 'Günlük Burç Yorumun' : 'Daily Horoscope',
          body: message,
          data: { type: 'horoscope', sign: user.zodiac_sign },
        });
      }
    }

    // 4. Send notifications via Expo Push API
    if (notifications.length > 0) {
      console.log(`[Smart-Push] Sending ${notifications.length} notifications...`);
      const chunks = chunkArray(notifications, 100);
      
      for (const chunk of chunks) {
        await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(chunk),
        });
      }
    }

    return NextResponse.json({ success: true, count: notifications.length });
  } catch (error: any) {
    console.error('[Smart-Push] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

function chunkArray(array: any[], size: number) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
