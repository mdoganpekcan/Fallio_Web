"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { resolveFortune } from "@/lib/actions/admin";
import { Sparkles } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Props = {
  fortuneId: string;
  userId: string;
  initialResponse?: string | null;
  initialStatus: "pending" | "completed" | string;
  fortuneType: string;
  userNote?: string | null;
  userZodiac?: string;
  metadata?: any;
};

export function FortuneResponseForm({
  fortuneId,
  userId,
  initialResponse,
  initialStatus,
  fortuneType,
  userNote,
  userZodiac,
  metadata,
}: Props) {
  const [response, setResponse] = useState(initialResponse || "");
  const [status, setStatus] = useState(initialStatus);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/generate-fortune", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fortuneId,
          userNote,
          fortuneType,
          userZodiac,
          metadata,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "AI yanıtı alınamadı.");
      }

      setResponse(data.response);
      setStatus("completed"); // Auto-set to completed
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          // Ensure the state values are passed if the user didn't type them manually
          // But formData automatically picks up input values by name.
          // We just need to make sure the controlled inputs update the DOM elements or we use hidden inputs if needed.
          // Since Textarea and Radio are controlled/uncontrolled hybrids, let's ensure they work.
          // Actually, for Textarea, if we control `value`, formData will pick it up.
          
          const res = await resolveFortune(formData);
          if (res?.error) {
            alert(res.error);
          } else {
            router.refresh();
          }
        });
      }}
      className="space-y-4"
    >
      <input type="hidden" name="id" value={fortuneId} />
      <input type="hidden" name="user_id" value={userId} />
      
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white">Yorum</p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-[var(--accent)] hover:bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]"
          onClick={handleGenerateAI}
          disabled={isGenerating || pending}
        >
          <Sparkles size={16} className={isGenerating ? "animate-spin" : ""} />
          {isGenerating ? "Yazılıyor..." : "Yapay Zeka ile Oluştur"}
        </Button>
      </div>

      <Textarea
        name="response"
        rows={10}
        value={response}
        onChange={(e) => setResponse(e.target.value)}
        placeholder="Fal yorumunu buraya yazın..."
        required
      />

      <div className="flex flex-wrap gap-3">
        <label className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] cursor-pointer">
          <input
            type="radio"
            name="status"
            value="pending"
            checked={status === "pending"}
            onChange={() => setStatus("pending")}
          />
          Bekliyor
        </label>
        <label className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] cursor-pointer">
          <input
            type="radio"
            name="status"
            value="completed"
            checked={status === "completed"}
            onChange={() => setStatus("completed")}
          />
          Tamamlandı
        </label>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending || isGenerating}>
          {pending ? "Kaydediliyor..." : "Kaydet ve Güncelle"}
        </Button>
      </div>
    </form>
  );
}
