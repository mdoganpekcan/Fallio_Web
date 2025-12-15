import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey);

const ZODIAC_SIGNS = [
  "koc", "boga", "ikizler", "yengec", "aslan", "basak",
  "terazi", "akrep", "yay", "oglak", "kova", "balik"
];

const ZODIAC_NAMES: Record<string, string> = {
  "koc": "Koç", "boga": "Boğa", "ikizler": "İkizler", "yengec": "Yengeç",
  "aslan": "Aslan", "basak": "Başak", "terazi": "Terazi", "akrep": "Akrep",
  "yay": "Yay", "oglak": "Oğlak", "kova": "Kova", "balik": "Balık"
};

export async function generateDailyHoroscopes() {
  // Fetch settings
  const { data: settings } = await supabase.from("ai_settings").select("*").single();
  
  if (!settings) {
    console.error("AI Settings not found");
    return;
  }

  const activeProvider = settings.active_provider || "gemini";
  console.log(`Generating daily horoscopes using ${activeProvider}...`);

  const today = new Date().toISOString().split('T')[0];

  for (const sign of ZODIAC_SIGNS) {
    const signName = ZODIAC_NAMES[sign];
    const prompt = `
      ${signName} burcu için ${today} tarihli günlük burç yorumu yaz.
      Yanıtı sadece geçerli bir JSON formatında ver. Markdown kullanma.
      Format şöyle olmalı:
      {
        "general": "Genel yorum...",
        "love": "Aşk yorumu...",
        "career": "Kariyer yorumu...",
        "health": "Sağlık yorumu..."
      }
    `;

    let generatedText = "";

    try {
      if (activeProvider === "openai") {
        const apiKey = settings.openai_api_key;
        if (!apiKey) throw new Error("OpenAI API Key missing");
        
        const openai = new OpenAI({ apiKey });
        const completion = await openai.chat.completions.create({
          messages: [{ role: "user", content: prompt }],
          model: settings.openai_model || "gpt-4o",
          response_format: { type: "json_object" }
        });
        generatedText = completion.choices[0].message.content || "";

      } else if (activeProvider === "claude") {
        const apiKey = settings.claude_api_key;
        if (!apiKey) throw new Error("Claude API Key missing");

        const anthropic = new Anthropic({ apiKey });
        const msg = await anthropic.messages.create({
          model: settings.claude_model || "claude-3-opus-20240229",
          max_tokens: 1024,
          messages: [{ role: "user", content: prompt }],
        });
        // @ts-ignore
        generatedText = msg.content[0].text;

      } else {
        // Default to Gemini
        const apiKey = (settings.gemini_api_key || process.env.GEMINI_API_KEY || "").trim();
        if (!apiKey) throw new Error("Gemini API Key missing");

        const genAI = new GoogleGenerativeAI(apiKey);
        const modelName = settings.gemini_model || "gemini-1.5-flash";
        
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          ]
        });

        const result = await model.generateContent(prompt);
        generatedText = result.response.text();
      }

      // Parse JSON
      const cleanText = generatedText.replace(/```json|```/g, '').trim();
      const data = JSON.parse(cleanText);

      const { error } = await supabase.from('horoscope_daily').upsert({
        zodiac_sign: sign,
        date: today,
        general: data.general,
        love: data.love,
        career: data.career,
        health: data.health,
        created_at: new Date().toISOString()
      }, { onConflict: 'zodiac_sign,date' });

      if (error) console.error(`Error saving ${sign}:`, error);
      else console.log(`Saved ${sign}`);

    } catch (e) {
      console.error(`Failed to generate for ${sign} (${activeProvider}):`, e);
    }
  }
}
