"use client";

import { saveHoroscope } from "@/lib/actions/admin";
import { triggerHoroscopeGeneration } from "@/app/admin/(protected)/horoscopes/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useMemo, useState, useTransition } from "react";
import { Sparkles } from "lucide-react";

type HoroscopeRecord = {
  love?: string;
  money?: string;
  health?: string;
  general?: string;
};

const scopes = [
  { value: "daily", label: "Günlük" },
  { value: "weekly", label: "Haftalık" },
  { value: "monthly", label: "Aylık" },
];

const signs = [
  "Koç",
  "Boğa",
  "İkizler",
  "Yengeç",
  "Aslan",
  "Başak",
  "Terazi",
  "Akrep",
  "Yay",
  "Oğlak",
  "Kova",
  "Balık",
];

export function HoroscopeBoard({
  existing = {},
}: {
  existing?: Record<string, HoroscopeRecord>;
}) {
  const [scope, setScope] = useState<string>("daily");
  const [selectedSign, setSelectedSign] = useState<string>("Koç");
  const [pending, startTransition] = useTransition();
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!confirm(`${scopes.find(s => s.value === scope)?.label} burç yorumlarını şimdi oluşturmak istiyor musunuz? Bu işlem biraz zaman alabilir.`)) {
      return;
    }
    
    setGenerating(true);
    try {
      const result = await triggerHoroscopeGeneration(scope);
      if (result.success) {
        alert(result.message);
      } else {
        alert(`Hata: ${result.message}`);
      }
    } catch (e) {
      alert("Bir hata oluştu.");
    } finally {
      setGenerating(false);
    }
  };

  const current = useMemo(() => {
    const key = `${selectedSign}-${scope}`;
    return existing[key] ?? {};
  }, [existing, scope, selectedSign]);

  return (
    <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
      <div className="space-y-4">
        <Tabs items={scopes} defaultValue={scope} onChange={(val) => setScope(val)} />
        
        <Button 
          onClick={handleGenerate} 
          disabled={generating}
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0"
        >
          {generating ? (
            "Oluşturuluyor..."
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              {scopes.find(s => s.value === scope)?.label} Yorumlarını Üret
            </>
          )}
        </Button>

        <div className="grid grid-cols-2 gap-3">
          {signs.map((sign) => {
            const isActive = sign === selectedSign;
            return (
              <button
                key={sign}
                type="button"
                onClick={() => setSelectedSign(sign)}
                className={`flex flex-col rounded-xl border border-transparent bg-[var(--card)] p-3 text-left transition ${
                  isActive
                    ? "border-[var(--accent)] shadow-[0_12px_30px_rgba(124,92,255,0.22)]"
                    : "hover:border-[var(--border)]"
                }`}
              >
                <span className="text-sm font-semibold text-white">{sign}</span>
                <span className="text-xs text-[var(--muted-foreground)]">
                  {sign} burcu
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <form
        action={(formData) =>
          startTransition(async () => {
            formData.set("sign", selectedSign);
            formData.set("scope", scope);
            await saveHoroscope(formData);
          })
        }
        className="space-y-4"
      >
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--muted-foreground)]">Seçilen</p>
              <p className="text-lg font-semibold text-white">
                {selectedSign} - {scopes.find((s) => s.value === scope)?.label}
              </p>
            </div>
            <Badge>{scope}</Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-white">Aşk Yorumu</p>
              <Textarea
                name="love"
                rows={3}
                defaultValue={current.love}
                placeholder="Aşk hayatı ile ilgili yorumu buraya girin..."
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-white">Para Yorumu</p>
              <Textarea
                name="money"
                rows={3}
                defaultValue={current.money}
                placeholder="Maddi durum ve kariyer yorumu..."
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-white">Sağlık Yorumu</p>
              <Textarea
                name="health"
                rows={3}
                defaultValue={current.health}
                placeholder="Sağlık ve zindelik yorumu..."
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-white">Genel Yorum</p>
              <Textarea
                name="general"
                rows={3}
                defaultValue={current.general}
                placeholder="Günün genel yorumu ve tavsiyeler..."
              />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <Button type="reset" variant="ghost">
            Değişiklikleri Geri Al
          </Button>
          <Button type="submit" disabled={pending}>
            Kaydet
          </Button>
        </div>
      </form>
    </div>
  );
}
