import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

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
        
        let languageInstruction = "";
        if (language === "en") {
          languageInstruction = "\nIMPORTANT: You MUST write your response in ENGLISH. Use mystical, engaging, and professional tone suitable for a fortune teller. Use English idioms where appropriate.";
        } else if (language === "tr") {
          languageInstruction = "\nÖNEMLİ: Yanıtını TÜRKÇE olarak yazmalısın. Samimi, gizemli, etkileyici ve Türk fal kültürüne uygun deyimler kullan.";
        } else {
          languageInstruction = `\nIMPORTANT: You MUST write your entire response in the language with code: ${language}. Do not provide translation.`;
        }

        let promptTemplate = settings.base_prompt || "You are an experienced fortune teller. Interpret the user's fortune for the type: {{fortune_type}}.";
        let finalBasePrompt = promptTemplate.replace("{{fortune_type}}", fortune.type);

        let extraDetails = "";
        if (fortune.metadata) {
          if (meta.selected_cards) extraDetails += `\n- Selected Cards: ${Array.isArray(meta.selected_cards) ? meta.selected_cards.join(", ") : meta.selected_cards}`;
          if (meta.selected_color) extraDetails += `\n- Selected Color: ${meta.selected_color}`;
          if (meta.category) extraDetails += `\n- Category: ${meta.category}`;
        }

        const user = fortune.users as any;
        const userContext = `
        User Context:
        - Name: ${user?.full_name || "Hidden"}
        - Zodiac: ${user?.zodiac_sign || "Unknown"}
        - Gender: ${user?.gender || "Unknown"}
        - Job: ${user?.job || "Unknown"}
        - Fortune Type: ${fortune.type}
        - User Note: ${fortune.user_note || "None"}${extraDetails}
        `;

        const fullPrompt = `${finalBasePrompt}\n\n${userContext}\n${languageInstruction}\nLütfen samimi, gizemli ve etkileyici bir dille fal yorumunu yap. Cevabın sadece fal yorumu olsun.`;

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
              { role: "system", content: `You are a professional fortune teller. ${languageInstruction}` },
              { role: "user", content: fullPrompt }
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
            messages: [{ role: "user", content: fullPrompt }],
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

          const result = await model.generateContent(fullPrompt);
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
