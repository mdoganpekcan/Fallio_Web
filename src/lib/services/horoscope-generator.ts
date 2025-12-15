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

  // 2. Model Seçimi (Dinamik)
  let modelName = "gemini-1.5-flash"; // Varsayılan hızlı model
  try {
    const listResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (listResponse.ok) {
      const data = await listResponse.json();
      if (data.models) {
        const available = data.models
          .filter((m: any) => m.supportedGenerationMethods?.includes("generateContent"))
          .map((m: any) => m.name.replace("models/", ""));

        // Flash modelini önceliklendir
        if (available.some((m: string) => m.includes("1.5-flash"))) {
          modelName = available.find((m: string) => m.includes("1.5-flash")) || "gemini-1.5-flash";
        } else if (available.some((m: string) => m.includes("1.5-pro"))) {
          modelName = available.find((m: string) => m.includes("1.5-pro")) || "gemini-1.5-pro";
        }
      }
    }
  } catch (e) {
    console.warn("Model listesi çekilemedi, varsayılan kullanılıyor.");
  }

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

  // 3. Tüm Tipler ve Burçlar İçin Döngü
  for (const type of typesToProcess) {
    // Tarih Formatı Belirle (Her tip için ayrı)
    const today = new Date();
    let dateRange = today.toISOString().split('T')[0];

    if (type === 'weekly') {
      const first = today.getDate() - today.getDay() + 1;
      const last = first + 6;
      const firstDay = new Date(today.setDate(first)).toLocaleDateString("tr-TR");
      const lastDay = new Date(today.setDate(last)).toLocaleDateString("tr-TR");
      dateRange = `${firstDay} - ${lastDay}`;
    } else if (type === 'monthly') {
      dateRange = today.toLocaleDateString("tr-TR", { month: 'long', year: 'numeric' });
    }

    for (const sign of ZODIAC_SIGNS) {
      const prompt = `
            Sen profesyonel bir astrologsun. 
            Burç: ${sign}
            Dönem: ${type === 'daily' ? 'Bugün' : type === 'weekly' ? 'Bu Hafta' : 'Bu Ay'}
            
            Lütfen bu burç için JSON formatında yorum oluştur. 
            JSON şeması kesinlikle şöyle olmalı, başka hiçbir metin ekleme:
            {
                "general": "Genel yorum...",
                "love": "Aşk hayatı yorumu...",
                "career": "İş ve kariyer yorumu...",
                "health": "Sağlık yorumu..."
            }
            Yorumlar samimi, motive edici ve astrolojik terimlerle süslü olsun. Türkçe olsun.
            `;

      try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        // JSON Temizleme
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const content = JSON.parse(jsonStr);

        // DB'ye Kaydet
        const { error } = await supabaseAdmin
          .from('horoscopes')
          .upsert({
            sign: sign,
            scope: type, // daily, weekly, monthly
            general: content.general,
            love: content.love,
            money: content.career, // Şemada career -> money eşleşmesi
            health: content.health,
            effective_date: new Date().toISOString().split('T')[0], // Bugünün tarihi
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'sign,scope,effective_date'
          });

        if (error) throw error;

        results.push({ sign, type, status: "success" });

        // Rate limit için bekle
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (err: any) {
        console.error(`Error processing ${sign} (${type}):`, err);
        results.push({ sign, type, status: "error", error: err.message });
      }
    }
  }

  return results;
}
