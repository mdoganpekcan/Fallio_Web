import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { HoroscopeBoard } from "@/components/horoscopes/horoscope-board";

export default function HoroscopesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Burç Yorumları Yönetimi"
        description="Burç kartlarını seçerek günlük, haftalık ve aylık yorumları güncelleyin."
      />

      <Card>
        <CardContent>
          <HoroscopeBoard />
        </CardContent>
      </Card>
    </div>
  );
}
