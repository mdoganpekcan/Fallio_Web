import { supabaseAdmin } from "@/lib/supabase-admin";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const ZODIAC_SIGNS = [
  "koc", "boga", "ikizler", "yengec", "aslan", "basak",
  "terazi", "akrep", "yay", "oglak", "kova", "balik"
];

export async function generateHoroscopes(typesToProcess: string[]) {
  const results = [];

  // 1. Ayarları Çek
  const { data: settings } = await supabaseAdmin.from("ai_settings").select("*").single();
  if (!settings?.gemini_api_key) {
    throw new Error("Gemini API Key eksik");
  }

  const apiKey = settings.gemini_api_key.trim();

  // Model ismini temizle
  let rawModelName = settings.gemini_model || "gemini-1.5-flash";
  const modelName = rawModelName.replace("models/", "");

  console.log(`Seçilen Aktif Model: ${modelName}`);

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    safetySettings: [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ],
    generationConfig: {
      responseMimeType: "application/json"
    }
  });

  // 2. Döngü: Sadece TİP (Daily/Weekly) bazında döner
  const SUPPORTED_LANGUAGES = ['tr', 'en'];

  for (const type of typesToProcess) {
    for (const lang of SUPPORTED_LANGUAGES) {
      console.log(`[Batch] Processing horoscopes for type: ${type}, language: ${lang}`);

      const isTr = lang === 'tr';
      const periodText = type === 'daily' ? (isTr ? 'Bugün' : 'Today') : type === 'weekly' ? (isTr ? 'Bu Hafta' : 'This Week') : (isTr ? 'Bu Ay' : 'This Month');
      const langInstruction = isTr ? "Yanıtlar Türkçe olsun." : "Responses MUST be in English.";

      const prompt = `
          Sen profesyonel bir astrologsun.
          Dönem: ${periodText}
          Dil: ${lang}
          
          Aşağıdaki 12 burç için tek seferde yorum üret:
          ${ZODIAC_SIGNS.join(", ")}
    
          Lütfen yanıtı SADECE geçerli bir JSON formatında ver.
          Yanıt şu yapıda bir Array (Liste) olmalı:
          [
            {
              "sign": "koc",
              "general": "...",
              "love": "...",
              "career": "...",
              "health": "..."
            },
            ... diğer burçlar
          ]
          
          Kurallar:
          1. "sign" alanı kesinlikle şu listeden biri olmalı (küçük harf, Türkçe karakter yok): koc, boga, ikizler, yengec, aslan, basak, terazi, akrep, yay, oglak, kova, balik.
          2. Yorumlar samimi, motive edici ve ${langInstruction}
          3. "career" alanı iş ve para durumunu kapsamalıdır.
        `;

      try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        // JSON Temizleme
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        let horoscopesBatch;

        try {
          horoscopesBatch = JSON.parse(jsonStr);
        } catch (e) {
          console.error("JSON Parse Hatası:", text);
          continue; // Bu hatalı batch'i geç, diğer dile/tipe devam et
        }

        if (!Array.isArray(horoscopesBatch)) {
          console.error("AI yanıtı dizi değil");
          continue;
        }

        // 3. Gelen toplu veriyi veritabanına kaydet
        for (const item of horoscopesBatch) {
          const signKey = item.sign?.toLowerCase();

          if (!ZODIAC_SIGNS.includes(signKey)) {
            continue;
          }

          const { error } = await supabaseAdmin
            .from('horoscopes')
            .upsert({
              sign: signKey,
              scope: type,
              language: lang, // Yeni kolon
              general: item.general,
              love: item.love,
              money: item.career,
              health: item.health,
              effective_date: new Date().toISOString().split('T')[0],
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'sign,scope,effective_date,language' // Güncellenmiş Constraint
            });

          if (error) {
            console.error(`DB Error for ${signKey} (${lang}):`, error.message);
            results.push({ sign: signKey, type, lang, status: "error", error: error.message });
          } else {
            results.push({ sign: signKey, type, lang, status: "success" });
          }
        }

      } catch (err: any) {
        console.error(`Batch Error for ${type}/${lang}:`, err.message);
        results.push({ type, lang, status: "fatal_error", error: err.message });
      }

      // Rate limit koruması
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  return results;
}
