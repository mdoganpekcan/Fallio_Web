"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updatePersona } from "@/lib/actions/prompts";
import { Check, Loader2, Save } from "lucide-react";

export function PersonaCard({ persona }: { persona: any }) {
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState("");

  return (
    <Card key={persona.id} className="group relative overflow-hidden transition-all hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-1 bg-[var(--card)] border-[var(--border)]">
       <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg text-white capitalize">{persona.key}</h3>
            {persona.updated_at && (
                <span className="text-xs text-[var(--muted-foreground)]">
                    Son: {new Date(persona.updated_at).toLocaleDateString('tr-TR')}
                </span>
            )}
        </div>
        <p className="text-sm text-[var(--muted-foreground)]">{persona.description}</p>
      </CardHeader>
      <CardContent>
        <form
            action={(formData) => {
                startTransition(async () => {
                    const res = await updatePersona(formData);
                    if(res.success) {
                        setMsg("Kaydedildi!");
                        setTimeout(() => setMsg(""), 3000);
                    } else {
                        alert(res.message);
                    }
                });
            }}
            className="space-y-4"
        >
            <input type="hidden" name="id" value={persona.id} />
            <Textarea 
                name="persona" 
                defaultValue={persona.persona} 
                className="min-h-[200px] font-mono text-sm bg-[var(--background)] border-[var(--border)] focus:ring-indigo-500/50"
            />
            
            <div className="flex items-center justify-between">
                <div>
                     {msg && <span className="text-green-400 text-sm flex items-center gap-1"><Check size={14}/> {msg}</span>}
                </div>
                <Button disabled={isPending} type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                    {isPending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                    Kaydet
                </Button>
            </div>
        </form>
      </CardContent>
    </Card>
  );
}
