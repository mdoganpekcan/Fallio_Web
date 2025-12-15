import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { HoroscopeBoard } from "@/components/horoscopes/horoscope-board";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export default async function HoroscopesPage() {
  // Fetch all horoscopes
  const { data: horoscopes } = await supabaseAdmin
    .from("horoscopes")
    .select("*")
    .order("effective_date", { ascending: false });

  // Group by sign and scope to find the latest one for each
  const existing: Record<string, any> = {};
  
  if (horoscopes) {
    for (const h of horoscopes) {
      const key = `${h.sign}-${h.scope}`; // e.g. "Koç-daily" (Note: DB stores 'koc', UI uses 'Koç')
      
      // DB stores 'koc', 'boga' etc. UI expects 'Koç', 'Boğa' etc.
      // We need a mapping or ensure consistency.
      // The HoroscopeBoard component uses:
      // const key = `${selectedSign}-${scope}`; where selectedSign is "Koç", "Boğa"...
      
      // Let's map DB sign to UI sign
      const signMap: Record<string, string> = {
        "koc": "Koç", "boga": "Boğa", "ikizler": "İkizler", "yengec": "Yengeç",
        "aslan": "Aslan", "basak": "Başak", "terazi": "Terazi", "akrep": "Akrep",
        "yay": "Yay", "oglak": "Oğlak", "kova": "Kova", "balik": "Balık"
      };
      
      const uiSign = signMap[h.sign] || h.sign;
      const uiKey = `${uiSign}-${h.scope}`;

      // Since we ordered by date desc, the first one we encounter is the latest
      if (!existing[uiKey]) {
        existing[uiKey] = {
          general: h.general,
          love: h.love,
          money: h.money,
          health: h.health
        };
      }
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Burç Yorumları Yönetimi"
        description="Burç kartlarını seçerek günlük, haftalık ve aylık yorumları güncelleyin."
      />

      <Card>
        <CardContent>
          <HoroscopeBoard existing={existing} />
        </CardContent>
      </Card>
    </div>
  );
}
