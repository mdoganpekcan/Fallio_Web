import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// Burç Listesi
const ZODIAC_SIGNS = [
  "koc", "boga", "ikizler", "yengec", "aslan", "basak",
  "terazi", "akrep", "yay", "oglak", "kova", "balik"
];

export async function GET(req: Request) {
  try {
    // Güvenlik Kontrolü (Vercel Cron veya Localhost)
    const authHeader = req.headers.get('authorization');
    const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;
    const isDev = process.env.NODE_ENV === 'development';
    
    if (!isCron && !isDev) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "daily"; // daily, weekly, monthly
    
    // 1. Ayarları Çek
    const { data: settings } = await supabaseAdmin.from("ai_settings").select("*").single();
    if (!settings?.gemini_api_key) {
      return NextResponse.json({ error: "Gemini API Key eksik" }, { status: 500 });
    }

    const apiKey = settings.gemini_api_key.trim();
    
    // Tarih Formatı Belirle
    const today = new Date();
    let dateRange = today.toISOString().split('T')[0]; // Varsayılan: YYYY-MM-DD
    
    if (type === 'weekly') {
        // Basitçe haftanın başı ve sonunu string yapalım
        const first = today.getDate() - today.getDay() + 1; 
        const last = first + 6;
        const firstDay = new Date(today.setDate(first)).toLocaleDateString("tr-TR");
        const lastDay = new Date(today.setDate(last)).toLocaleDateString("tr-TR");
        dateRange = `${firstDay} - ${lastDay}`;
    } else if (type === 'monthly') {
        dateRange = today.toLocaleDateString("tr-TR", { month: 'long', year: 'numeric' });
    }

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
                
                // Flash modelini önceliklendir (Hız ve maliyet için burçlarda flash iyidir)
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

    const results = [];

    // 3. Tüm Burçlar İçin Döngü
    // Not: Rate limit yememek için Promise.all yerine for döngüsü ile sırayla yapıyoruz.
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
            const text = result.response.text();
            
            // JSON Temizliği (Markdown \`\`\`json ... \`\`\` bloklarını temizle)
            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const content = JSON.parse(jsonStr);

            // Veritabanına Kaydet
            const { error } = await supabaseAdmin
                .from('horoscopes')
                .upsert({
                    zodiac_sign: sign,
                    period_type: type,
                    date_range: dateRange,
                    content: content,
                    created_at: new Date().toISOString()
                }, { onConflict: 'zodiac_sign, period_type, date_range' });

            if (error) throw error;
            results.push({ sign, status: "success" });

        } catch (error: any) {
            console.error(`Error generating for ${sign}:`, error);
            results.push({ sign, status: "error", message: error.message });
        }
    }

    return NextResponse.json({ 
        success: true, 
        date: dateRange,
        type,
        results 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

