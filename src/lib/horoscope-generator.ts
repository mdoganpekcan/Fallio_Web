import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

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
  
  const apiKey = (settings?.gemini_api_key || process.env.GEMINI_API_KEY || "").trim();
  
  if (!apiKey) {
    console.error("Gemini API Key not found in settings or env");
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = settings?.gemini_model || "gemini-1.5-flash";

  const model = genAI.getGenerativeModel({ 
    model: modelName,
    safetySettings: [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ]
  });

  const today = new Date().toISOString().split('T')[0];

  console.log(`Generating daily horoscopes for ${today}...`);

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

    try {
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text().replace(/```json|```/g, '').trim();
      const data = JSON.parse(text);

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
      console.error(`Failed to generate for ${sign}:`, e);
    }
  }
}
