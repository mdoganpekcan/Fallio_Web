import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { FortunePromptBuilder } from "@/lib/ai/prompt-builder";
import { fetchPersonaByKey } from "@/lib/data";

export async function GET(req: Request) {
  try {
    // 1. Güvenlik Kontrolü
    const authHeader = req.headers.get('authorization');
    const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;
    const isApp = authHeader === `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`;
    const isDev = process.env.NODE_ENV === 'development';

    if (!isCron && !isApp && !isDev) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Bekleyen AI Fallarını Çek
    const { data: fortunes, error: fetchError } = await supabaseAdmin
      .from("fortunes")
      .select(`
        id,
        type,
        user_note,
        metadata,
        created_at,
        user_id,
        users (
          full_name,
          zodiac_sign,
          gender,
          job
        ),
        fortune_tellers!inner (
          id,
          name,
          is_ai,
          ai_provider,
          ai_model
        )
      `)
      .eq("status", "pending")
      .eq("fortune_tellers.is_ai", true)
      .limit(5);

    if (fetchError) {
      console.error("Error fetching fortunes:", fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!fortunes || fortunes.length === 0) {
      return NextResponse.json({ message: "İşlenecek fal yok.", processed: 0 });
    }

    // 3. AI Ayarlarını Çek
    const { data: settings } = await supabaseAdmin.from("ai_settings").select("*").single();

    if (!settings) {
      return NextResponse.json({ error: "AI ayarları bulunamadı" }, { status: 500 });
    }

    const results = [];

    // 4. Falları İşle
    const url = new URL(req.url);
    const queryLang = url.searchParams.get('lang') || 'tr';

    for (const fortune of fortunes) {
      try {
        const meta = fortune.metadata as any || {};
        const language = meta.language || queryLang;
        const user = fortune.users as any;
        const normalizedKey = FortunePromptBuilder.normalizeType(fortune.type);
        const persona = await fetchPersonaByKey(normalizedKey);

        const context = {
          fortuneType: fortune.type,
          userZodiac: user?.zodiac_sign,
          userGender: user?.gender,
          userJob: user?.job,
          userRelation: user?.relationship_status, // Ensure this field exists in query if needed, currently not selected in GET but user context implies it
          userNote: fortune.user_note,
          metadata: meta,
          language: language,
          imageCount: 0 // Will be implicit in how we send images, but good for prompt text
        };

        const systemPrompt = FortunePromptBuilder.buildSystemPrompt(context, persona || undefined);
        const userMessage = FortunePromptBuilder.buildUserMessage(context);

        const teller = Array.isArray(fortune.fortune_tellers) ? fortune.fortune_tellers[0] : fortune.fortune_tellers;

        // Determine Provider
        let provider = settings.active_provider || 'gemini';
        let modelName = null;

        // Override if teller has specific provider
        if (teller?.ai_provider) {
          const p = teller.ai_provider.toLowerCase();
          if (p && p !== 'default') {
            provider = p;
            if (provider === 'chatgpt') provider = 'openai';
            modelName = teller.ai_model;
          }
        }

        let responseText = "";

        if (provider === 'openai') {
          if (!settings.openai_api_key) throw new Error("OpenAI API Key eksik");

          const openai = new OpenAI({ apiKey: settings.openai_api_key });
          const finalModel = modelName || settings.openai_model || "gpt-4o-mini";

          const completion = await openai.chat.completions.create({
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userMessage }
            ],
            model: finalModel,
          });

          responseText = completion.choices[0].message.content || "";

        } else if (provider === 'claude') {
          if (!settings.claude_api_key) throw new Error("Claude API Key eksik");

          const anthropic = new Anthropic({ apiKey: settings.claude_api_key });
          const finalModel = modelName || settings.claude_model || "claude-3-opus-20240229";

          const msg = await anthropic.messages.create({
            model: finalModel,
            max_tokens: 1024,
            messages: [{ role: "user", content: `${systemPrompt}\n\n${userMessage}` }],
          });
          // @ts-ignore
          responseText = msg.content[0].text;

        } else {
          // Gemini (Default)
          if (!settings.gemini_api_key) throw new Error("Gemini API Key eksik");

          const genAI = new GoogleGenerativeAI(settings.gemini_api_key);
          const finalModel = modelName || settings.gemini_model || "gemini-1.5-flash";

          const model = genAI.getGenerativeModel({
            model: finalModel,
            safetySettings: [
              { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
              { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
              { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
              { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            ]
          });

          const result = await model.generateContent(`${systemPrompt}\n\n${userMessage}`);
          responseText = result.response.text();
        }

        if (!responseText) throw new Error("AI yanıtı boş döndü");

        // DB Güncelleme
        const { error: updateError } = await supabaseAdmin
          .from("fortunes")
          .update({
            response: responseText,
            status: "completed",
            completed_at: new Date().toISOString(),
            is_read: false
          })
          .eq("id", fortune.id);

        if (updateError) throw updateError;

        // Bildirim Gönder
        const { data: devices } = await supabaseAdmin
          .from("user_devices")
          .select("push_token")
          .eq("user_id", fortune.user_id)
          .eq("is_active", true)
          .order('updated_at', { ascending: false })
          .limit(1);

        if (devices && devices.length > 0 && devices[0].push_token) {
          try {
            const message = {
              to: devices[0].push_token,
              sound: 'default',
              title: 'Falınız Yorumlandı! 🔮',
              body: 'Falcı yorumunu yaptı. Hemen sonuçları görmek için tıkla!',
              data: { url: `/fortune/result/${fortune.id}` },
            };

            await fetch('https://exp.host/--/api/v2/push/send', {
              method: 'POST',
              headers: {
                'Accept': 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(message),
            });
            console.log(`Notification sent to user ${fortune.user_id}`);
          } catch (pushError) {
            console.error(`Failed to send push to ${fortune.user_id}:`, pushError);
          }
        } else {
          console.log(`No active device found for user ${fortune.user_id}, skipping notification.`);
        }

        results.push({ id: fortune.id, status: "success", provider });

        // Rate limit koruması
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (err: any) {
        console.error(`Error processing fortune ${fortune.id}:`, err);
        results.push({ id: fortune.id, status: "error", error: err.message });
      }
    }

    return NextResponse.json({
      processed: results.length,
      results
    });

  } catch (error: any) {
    console.error("Cron error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
