import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fortuneId, userNote, fortuneType, userZodiac, userGender, userJob, userRelation, metadata, language = "tr" } = body;

    // 1. Fetch AI Settings
    const { data: settings } = await supabaseAdmin.from("ai_settings").select("*").single();

    if (!settings) {
      return NextResponse.json({ error: "AI settings not found." }, { status: 400 });
    }

    // 2. Determine Preferred Provider
    let preferredProvider = settings.active_provider || "gemini";
    let preferredModel: string | null = null;

    if (fortuneId) {
      const { data: fortune } = await supabaseAdmin.from("fortunes").select("teller_id").eq("id", fortuneId).single();
      if (fortune?.teller_id) {
        const { data: teller } = await supabaseAdmin.from("fortune_tellers").select("ai_provider, ai_model").eq("id", fortune.teller_id).single();
        if (teller?.ai_provider) {
          const tellerProvider = teller.ai_provider.toLowerCase();
          if (tellerProvider && tellerProvider !== 'default') {
            preferredProvider = tellerProvider;
            if (preferredProvider === 'chatgpt') preferredProvider = 'openai';
            preferredModel = teller.ai_model;
          }
        }
      }
    }

    // 3. Construct Prompt with Language Support
    let basePrompt = settings.base_prompt || "You are an experienced fortune teller. Interpret the user's fortune for the type: {{fortune_type}}.";
    
    let languageInstruction = "";
    if (language === "en") {
      languageInstruction = "\nIMPORTANT: You MUST write your response in ENGLISH. Use mystical, engaging, and professional tone suitable for a fortune teller. Use English idioms where appropriate.";
    } else if (language === "tr") {
      languageInstruction = "\nÖNEMLİ: Yanıtını TÜRKÇE olarak yazmalısın. Samimi, gizemli, etkileyici ve Türk fal kültürüne uygun deyimler kullan.";
    } else {
      languageInstruction = `\nIMPORTANT: You MUST write your entire response in the language with code: ${language}. Do not provide translation.`;
    }

    const finalBasePrompt = basePrompt.replace("{{fortune_type}}", fortuneType);

    let extraDetails = "";
    if (metadata) {
      if (metadata.selected_cards) extraDetails += `\n- Selected Cards: ${Array.isArray(metadata.selected_cards) ? metadata.selected_cards.join(", ") : metadata.selected_cards}`;
      if (metadata.selected_color) extraDetails += `\n- Selected Color: ${metadata.selected_color}`;
      if (metadata.category) extraDetails += `\n- Category: ${metadata.category}`;
    }

    const userContext = `
    User Context:
    - Zodiac: ${userZodiac || "Unknown"}
    - Gender: ${userGender || "Unknown"}
    - Job: ${userJob || "Unknown"}
    - Relation Status: ${userRelation || "Unknown"}
    - Fortune Type: ${fortuneType}
    - User Note: ${userNote || "None"}${extraDetails}
    `;

    // 4. Fetch Images if exists
    let imageParts: any[] = [];
    if (fortuneId) {
      const { data: images } = await supabaseAdmin
        .from("fortune_images")
        .select("url")
        .eq("fortune_id", fortuneId);

      if (images && images.length > 0) {
        for (const img of images) {
          try {
            // URL format: .../storage/v1/object/public/fortune-images/folder/file.jpg
            const urlParts = img.url.split("/fortune-images/");
            if (urlParts.length > 1) {
              const filePath = urlParts[1];
              const { data, error } = await supabaseAdmin.storage
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
    }

    const fullPrompt = `${finalBasePrompt}\n\n${userContext}\n${languageInstruction}\n\n${imageParts.length > 0 ? "Analyze the provided images in detail and include them in your interpretation." : ""}`;

    let responseText = "";

    // Helper functions for providers
    let errors: string[] = [];

    const tryGemini = async () => {
      if (!settings.gemini_api_key) {
        errors.push("Gemini API Key eksik");
        return null;
      }

      const apiKey = settings.gemini_api_key.trim();
      let modelsToTry: string[] = [];

      // 1. Try to fetch dynamic model list from Google API
      try {
        const listResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        if (listResponse.ok) {
          const data = await listResponse.json();
          if (data.models) {
            // Filter models that support 'generateContent'
            const availableModels = data.models
              .filter((m: any) => m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent"))
              .map((m: any) => m.name.replace("models/", ""));

            // Prioritize 1.5 Pro and Flash models
            const prioritized = availableModels.sort((a: string, b: string) => {
              const getScore = (name: string) => {
                if (name.includes("1.5-pro")) return 3;
                if (name.includes("1.5-flash")) return 2;
                if (name.includes("2.0")) return 1; // Experimental but new
                return 0;
              };
              return getScore(b) - getScore(a);
            });

            modelsToTry = prioritized;
            // console.log("Fetched dynamic Gemini models:", modelsToTry);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch dynamic model list, using fallbacks:", err);
      }

      // 2. Fallback list if dynamic fetch fails
      if (modelsToTry.length === 0) {
        const fallbacks = [
          "gemini-1.5-pro",
          "gemini-1.5-flash",
          "gemini-2.0-flash-exp",
          "gemini-1.5-pro-latest",
          "gemini-1.0-pro"
        ];
        fallbacks.forEach(m => {
          if (!modelsToTry.includes(m)) modelsToTry.push(m);
        });
      }

      // 3. Add preferred model to top
      let primaryModel = (preferredProvider === 'gemini' && preferredModel) ? preferredModel : settings.gemini_model;
      if (primaryModel) {
        // Remove if exists to avoid duplicates, then unshift
        modelsToTry = modelsToTry.filter(m => m !== primaryModel);
        modelsToTry.unshift(primaryModel);
      }

      for (const modelName of modelsToTry) {
        try {
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({
            model: modelName,
            safetySettings: [
              { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
              { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
              { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
              { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            ]
          });

          const result = await model.generateContent([fullPrompt, ...imageParts]);
          const text = result.response.text();
          if (text) return text;
        } catch (e: any) {
          console.error(`Gemini Error (${modelName}):`, e.message);

          // Only push error if it's the last model we tried
          if (modelName === modelsToTry[modelsToTry.length - 1]) {
            errors.push(`Gemini Error (Last attempt ${modelName}): ${e.message}`);
          }
        }
      }
      return null;
    };

    const tryOpenAI = async () => {
      if (!settings.openai_api_key) {
        errors.push("OpenAI API Key eksik");
        return null;
      }
      try {
        const openai = new OpenAI({ apiKey: settings.openai_api_key });
        const modelName = (preferredProvider === 'openai' && preferredModel) ? preferredModel : (settings.openai_model || "gpt-4o");

        const content: any[] = [{ type: "text", text: fullPrompt }];
        imageParts.forEach(part => {
          content.push({
            type: "image_url",
            image_url: { url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` }
          });
        });

        const completion = await openai.chat.completions.create({
          messages: [
            { role: "system", content: `You are a professional fortune teller. ${languageInstruction}` },
            { role: "user", content: content as any }
          ],
          model: modelName,
        });
        return completion.choices[0].message.content || "";
      } catch (e: any) {
        console.error("OpenAI Error:", e);
        errors.push(`OpenAI Error: ${e.message}`);
        return null;
      }
    };

    const tryClaude = async () => {
      if (!settings.claude_api_key) {
        errors.push("Claude API Key eksik");
        return null;
      }
      try {
        const anthropic = new Anthropic({ apiKey: settings.claude_api_key });
        const modelName = (preferredProvider === 'claude' && preferredModel) ? preferredModel : (settings.claude_model || "claude-3-opus-20240229");
        const msg = await anthropic.messages.create({
          model: modelName,
          max_tokens: 1024,
          messages: [{ role: "user", content: fullPrompt }],
        });
        // @ts-ignore
        return msg.content[0].text;
      } catch (e: any) {
        console.error("Claude Error:", e);
        errors.push(`Claude Error: ${e.message}`);
        return null;
      }
    };

    // 4. Execution Logic
    // Priority: Preferred -> Gemini -> OpenAI -> Claude

    // Try preferred first
    if (preferredProvider === 'gemini') responseText = await tryGemini() || "";
    else if (preferredProvider === 'openai') responseText = await tryOpenAI() || "";
    else if (preferredProvider === 'claude') responseText = await tryClaude() || "";

    // If failed, try fallback chain (skipping the one we already tried)
    if (!responseText) {
      if (preferredProvider !== 'gemini') responseText = await tryGemini() || "";
    }
    if (!responseText) {
      if (preferredProvider !== 'openai') responseText = await tryOpenAI() || "";
    }
    if (!responseText) {
      if (preferredProvider !== 'claude') responseText = await tryClaude() || "";
    }

    if (!responseText) {
      return NextResponse.json({
        error: "Hiçbir AI sağlayıcısı yanıt vermedi. Detaylar: " + errors.join(", ")
      }, { status: 500 });
    }

    return NextResponse.json({ response: responseText });

  } catch (error: any) {
    console.error("AI Generation Error:", error);
    return NextResponse.json({ error: error.message || "Bir hata oluştu." }, { status: 500 });
  }
}
