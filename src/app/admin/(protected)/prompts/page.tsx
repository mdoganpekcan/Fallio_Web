import { PageHeader } from "@/components/layout/page-header";
import { fetchPersonas } from "@/lib/data";
import { PersonaCard } from "@/components/prompts/persona-card";

export const dynamic = "force-dynamic";

export default async function PromptsPage() {
  const personas = await fetchPersonas();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Yapay Zeka Prompt Yönetimi"
        description="Farklı fal türleri için kullanılan 'Ultrathink' personalarını buradan yönetebilirsiniz."
      />

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-2">
        {personas.map((persona: any) => (
          <PersonaCard key={persona.id} persona={persona} />
        ))}
        {personas.length === 0 && (
            <p className="text-[var(--muted-foreground)]">Henüz persona eklenmemiş. Lütfen SQL komutunu çalıştırın.</p>
        )}
      </div>
    </div>
  );
}
