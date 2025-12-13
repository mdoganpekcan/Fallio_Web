import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table } from "@/components/tables/table";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { fetchUsers } from "@/lib/data";
import { UsersPagination } from "@/components/users/users-pagination";
import { UserActions } from "@/components/users/user-actions";
import { Wand2 } from "lucide-react";

const zodiacOptions = [
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

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const page = Number(sp?.page ?? 1);
  const status = (sp?.status as string) ?? "all";
  const zodiac = (sp?.zodiac as string) ?? "all";
  const q = (sp?.q as string) ?? "";

  const { data: users, count } = await fetchUsers({
    page,
    pageSize: 8,
    status,
    zodiac,
    search: q,
  });
  const pageCount = Math.max(1, Math.ceil((count ?? 0) / 8));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kullanıcı Yönetimi"
        description="Kullanıcıları görüntüleyin, düzenleyin ve filtreleyin."
        action={<Button className="px-5">+ Yeni Kullanıcı Ekle</Button>}
      />

      <Card>
        <CardContent className="space-y-4">
          <form className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Input
              name="q"
              placeholder="İsim veya e-posta ile ara..."
              defaultValue={q}
              prefix={<Wand2 size={16} />}
            />
            <Select
              name="status"
              defaultValue={status}
              options={[
                { label: "Durum: Tümü", value: "all" },
                { label: "Aktif", value: "active" },
                { label: "Yasaklı", value: "banned" },
              ]}
            />
            <Select
              name="zodiac"
              defaultValue={zodiac}
              options={[
                { label: "Burç: Tümü", value: "all" },
                ...zodiacOptions.map((z) => ({ label: z, value: z })),
              ]}
            />
            <Button type="submit" className="w-full">
              Filtrele
            </Button>
          </form>

          <Table
            data={users}
            columns={[
              {
                key: "avatar",
                header: "Avatar",
                render: (user) => <Avatar src={user.avatar_url} name={user.full_name} />,
              },
              {
                key: "full_name",
                header: "Ad Soyad",
                render: (user) => (
                  <div>
                    <p className="font-semibold text-white">{user.full_name}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {user.email}
                    </p>
                  </div>
                ),
              },
              {
                key: "zodiac_sign",
                header: "Burç",
                render: (user) => user.zodiac_sign ?? "-",
              },
              { key: "credits", header: "Kredi", align: "right" },
              {
                key: "status",
                header: "Durum",
                render: (user) => (
                  <Badge
                    variant={user.status === "active" ? "success" : "danger"}
                    className="text-xs"
                  >
                    {user.status === "active" ? "Aktif" : "Yasaklı"}
                  </Badge>
                ),
              },
              {
                key: "actions",
                header: "İşlemler",
                render: (user) => <UserActions user={user} />,
              },
            ]}
            empty="Kayıt bulunamadı."
          />

          <div className="flex items-center justify-end">
            <UsersPagination page={page} pageCount={pageCount} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
