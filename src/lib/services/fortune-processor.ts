import { supabaseAdmin } from "@/lib/supabase-admin";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { FortunePromptBuilder } from "@/lib/ai/prompt-builder";
import { fetchPersonaByKey } from "@/lib/data";

export async function processFortuneQueue(queryLang = 'tr') {
  const results: any[] = [];
  
  // 1. Fetch Waiting Fortunes
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
        job,
        relationship_status
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

  if (fetchError) throw new Error(fetchError.message);
  if (!fortunes || fortunes.length === 0) return { processed: 0, results: [] };

  // 2. Fetch Settings
  const { data: settings } = await supabaseAdmin.from("ai_settings").select("*").single();
  if (!settings) throw new Error("AI Settings not found");

  // 3. Process Loop
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
        userRelation: user?.relationship_status, 
        userNote: fortune.user_note,
        metadata: meta,
        language: language,
        imageCount: 0 
      };

      // Fetch images to update count
      const { data: images } = await supabaseAdmin
        .from("fortune_images")
        .select("url")
        .eq("fortune_id", fortune.id);
      
      const imageParts: any[] = [];
      if (images && images.length > 0) {
        context.imageCount = images.length;
        for (const img of images) {
          try {
             // URL format: .../storage/v1/object/public/fortune-images/folder/file.jpg
             // Need to extract path relative to bucket
             const urlParts = img.url.split("/fortune-images/");
             if (urlParts.length > 1) {
               const filePath = urlParts[1];
               const { data } = await supabaseAdmin.storage
                 .from("fortune-images")
                 .download(filePath);

               if (data) {
                 const buffer = Buffer.from(await data.arrayBuffer());
                 const base64 = buffer.toString("base64");
                 imageParts.push({
                   inlineData: {
                     data: base64,
                     mimeType: "image/jpeg",
                   },
                 });
               }
             }
          } catch (e) {
            console.error("Image download error:", e);
          }
        }
      }

      const systemPrompt = FortunePromptBuilder.buildSystemPrompt(context, persona || undefined);
      const userMessage = FortunePromptBuilder.buildUserMessage(context);

      const teller = Array.isArray(fortune.fortune_tellers) ? fortune.fortune_tellers[0] : fortune.fortune_tellers;

      // Provider Logic
      let provider = settings.active_provider || 'gemini';
      let modelName = null;

      if (teller?.ai_provider) {
        const p = teller.ai_provider.toLowerCase();
        if (p && p !== 'default') {
          provider = p;
          if (provider === 'chatgpt') provider = 'openai';
          modelName = teller.ai_model;
        }
      }

      let responseText = "";

      // Call AI (Simplified logic from route)
      if (provider === 'openai') {
        const openai = new OpenAI({ apiKey: settings.openai_api_key });
        const finalModel = modelName || settings.openai_model || "gpt-4o-mini";
        
        const content: any[] = [{ type: "text", text: userMessage }];
        imageParts.forEach(part => {
            content.push({
              type: "image_url",
              image_url: { url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` }
            });
        });

        const completion = await openai.chat.completions.create({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: content as any }
          ],
          model: finalModel,
        });
        responseText = completion.choices[0].message.content || "";

      } else if (provider === 'claude') {
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
         // Gemini
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
          const result = await model.generateContent([systemPrompt + "\n\n" + userMessage, ...imageParts]);
          responseText = result.response.text();
      }

      // DB Update
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
      
      // Push Notification Logic (Simplified)
      // ... (Push notification logic remains same, abstracted for brevity but crucial for UX)
      await sendPushNotification(fortune.user_id, fortune.id);

      results.push({ id: fortune.id, status: "success", provider });
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (err: any) {
      console.error(`Error processing fortune ${fortune.id}:`, err);
      results.push({ id: fortune.id, status: "error", error: err.message });
       // Mark as failed in DB to prevent infinite loop? Or leave pending for retry?
       // Leaving pending allows retry.
    }
  }

  return { processed: results.length, results };
}

async function sendPushNotification(userId: string, fortuneId: string) {
    const { data: devices } = await supabaseAdmin
        .from("user_devices")
        .select("push_token")
        .eq("user_id", userId)
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
            data: { url: `/fortune/result/${fortuneId}` },
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
        } catch (pushError) {
            console.error(`Failed to send push to ${userId}:`, pushError);
        }
    }
}
