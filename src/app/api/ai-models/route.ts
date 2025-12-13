import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

type ProviderModels = {
  claude: string[];
  gemini: string[];
  openai: string[];
};

const fallbackModels: ProviderModels = {
  claude: ["claude-3-opus-20240229", "claude-3-sonnet-20240229", "claude-3-haiku-20240307"],
  gemini: ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-pro-vision"],
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
    // Filter to chat-capable models we care about
    return ids.filter((id) => id.includes("gpt-4") || id.includes("gpt-4o") || id.includes("gpt-3.5")).slice(0, 10);
  } catch {
    return fallbackModels.openai;
  }
}

async function fetchGeminiModels(apiKey?: string): Promise<string[]> {
  if (!apiKey) return fallbackModels.gemini;
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`, {
      cache: "no-store",
    });
    if (!res.ok) return fallbackModels.gemini;
    const json = (await res.json()) as { models?: { name: string }[] };
    const ids = json.models?.map((m) => m.name.split("/").pop() || m.name) ?? [];
    return ids.filter((id) => id.startsWith("gemini")).slice(0, 10);
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
    return ids.filter((id) => id.startsWith("claude")).slice(0, 10);
  } catch {
    return fallbackModels.claude;
  }
}

export async function GET() {
  // Load keys from ai_settings (id=1)
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
