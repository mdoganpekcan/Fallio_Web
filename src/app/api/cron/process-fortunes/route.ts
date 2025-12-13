import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

export async function GET(req: Request) {
  try {
    // 1. Güvenlik Kontrolü
    // Hem Cron (Vercel) hem de Mobil Uygulama (API Key) erişebilmeli
    const authHeader = req.headers.get('authorization');
    const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;
    const isApp = authHeader === `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`; // Mobilden gelen anon key'i kabul et
    const isDev = process.env.NODE_ENV === 'development';
    
    if (!isCron && !isApp && !isDev) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Bekleyen AI Fallarını Çek
    // Not: is_ai = true olan falcıya atanmış ve status = pending olanlar
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
      .limit(5); // Her çalışmada en fazla 5 fal işle (Timeout riskine karşı)

    if (fetchError) {
      console.error("Error fetching fortunes:", fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!fortunes || fortunes.length === 0) {
      return NextResponse.json({ message: "İşlenecek fal yok.", processed: 0 });
    }

    // 3. AI Ayarlarını Çek
    const { data: settings } = await supabaseAdmin.from("ai_settings").select("*").single();
    if (!settings?.gemini_api_key) {
      return NextResponse.json({ error: "Gemini API Key eksik" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(settings.gemini_api_key);
    const results = [];

    // 4. Falları İşle
    for (const fortune of fortunes) {
      try {
        // Prompt Hazırlığı
        let prompt = settings.base_prompt || "Sen deneyimli bir falcısın. Kullanıcının falını yorumla.";
        prompt = prompt.replace("{{fortune_type}}", fortune.type);
        
        let extraDetails = "";
        if (fortune.metadata) {
          const meta = fortune.metadata as any;
          if (meta.selected_cards) extraDetails += `\n- Seçilen Kartlar: ${Array.isArray(meta.selected_cards) ? meta.selected_cards.join(", ") : meta.selected_cards}`;
          if (meta.selected_color) extraDetails += `\n- Seçilen Renk: ${meta.selected_color}`;
          if (meta.category) extraDetails += `\n- Kategori: ${meta.category}`;
        }

        const user = fortune.users as any;
        const userContext = `
        Kullanıcı Bilgileri:
        - İsim: ${user?.full_name || "Gizli"}
        - Burç: ${user?.zodiac_sign || "Bilinmiyor"}
        - Cinsiyet: ${user?.gender || "Bilinmiyor"}
        - Meslek: ${user?.job || "Bilinmiyor"}
        - Fal Türü: ${fortune.type}
        - Kullanıcı Notu: ${fortune.user_note || "Yok"}${extraDetails}
        `;

        const fullPrompt = `${prompt}\n\n${userContext}\n\nLütfen samimi, gizemli ve etkileyici bir dille fal yorumunu yap. Cevabın sadece fal yorumu olsun.`;

        // Model Seçimi (Falcı tercihine göre veya varsayılan)
        // Şimdilik sadece Gemini destekliyoruz bu cron'da basitlik için
        let modelName = "gemini-1.5-flash";
        if (fortune.fortune_tellers?.ai_model && fortune.fortune_tellers.ai_model.includes("gemini")) {
            modelName = fortune.fortune_tellers.ai_model;
        }

        const model = genAI.getGenerativeModel({ 
            model: modelName,
            safetySettings: [
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            ]
        });

        const result = await model.generateContent(fullPrompt);
        const responseText = result.response.text();

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

        results.push({ id: fortune.id, status: "success" });
        
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
