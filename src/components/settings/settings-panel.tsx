"use client";

import { upsertAISettings, upsertAdminUser, upsertSetting, upsertAppConfig } from "@/lib/actions/admin";
import type { AISettings, AdminUser, Settings, AppConfig } from "@/types";
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
  appConfig: AppConfig;
};

export function SettingsPanel({ settings, admins, aiSettings, appConfig }: Props) {
  const [aiEnabled, setAiEnabled] = useState(settings.ai_enabled);
  const [pending, startTransition] = useTransition();
  const [aiPending, startAiTransition] = useTransition();
  const [configPending, startConfigTransition] = useTransition();
  const [maintenanceMode, setMaintenanceMode] = useState(appConfig.maintenance_mode);

  const safeAI =
    aiSettings ?? {
      id: 1,
      base_prompt: "",
      active_provider: "gemini",
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
      { label: "gemini-1.5-flash", value: "gemini-1.5-flash" },
      { label: "gemini-2.0-flash", value: "gemini-2.0-flash" },
      { label: "gemini-1.5-pro", value: "gemini-1.5-pro" },
      { label: "gemini-pro", value: "gemini-pro" },
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
      <Card className="xl:col-span-2">
        <CardHeader
          title="Uygulama Yapılandırması"
          description="Kredi, ödül ve bakım modu ayarları."
        />
        <CardContent className="space-y-4">
          <form
            action={(formData) =>
              startConfigTransition(async () => {
                const res = await upsertAppConfig(formData);
                if (res?.error) {
                  alert(res.error);
                }
              })
            }
            className="space-y-6"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      Bakım Modu
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Uygulamayı geçici olarak erişime kapatın.
                    </p>
                  </div>
                  <Switch
                    checked={maintenanceMode}
                    onCheckedChange={(value) => setMaintenanceMode(value)}
                  />
                  <input
                    type="hidden"
                    name="maintenance_mode"
                    value={maintenanceMode ? "on" : "off"}
                    readOnly
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white">İletişim E-postası</label>
                <Input
                  name="contact_email"
                  defaultValue={appConfig.contact_email}
                  placeholder="destek@fallio.com"
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white">Reklam Ödülü (Kredi)</label>
                <Input
                  name="ad_reward_amount"
                  type="number"
                  defaultValue={appConfig.ad_reward_amount}
                  min={0}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white">Hoşgeldin Kredisi</label>
                <Input
                  name="welcome_credits"
                  type="number"
                  defaultValue={appConfig.welcome_credits}
                  min={0}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white">Günlük Ücretsiz Fal Limiti</label>
                <Input
                  name="daily_free_fortune_limit"
                  type="number"
                  defaultValue={appConfig.daily_free_fortune_limit}
                  min={0}
                  placeholder="0 = Kapalı"
                  required
                />
                <p className="text-xs text-[var(--muted-foreground)]">0 girerseniz özellik kapanır.</p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-white border-b border-[var(--border)] pb-2">Fal Fiyatları (Kredi)</p>
              <div className="grid gap-4 md:grid-cols-4">
                {Object.entries(appConfig.fortune_costs || {}).map(([type, cost]) => (
                  <div key={type} className="space-y-1">
                    <label className="text-xs font-medium text-[var(--muted-foreground)] capitalize">{type}</label>
                    <Input
                      name={`cost_${type}`}
                      type="number"
                      defaultValue={cost}
                      min={0}
                      required
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={configPending}>
                Yapılandırmayı Kaydet
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

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

            <div className="md:col-span-2 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 space-y-2">
              <p className="text-sm font-bold text-yellow-500">Varsayılan Yapay Zeka Sağlayıcısı</p>
              <p className="text-xs text-[var(--muted-foreground)]">
                Tüm projede (aksi belirtilmedikçe) kullanılacak ana yapay zeka servisini seçin.
              </p>
              <Select
                name="active_provider"
                defaultValue={safeAI.active_provider || "gemini"}
                options={[
                  { label: "Google Gemini (Önerilen)", value: "gemini" },
                  { label: "Anthropic Claude", value: "claude" },
                  { label: "OpenAI ChatGPT", value: "openai" },
                ]}
              />
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-sm font-semibold text-white">Claude (Anthropic)</p>
                {safeAI.active_provider === "claude" && <Badge variant="success">Aktif</Badge>}
              </div>
              <Input
                name="claude_api_key"
                type="password"
                placeholder="Claude API Key"
                defaultValue={safeAI.claude_api_key ?? ""}
              />
              <Select
                name="claude_model"
                defaultValue={safeAI.claude_model || providerModels.claude[0]?.value}
                options={providerModels.claude}
                placeholder="Model Seçin"
              />
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-sm font-semibold text-white">Gemini (Google)</p>
                {safeAI.active_provider === "gemini" && <Badge variant="success">Aktif</Badge>}
              </div>
              <Input
                name="gemini_api_key"
                type="password"
                placeholder="Gemini API Key"
                defaultValue={safeAI.gemini_api_key ?? ""}
              />
              <Select
                name="gemini_model"
                defaultValue={safeAI.gemini_model || providerModels.gemini[0]?.value}
                options={providerModels.gemini}
                placeholder="Model Seçin"
              />
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-sm font-semibold text-white">ChatGPT (OpenAI)</p>
                {safeAI.active_provider === "openai" && <Badge variant="success">Aktif</Badge>}
              </div>
              <Input
                name="openai_api_key"
                type="password"
                placeholder="OpenAI API Key"
                defaultValue={safeAI.openai_api_key ?? ""}
              />
              <Select
                name="openai_model"
                defaultValue={safeAI.openai_model || providerModels.openai[0]?.value}
                options={providerModels.openai}
                placeholder="Model Seçin"
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
