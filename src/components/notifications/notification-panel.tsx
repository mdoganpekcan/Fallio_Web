"use client";

import { sendNotification, deleteNotification, processNotification } from "@/lib/actions/admin";
import type { NotificationItem } from "@/types";
import { useState, useTransition } from "react";
import { Tabs } from "../ui/tabs";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Select } from "../ui/select";
import { Button } from "../ui/button";
import { Table } from "../tables/table";
import { Badge } from "../ui/badge";

export function NotificationPanel({ notifications }: { notifications: NotificationItem[] }) {
  const [tab, setTab] = useState<string>("bulk");
  const [pending, startTransition] = useTransition();

  return (
    <div className="grid gap-6 lg:grid-cols-[420px,1fr]">
      <Card>
        <CardHeader
          title="Bildirim Gönder"
          description="Toplu veya kullanıcıya özel bildirim gönderin."
        />
        <CardContent className="space-y-4">
          <Tabs
            items={[
              { value: "bulk", label: "Toplu Bildirim" },
              { value: "direct", label: "Kullanıcıya Özel" },
            ]}
            defaultValue={tab}
            onChange={setTab}
          />
          <form
            action={(formData) =>
              startTransition(async () => {
                formData.set("segment", tab === "bulk" ? "all" : "single");
                await sendNotification(formData);
              })
            }
            className="space-y-3"
          >
            <Input name="title" placeholder="Başlık" required />
            <Textarea
              name="message"
              placeholder="Bildirim mesajınızı buraya yazın..."
              rows={4}
              required
            />
            {tab === "direct" ? (
              <Input name="user_id" placeholder="Tek kullanıcı ID" />
            ) : (
              <Select
                name="segment"
                options={[
                  { label: "Tüm Kullanıcılar", value: "all" },
                  { label: "Premium", value: "premium" },
                  { label: "Yeni Kullanıcılar", value: "new" },
                ]}
              />
            )}
            <label className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
              <input type="checkbox" name="send_now" value="true" />
              Hemen Gönder
            </label>
            <Button type="submit" disabled={pending} className="w-full">
              Bildirimi Oluştur
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title="Gönderilen Bildirimler"
          description="Geçmiş bildirimlerin takibi"
        />
        <CardContent>
          <Table
            data={notifications}
            columns={[
              { key: "id", header: "ID" },
              { key: "title", header: "Başlık" },
              { key: "segment", header: "Alıcı Segment" },
              {
                key: "created_at",
                header: "Tarih",
                render: (item) =>
                  item.created_at
                    ? new Date(item.created_at).toLocaleString("tr-TR")
                    : "-",
              },
              {
                key: "status",
                header: "Durum",
                render: (item) => {
                  const variantMap = {
                    sent: "success",
                    error: "danger",
                    queued: "warning",
                  } as const;
                  return (
                    <Badge variant={variantMap[item.status]}>
                      {item.status}
                    </Badge>
                  );
                },
              },
              {
                key: "actions",
                header: "İşlemler",
                render: (item) => (
                  <div className="flex gap-2">
                    {item.status === 'queued' && (
                      <form action={async (formData) => { await processNotification(formData); }}>
                        <input type="hidden" name="id" value={item.id} />
                        <Button size="sm" variant="outline" type="submit">Gönder</Button>
                      </form>
                    )}
                    <form action={async (formData) => { await deleteNotification(formData); }}>
                      <input type="hidden" name="id" value={item.id} />
                      <Button size="sm" variant="destructive" type="submit">Sil</Button>
                    </form>
                  </div>
                )
              }
            ]}
            empty="Bildirim bulunamadı."
          />
        </CardContent>
      </Card>
    </div>
  );
}
