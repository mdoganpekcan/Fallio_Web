"use client";

import { upsertAISettings, upsertAdminUser, upsertSetting } from "@/lib/actions/admin";
import type { AISettings, AdminUser, Settings } from "@/types";
import { useEffect, useState, useTransition } from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import { Switch } from "../ui/switch";
import { Table } from "../tables/table";
import { Textarea } from "../ui/textarea";

type Props = {
  settings: Settings;
  admins: AdminUser[];
  aiSettings: AISettings;
};

export function SettingsPanel({ settings, admins, aiSettings }: Props) {
  const [aiEnabled, setAiEnabled] = useState(settings.ai_enabled);
  const [pending, startTransition] = useTransition();
  const [aiPending, startAiTransition] = useTransition();
  const safeAI =
    aiSettings ?? {
      id: 1,
      base_prompt: "",
      claude_api_key: null,
      claude_model: "",
      gemini_api_key: null,
      gemini_model: "",
      openai_api_key: null,
      openai_model: "",
      updated_at: null,
    };
  const [providerModels, setProviderModels] = useState({
    claude: [
      { label: "claude-3-opus-20240229", value: "claude-3-opus-20240229" },
      { label: "claude-3-sonnet-20240229", value: "claude-3-sonnet-20240229" },
      { label: "claude-3-haiku-20240307", value: "claude-3-haiku-20240307" },
    ],
    gemini: [
      { label: "gemini-1.5-pro", value: "gemini-1.5-pro" },
      { label: "gemini-1.5-flash", value: "gemini-1.5-flash" },
      { label: "gemini-pro-vision", value: "gemini-pro-vision" },
    ],
    openai: [
      { label: "gpt-4o", value: "gpt-4o" },
      { label: "gpt-4o-mini", value: "gpt-4o-mini" },
      { label: "gpt-4-turbo", value: "gpt-4-turbo" },
    ],
  });

  useEffect(() => {
    const loadModels = async () => {
      try {
        const res = await fetch("/api/ai-models", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as { claude: string[]; gemini: string[]; openai: string[] };
        setProviderModels({
          claude: json.claude.map((m) => ({ label: m, value: m })),
          gemini: json.gemini.map((m) => ({ label: m, value: m })),
          openai: json.openai.map((m) => ({ label: m, value: m })),
        });
      } catch {
        // fallback to defaults
      }
    };
    loadModels();
  }, []);

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr,360px]">
      <Card>
        <CardHeader
          title="Genel Ayarlar"
          description="Tema, yapay zeka modülü ve iletişim bilgileri."
        />
        <CardContent className="space-y-4">
          <form
            action={(formData) =>
              startTransition(async () => {
                const res = await upsertSetting(formData);
                if (res?.error) {
                  alert(res.error);
                }
              })
            }
            className="space-y-4"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      Yapay Zeka Falcı Modülü
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      AI modülünü aktif veya pasif hale getirin.
                    </p>
                  </div>
                  <Switch
                    checked={aiEnabled}
                    onCheckedChange={(value) => setAiEnabled(value)}
                  />
                  <input
                    type="hidden"
                    name="ai_enabled"
                    value={String(aiEnabled)}
                    readOnly
                  />
                </div>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 space-y-3">
                <p className="text-sm font-semibold text-white">Tema Seçimi</p>
                <div className="flex gap-3">
                  <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-sm font-semibold">
                    <input
                      type="radio"
                      name="theme"
                      value="light"
                      defaultChecked={settings.theme === "light"}
                    />
                    Light
                  </label>
                  <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-sm font-semibold">
                    <input
                      type="radio"
                      name="theme"
                      value="dark"
                      defaultChecked={settings.theme === "dark"}
                    />
                    Dark
                  </label>
                </div>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                name="support_email"
                placeholder="Destek Email"
                defaultValue={settings.support_email}
                required
              />
              <Input
                name="instagram"
                placeholder="Instagram"
                defaultValue={settings.instagram}
              />
              <Input
                name="twitter"
                placeholder="X (Twitter)"
                defaultValue={settings.twitter}
              />
              <Input
                name="facebook"
                placeholder="Facebook"
                defaultValue={settings.facebook}
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={pending}>
                Değişiklikleri Kaydet
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title="Destek & Sosyal Medya"
          description="İletişim ve sosyal hesap bağlantıları."
        />
        <CardContent className="space-y-3">
          <div className="space-y-2 text-sm">
            <p className="text-[var(--muted-foreground)]">Destek Email</p>
            <p className="font-semibold text-white">{settings.support_email}</p>
          </div>
          <div className="space-y-2 text-sm">
            <p className="text-[var(--muted-foreground)]">Instagram</p>
            <p className="font-semibold text-white">{settings.instagram}</p>
          </div>
          <div className="space-y-2 text-sm">
            <p className="text-[var(--muted-foreground)]">X (Twitter)</p>
            <p className="font-semibold text-white">{settings.twitter}</p>
          </div>
          <div className="space-y-2 text-sm">
            <p className="text-[var(--muted-foreground)]">Facebook</p>
            <p className="font-semibold text-white">{settings.facebook}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="xl:col-span-2">
        <CardHeader
          title="AI & BASE Prompt"
          description="Yapay zeka falcıları için temel prompt ve API ayarları."
        />
        <CardContent className="space-y-4">
          <form
            action={(formData) =>
              startAiTransition(async () => {
                const res = await upsertAISettings(formData);
                if (res?.error) {
                  alert(res.error);
                }
              })
            }
            className="grid gap-4 md:grid-cols-2"
          >
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-semibold text-white">Base Prompt</label>
              <Textarea
                name="base_prompt"
                defaultValue={safeAI.base_prompt}
                placeholder="Örnek: Sen {{fortune_type}} konusunda uzman bir falcısın. Kullanıcının notlarını ve görsellerini gerçek bir falcı gibi yorumla..."
                rows={4}
                required
              />
              <p className="text-xs text-[var(--muted-foreground)]">
                Not: <code className="rounded bg-black/30 px-1 py-0.5">{"{{fortune_type}}"}</code> değişkeni fal türüne göre otomatik
                yerleştirilebilir.
              </p>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 space-y-2">
              <p className="text-sm font-semibold text-white">Claude (Anthropic)</p>
              <Input
                name="claude_api_key"
                type="password"
                placeholder="Claude API Key"
                defaultValue={safeAI.claude_api_key ?? ""}
              />
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 space-y-2">
              <p className="text-sm font-semibold text-white">Gemini (Google)</p>
              <Input
                name="gemini_api_key"
                type="password"
                placeholder="Gemini API Key"
                defaultValue={safeAI.gemini_api_key ?? ""}
              />
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 space-y-2">
              <p className="text-sm font-semibold text-white">ChatGPT (OpenAI)</p>
              <Input
                name="openai_api_key"
                type="password"
                placeholder="OpenAI API Key"
                defaultValue={safeAI.openai_api_key ?? ""}
              />
            </div>

            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" disabled={aiPending}>
                AI Ayarlarını Kaydet
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="xl:col-span-2">
        <CardHeader
          title="Yönetici Hesapları"
          description="Admin ve moderatör rollerini yönetin."
          action={<Badge variant="default">Toplam {admins.length}</Badge>}
        />
        <CardContent className="space-y-4">
          <Table
            data={admins}
            columns={[
              { key: "display_name", header: "Kullanıcı", render: (admin) => admin.display_name ?? admin.email },
              { key: "email", header: "Email" },
              {
                key: "role",
                header: "Rol",
                render: (admin) => (
                  <Badge variant={admin.role === "admin" ? "success" : "muted"}>
                    {admin.role}
                  </Badge>
                ),
              },
            ]}
            empty="Admin bulunamadı."
          />

          <form
            action={(formData) =>
              startTransition(async () => {
                const res = await upsertAdminUser(formData);
                if (res?.error) {
                  alert(res.error);
                }
              })
            }
            className="grid gap-3 rounded-xl bg-[var(--card)] p-4 md:grid-cols-5"
          >
            <Input name="display_name" placeholder="İsim" required />
            <Input name="email" placeholder="Email" type="email" required />
            <Input name="password" placeholder="Şifre (Yeni kullanıcı için zorunlu)" type="password" />
            <Select
              name="role"
              options={[
                { label: "Admin", value: "admin" },
                { label: "Moderator", value: "moderator" },
                { label: "Falcı", value: "fortune_teller" },
              ]}
            />
            <div className="md:col-span-1 flex justify-end md:justify-start">
              <Button type="submit" disabled={pending}>
                + Ekle
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
