import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

type ProviderModels = {
  claude: string[];
  gemini: string[];
  openai: string[];
};

// Fallback listesini güncel ve garanti modellerle tutuyoruz
const fallbackModels: ProviderModels = {
  claude: ["claude-3-5-sonnet-20240620", "claude-3-opus-20240229", "claude-3-sonnet-20240229"],
  gemini: ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-1.0-pro"],
  openai: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"],
};

async function fetchOpenAIModels(apiKey?: string): Promise<string[]> {
  if (!apiKey) return fallbackModels.openai;
  try {
    const res = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    });
    if (!res.ok) return fallbackModels.openai;
    
    const json = (await res.json()) as { data?: { id: string }[] };
    const ids = json.data?.map((m) => m.id) ?? [];
    
    // Sadece GPT ve o1 modellerini al, audio/realtime gibi gereksizleri ele
    const chatModels = ids.filter((id) => 
      (id.startsWith("gpt-4") || id.startsWith("gpt-3.5") || id.startsWith("o1-")) &&
      !id.includes("audio") && 
      !id.includes("realtime")
    );

    // Alfabetik sırala ama tersine (Genelde yeni modeller üstte kalsın diye)
    return chatModels.sort().reverse().slice(0, 15); 
  } catch {
    return fallbackModels.openai;
  }
}

async function fetchGeminiModels(apiKey?: string): Promise<string[]> {
  if (!apiKey) return fallbackModels.gemini;
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
      cache: "no-store",
    });
    if (!res.ok) return fallbackModels.gemini;
    
    const json = (await res.json()) as { models?: { name: string }[] };
    
    // API "models/gemini-1.5-flash" döner, biz sadece "gemini-1.5-flash" kısmını almalıyız.
    const ids = json.models?.map((m) => m.name.split("/").pop() || m.name) ?? [];

    // Filtreleme: Embedding modellerini ve vision-only eski modelleri çıkar
    const chatModels = ids.filter((id) => 
      id.startsWith("gemini") && 
      !id.includes("embedding") &&
      !id.includes("bison") // Eski model
    );

    // Versiyon önceliği: Experimental veya yeni versiyonları üste taşıyalım
    return chatModels.sort((a, b) => {
        // "exp" veya "2.0" içerenleri yukarı al
        const aScore = (a.includes("1.5") ? 2 : 0) + (a.includes("flash") ? 1 : 0) + (a.includes("2.0") ? 3 : 0);
        const bScore = (b.includes("1.5") ? 2 : 0) + (b.includes("flash") ? 1 : 0) + (b.includes("2.0") ? 3 : 0);
        return bScore - aScore;
    });
  } catch {
    return fallbackModels.gemini;
  }
}

async function fetchClaudeModels(apiKey?: string): Promise<string[]> {
  if (!apiKey) return fallbackModels.claude;
  try {
    const res = await fetch("https://api.anthropic.com/v1/models", {
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      cache: "no-store",
    });
    if (!res.ok) return fallbackModels.claude;
    
    const json = (await res.json()) as { data?: { id: string }[] };
    const ids = json.data?.map((m) => m.id) ?? [];
    
    // Sadece Claude modellerini al
    return ids.filter((id) => id.startsWith("claude")).sort().reverse();
  } catch {
    return fallbackModels.claude;
  }
}

export async function GET() {
  const { data } = await supabaseAdmin
    .from("ai_settings")
    .select("claude_api_key, gemini_api_key, openai_api_key")
    .eq("id", 1)
    .maybeSingle();

  const [claude, gemini, openai] = await Promise.all([
    fetchClaudeModels(data?.claude_api_key ?? undefined),
    fetchGeminiModels(data?.gemini_api_key ?? undefined),
    fetchOpenAIModels(data?.openai_api_key ?? undefined),
  ]);

  const payload: ProviderModels = {
    claude: claude.length ? claude : fallbackModels.claude,
    gemini: gemini.length ? gemini : fallbackModels.gemini,
    openai: openai.length ? openai : fallbackModels.openai,
  };

  return NextResponse.json(payload, { status: 200 });
}
