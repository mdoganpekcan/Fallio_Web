import { PageHeader } from "@/components/layout/page-header";
import { SettingsPanel } from "@/components/settings/settings-panel";
import { fetchAISettings, fetchAdmins, fetchSettings, fetchAppConfig } from "@/lib/data";

export default async function SettingsPage() {
  const [settings, admins, aiSettings, appConfig] = await Promise.all([
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
    fetchAppConfig().catch(() => ({
      id: 1,
      ad_reward_amount: 1,
      welcome_credits: 500,
      daily_free_fortune_limit: 0,
      maintenance_mode: false,
      contact_email: "destek@fallio.com",
      fortune_costs: {
        coffee: 50,
        tarot: 150,
        palm: 150,
        dream: 5,
        love: 100,
        card: 100,
        color: 50
      },
    })),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ayarlar"
        description="Tema, yapay zeka modülü, uygulama yapılandırması ve yönetici hesapları."
      />
      <SettingsPanel 
        settings={settings as any} 
        admins={admins} 
        aiSettings={aiSettings} 
        appConfig={appConfig}
      />
    </div>
  );
}
