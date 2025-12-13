import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table } from "@/components/tables/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchRecentFortunes } from "@/lib/data";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import Link from "next/link";

export default async function FortunesPage() {
  const fortunes = await fetchRecentFortunes(12);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gelen Fal İstekleri"
        description="Gelen tüm fal taleplerini yönetin."
      />

      <Card>
        <CardContent>
          <Table
            data={fortunes}
            columns={[
              { key: "user_name", header: "Kullanıcı Adı" },
              { key: "type", header: "Fal Türü" },
              { key: "teller_name", header: "Falcı" },
              {
                key: "submitted_at",
                header: "Gönderilme Tarihi",
                render: (row) =>
                  row.submitted_at
                    ? format(new Date(row.submitted_at), "dd.MM.yyyy HH:mm", {
                        locale: tr,
                      })
                    : "-",
              },
              {
                key: "status",
                header: "Durum",
                render: (row) => (
                  <Badge
                    variant={row.status === "completed" ? "success" : "warning"}
                  >
                    {row.status === "completed" ? "Tamamlandı" : "Bekliyor"}
                  </Badge>
                ),
              },
              {
                key: "action",
                header: "İşlem",
                render: (row) => (
                  <Link href={`/admin/fortunes/${row.id}`}>
                    <Button variant="outline" size="sm" className="text-[var(--accent)] border-[var(--accent)] hover:bg-[var(--accent)] hover:text-white">
                      Fal Aç
                    </Button>
                  </Link>
                ),
              },
            ]}
            empty="Fal isteği bulunamadı."
          />
        </CardContent>
      </Card>
    </div>
  );
}
