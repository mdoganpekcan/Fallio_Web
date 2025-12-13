"use client";

import { upsertTeller, deleteTeller, toggleTellerStatus } from "@/lib/actions/admin";
import type { FortuneTeller } from "@/types";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "../layout/page-header";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import { Table } from "../tables/table";
import { Avatar } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Modal } from "../ui/modal";
import { Star, Trash2, Power, Edit } from "lucide-react";

type Props = {
  initialTellers: FortuneTeller[];
};

export function TellersBoard({ initialTellers }: Props) {
  const [open, setOpen] = useState(false);
  const [isAi, setIsAi] = useState(false);
  const [aiProvider, setAiProvider] = useState<string>("");
  const [aiModel, setAiModel] = useState<string>("");
  const [editing, setEditing] = useState<FortuneTeller | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const [providerModels, setProviderModels] = useState<Record<string, string[]>>({
    claude: ["claude-3-opus-20240229", "claude-3-sonnet-20240229", "claude-3-haiku-20240307"],
    gemini: ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-pro-vision"],
    chatgpt: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"],
  });

  useEffect(() => {
    const loadModels = async () => {
      try {
        const res = await fetch("/api/ai-models");
        if (res.ok) {
          const json = await res.json();
          setProviderModels({
            claude: json.claude,
            gemini: json.gemini,
            chatgpt: json.openai,
          });
        }
      } catch (e) {
        console.error("Failed to load AI models", e);
      }
    };
    loadModels();
  }, []);

  useEffect(() => {
    setIsAi(editing?.is_ai ?? false);
    if (editing?.is_ai) {
      setAiProvider(editing.ai_provider ?? "claude");
      const presetModels = providerModels[editing.ai_provider ?? "claude"];
      // If the saved model is in the list, use it. Otherwise default to first one.
      // Or keep the saved model even if not in list (custom model case)
      setAiModel(editing.ai_model ?? presetModels?.[0] ?? "");
    } else {
      setAiProvider("");
      setAiModel("");
    }
  }, [editing, providerModels]);

  useEffect(() => {
    if (isAi && !aiProvider) {
      setAiProvider("claude");
      setAiModel(providerModels.claude?.[0] ?? "");
    }
    // When provider changes, if current model is not in the new provider's list, reset it
    if (isAi && aiProvider) {
       const models = providerModels[aiProvider] || [];
       if (!models.includes(aiModel) && models.length > 0) {
          setAiModel(models[0]);
       }
    }
    if (!isAi) {
      setAiModel("");
    }
  }, [isAi, aiProvider, providerModels, aiModel]);

  const openModal = (teller?: FortuneTeller) => {
    setEditing(teller ?? null);
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setEditing(null);
    setIsAi(false);
    setAiProvider("");
    setAiModel("");
  };

  const handleProviderChange = (value: string) => {
    setAiProvider(value);
    const preset = providerModels[value]?.[0] ?? "";
    setAiModel(preset);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Falcı Yönetimi"
        description="Falcları görüntüleyin, düzenleyin ve yeni falcı ekleyin."
        action={
          <Button className="px-5" onClick={() => openModal()}>
            + Yeni Falcı Ekle
          </Button>
        }
      />

      <Card>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Input placeholder="İsim veya uzmanlık ara" />
            <Select
              options={[
                { label: "Uzmanlık: Tümü", value: "all" },
                { label: "Tarot", value: "tarot" },
                { label: "Astroloji", value: "astro" },
                { label: "El Falı", value: "hand" },
              ]}
            />
            <Select
              options={[
                { label: "Durum: Tümü", value: "all" },
                { label: "Online", value: "online" },
                { label: "Offline", value: "offline" },
              ]}
            />
            <Select
              options={[
                { label: "AI / Human", value: "all" },
                { label: "Human", value: "human" },
                { label: "AI", value: "ai" },
              ]}
            />
          </div>

          <Table
            data={initialTellers}
            columns={[
              {
                key: "name",
                header: "Ad",
                render: (teller) => (
                  <div className="flex items-center gap-3">
                    <Avatar src={teller.avatar_url} name={teller.name} />
                    <div>
                      <p className="font-semibold text-white">{teller.name}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {teller.is_ai ? "AI" : "Human"}
                      </p>
                    </div>
                  </div>
                ),
              },
              {
                key: "expertise",
                header: "Uzmanlık Alanı",
                render: (teller) => (
                  <div className="flex flex-wrap gap-2">
                    {teller.expertise.map((tag) => (
                      <Badge key={tag} className="bg-[color-mix(in_srgb,var(--accent)_16%,transparent)]">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                ),
              },
              { key: "price", header: "Ücret (kredi)" },
              {
                key: "rating",
                header: "Rating",
                render: (teller) => (
                  <div className="flex items-center gap-1">
                    <Star size={16} className="text-yellow-400" fill="currentColor" />
                    <span>{teller.rating}</span>
                  </div>
                ),
              },
              {
                key: "is_online",
                header: "Durum",
                render: (teller) => (
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        teller.is_online ? "bg-[var(--success)]" : "bg-[var(--muted-foreground)]"
                      }`}
                    />
                    <span>{teller.is_online ? "Online" : "Offline"}</span>
                  </div>
                ),
              },
              {
                key: "is_ai",
                header: "AI/Human",
                render: (teller) => (
                  <div className="flex gap-2">
                    <Badge variant={!teller.is_ai ? "default" : "muted"}>Human</Badge>
                    <Badge variant={teller.is_ai ? "default" : "muted"}>AI</Badge>
                  </div>
                ),
              },
              {
                key: "ai_provider",
                header: "AI Sağlayıcı",
                render: (teller) => teller.ai_provider ?? "—",
              },
              {
                key: "actions",
                header: "İşlemler",
                render: (teller) => (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[var(--accent)]"
                      onClick={() => openModal(teller)}
                      title="Düzenle"
                    >
                      <Edit size={18} />
                    </Button>
                    
                    <form action={async (formData) => { await toggleTellerStatus(formData); }}>
                      <input type="hidden" name="id" value={teller.id} />
                      <input type="hidden" name="is_active" value={(!teller.is_active).toString()} />
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        type="submit"
                        title={teller.is_active !== false ? "Pasife Al" : "Aktif Et"}
                        className={teller.is_active !== false ? "text-green-500" : "text-gray-500"}
                      >
                        <Power size={18} />
                      </Button>
                    </form>

                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-500" 
                      title="Sil"
                      onClick={() => {
                        if(confirm("Bu falcıyı silmek istediğinize emin misiniz?")) {
                          startTransition(async () => {
                            const formData = new FormData();
                            formData.append("id", teller.id);
                            const res = await deleteTeller(formData);
                            if (res?.error) {
                              alert(res.error);
                            }
                          });
                        }
                      }}
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>
                ),
              },
            ]}
            empty="Falcı bulunamadı."
          />
        </CardContent>
      </Card>

      <Modal
        title={editing ? "Falcı Düzenle" : "Yeni Falcı Ekle"}
        description="Gerçek veya yapay zeka falcı bilgilerini ekleyin."
        open={open}
        onClose={closeModal}
        widthClass="max-w-3xl"
      >
        <form
          action={(formData) =>
            startTransition(async () => {
              const res = await upsertTeller(formData);
              if (res?.error) {
                alert(res.error);
                return;
              }
              closeModal();
              router.refresh();
            })
          }
          className="space-y-4"
        >
          <input type="hidden" name="id" value={editing?.id ?? ""} />
          <div className="grid gap-3 md:grid-cols-2">
            <Input name="name" placeholder="Falcı adı" defaultValue={editing?.name ?? ""} required />
            <Input
              name="avatar_url"
              placeholder="Avatar URL"
              defaultValue={editing?.avatar_url ?? ""}
            />
            <Input
              name="expertise"
              placeholder="Uzmanlıklar (örn: Tarot, Astroloji)"
              defaultValue={editing?.expertise?.join(", ") ?? ""}
              className="md:col-span-2"
            />
            <Input
              name="bio"
              placeholder="Kısa bio"
              defaultValue={(editing as { bio?: string })?.bio ?? ""}
              className="md:col-span-2"
            />
            <div className="space-y-1">
              <label className="text-sm font-medium text-[var(--muted-foreground)]">Ücret (Kredi)</label>
              <Input
                name="price"
                type="number"
                min="0"
                placeholder="0"
                defaultValue={editing?.price ?? 0}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-[var(--muted-foreground)]">Puan (0-5)</label>
              <Input
                name="rating"
                type="number"
                step="0.1"
                min="0"
                max="5"
                placeholder="5.0"
                defaultValue={editing?.rating ?? 5}
                required
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
              <input
                type="checkbox"
                name="is_online"
                defaultChecked={editing?.is_online ?? false}
              />
              Online (Müsait)
            </label>
            <label className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
              <input
                type="checkbox"
                name="is_active"
                defaultChecked={editing?.is_active ?? true}
              />
              Aktif (Listede Görünür)
            </label>
            <label className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
              <input
                type="checkbox"
                name="is_ai"
                checked={isAi}
                onChange={(e) => setIsAi(e.target.checked)}
              />
              Yapay Zeka Falcı
            </label>
            <Select
              name="ai_provider"
              options={[
                { label: "Claude", value: "claude" },
                { label: "Gemini", value: "gemini" },
                { label: "ChatGPT", value: "chatgpt" },
              ]}
              disabled={!isAi}
              required={isAi}
              value={aiProvider || undefined}
              onChange={(e) => handleProviderChange(e.target.value)}
            />
            <Select
              name="ai_model"
              options={
                providerModels[aiProvider]?.map((m) => ({ label: m, value: m })) ?? []
              }
              value={aiModel}
              onChange={(e) => setAiModel(e.target.value)}
              disabled={!isAi || !aiProvider}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={closeModal}>
              İptal
            </Button>
            <Button type="submit" disabled={pending}>
              Kaydet
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
