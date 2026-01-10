"use client";

import { 
  upsertCreditPackage, upsertSubscription, 
  deleteCreditPackage, deleteSubscription,
  toggleCreditPackageStatus
} from "@/lib/actions/admin";
import type { CreditPackage, SubscriptionPlan } from "@/types";
import { useState, useTransition } from "react";
import { Tabs } from "../ui/tabs";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Table } from "../tables/table";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";

type Props = {
  packages: CreditPackage[];
  subscriptions: SubscriptionPlan[];
};

export function CreditsBoard({ packages, subscriptions }: Props) {
  const [tab, setTab] = useState<string>("packages");
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      <Tabs
        items={[
          { value: "packages", label: "Kredi Paketleri" },
          { value: "subscriptions", label: "Abonelik Avantajları" },
        ]}
        defaultValue={tab}
        onChange={setTab}
      />

      {tab === "packages" && (
        <Card>
          <CardHeader
            title="Kredi Paketleri"
            description="Satın alınabilir kredi paketlerini yönetin."
            action={<Badge variant="default">Aktif {packages.length}</Badge>}
          />
          <CardContent className="space-y-4">
            <Table
              data={packages}
              columns={[
                { key: "name", header: "Paket Adı" },
                {
                  key: "credits",
                  header: "Kredi Miktarı",
                  render: (pkg) => `${pkg.credits.toLocaleString("tr-TR")} Kredi`,
                },
                {
                  key: "price",
                  header: "Fiyat",
                  render: (pkg) => `${pkg.price} TL`,
                },
                {
                  key: "active",
                  header: "Durum",
                  render: (pkg) => (
                    <form action={async (formData) => { await toggleCreditPackageStatus(formData); }}>
                      <input type="hidden" name="id" value={pkg.id} />
                      <input type="hidden" name="active" value={String(pkg.active)} />
                      <button type="submit">
                        <Badge variant={pkg.active ? "success" : "muted"} className="cursor-pointer hover:opacity-80">
                          {pkg.active ? "Aktif" : "Pasif"}
                        </Badge>
                      </button>
                    </form>
                  ),
                },
                {
                  key: "actions",
                  header: "İşlemler",
                  render: (pkg) => (
                    <form action={async (formData) => { await deleteCreditPackage(formData); }}>
                      <input type="hidden" name="id" value={pkg.id} />
                      <Button size="sm" variant="destructive" type="submit">Sil</Button>
                    </form>
                  )
                }
              ]}
              empty="Paket bulunamadı."
            />

            <form
              action={(formData) =>
                startTransition(async () => {
                  await upsertCreditPackage(formData);
                })
              }
              className="grid gap-3 rounded-xl bg-[var(--card)] p-4 md:grid-cols-4"
            >
              <Input name="name" placeholder="Paket adı" required />
              <Input name="credits" placeholder="Kredi miktarı" type="number" required />
              <Input name="price" placeholder="Fiyat" type="number" required />
              <label className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                <input type="checkbox" name="active" defaultChecked />
                Aktif
              </label>
              <div className="md:col-span-4 flex justify-end">
                <Button type="submit" disabled={pending}>
                  Yeni Paket Ekle
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {tab === "subscriptions" && (
        <Card>
          <CardHeader
            title="Abonelik Avantajları"
            description="Aylık ve yıllık paket özellikleri."
          />
          <CardContent className="space-y-4">
            <Table
              data={subscriptions}
              columns={[
                { key: "name", header: "Paket" },
                { key: "cycle", header: "Periyot" },
                { key: "price", header: "Fiyat" },
                {
                  key: "perks",
                  header: "Avantajlar",
                  render: (sub) => (
                    <div className="flex flex-wrap gap-2">
                      {sub.perks.map((perk) => (
                        <Badge key={perk} variant="muted">
                          {perk}
                        </Badge>
                      ))}
                    </div>
                  ),
                },
                {
                  key: "actions",
                  header: "İşlemler",
                  render: (sub) => (
                    <form action={async (formData) => { await deleteSubscription(formData); }}>
                      <input type="hidden" name="id" value={sub.id} />
                      <Button size="sm" variant="destructive" type="submit">Sil</Button>
                    </form>
                  )
                }
              ]}
              empty="Abonelik bulunamadı."
            />

            <form
              action={(formData) =>
                startTransition(async () => {
                  await upsertSubscription(formData);
                })
              }
              className="grid gap-3 rounded-xl bg-[var(--card)] p-4 md:grid-cols-4"
            >
              <Input name="name" placeholder="Paket adı" required />
              <select
                name="cycle"
                className="h-12 rounded-xl bg-[var(--panel)] px-3 text-sm text-white"
              >
                <option value="monthly">Aylık</option>
                <option value="yearly">Yıllık</option>
              </select>
              <Input name="price" placeholder="Fiyat" type="number" required />
              <Textarea
                name="perks"
                placeholder="Avantajları virgülle ayırarak yazın"
                className="md:col-span-4"
              />
              <div className="md:col-span-4 flex justify-end">
                <Button type="submit" disabled={pending}>
                  Abonelik Kaydet
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
