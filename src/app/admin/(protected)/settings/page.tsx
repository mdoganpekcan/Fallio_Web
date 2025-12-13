import { PageHeader } from "@/components/layout/page-header";
import { SettingsPanel } from "@/components/settings/settings-panel";
import { fetchAISettings, fetchAdmins, fetchSettings } from "@/lib/data";

export default async function SettingsPage() {
  const [settings, admins, aiSettings] = await Promise.all([
    fetchSettings().catch(() => ({
      theme: "dark",
      ai_enabled: false,
      support_email: "",
    })),
    fetchAdmins().catch(() => []),
    fetchAISettings().catch(() => ({
      id: 1,
      base_prompt: "",
      claude_api_key: null,
      claude_model: "",
      gemini_api_key: null,
      gemini_model: "",
      openai_api_key: null,
      openai_model: "",
      updated_at: null,
    })),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ayarlar"
        description="Tema, yapay zeka modülü, sosyal bağlantılar ve yönetici hesapları."
      />
      <SettingsPanel settings={settings as any} admins={admins} aiSettings={aiSettings} />
    </div>
  );
}
