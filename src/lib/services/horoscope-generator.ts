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
  let modelName = "gemini-1.5-flash"; // Başlangıç varsayılanı (fallback)
  
  try {
    console.log("Gemini modelleri listeleniyor...");
    const listResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    
    if (!listResponse.ok) {
      console.error(`Model listesi alınamadı. Status: ${listResponse.status}`);
      // Hata durumunda varsayılan ile devam etmeye çalışır
    } else {
      const data = await listResponse.json();
      
      if (data.models) {
        // generateContent metodunu destekleyen modelleri filtrele
        const availableModels = data.models
          .filter((m: any) => m.supportedGenerationMethods?.includes("generateContent"))
          .map((m: any) => m.name.replace("models/", ""));

        console.log("Kullanılabilir Gemini Modelleri:", availableModels);

        if (availableModels.length > 0) {
            // Öncelik sırasına göre model seçimi (Hızlı ve ücretsiz modeller öncelikli)
            // gemini-1.5-flash genellikle günlük 1500 istek limitiyle en cömert olanıdır.
            // gemini-2.5-flash şu an 20/gün limitli olabilir.
            const preferredModels = [
                "gemini-1.5-flash",
                "gemini-2.0-flash",
                "gemini-flash-latest",
                "gemini-1.5-pro",
                "gemini-pro",
                "gemini-2.5-flash" // Düşük limitli olduğu için sona aldık
            ];

            let selectedModel = null;

            // 1. Tam eşleşme ara (Exact Match) - Kararlı sürümleri bulmak için
            for (const pref of preferredModels) {
                if (availableModels.includes(pref)) {
                    selectedModel = pref;
                    break;
                }
            }

            // 2. Eğer tam eşleşme yoksa, ismin içinde geçeni ara (Fallback)
            if (!selectedModel) {
                for (const pref of preferredModels) {
                    const match = availableModels.find((m: string) => m.includes(pref));
                    if (match) {
                        selectedModel = match;
                        break;
                    }
                }
            }

            // 2. Eğer tercih edilenlerden hiçbiri yoksa, listenin ilkini seç (En azından çalışsın)
            if (!selectedModel) {
                selectedModel = availableModels[0];
                console.warn("Tercih edilen modeller bulunamadı, listedeki ilk model seçiliyor.");
            }

            modelName = selectedModel;
        } else {
            console.warn("API'den dönen uygun model bulunamadı.");
        }
      }
    }
  } catch (e) {
    console.error("Model seçimi sırasında hata oluştu:", e);
  }

  console.log(`Seçilen Aktif Model: ${modelName}`);

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

      let retryCount = 0;
      const maxRetries = 3;
      let success = false;

      while (!success && retryCount < maxRetries) {
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
          success = true;

          // Rate limit için bekle (Başarılı işlemden sonra)
          await new Promise(resolve => setTimeout(resolve, 10000)); // 10 saniye bekle

        } catch (err: any) {
          console.error(`Error processing ${sign} (${type}) - Attempt ${retryCount + 1}:`, err.message);
          
          if (err.message?.includes("429") || err.status === 429) {
             retryCount++;
             const waitTime = 15000 * retryCount; // 15s, 30s, 45s bekle
             console.log(`Rate limit aşıldı. ${waitTime / 1000} saniye bekleniyor...`);
             await new Promise(resolve => setTimeout(resolve, waitTime));
          } else {
             // Diğer hatalarda döngüyü kır
             results.push({ sign, type, status: "error", error: err.message });
             break;
          }
        }
      }
      
      if (!success && retryCount >= maxRetries) {
          results.push({ sign, type, status: "error", error: "Max retries exceeded due to rate limits." });
      }
    }
  }

  return results;
}
