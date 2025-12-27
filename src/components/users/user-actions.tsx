"use client";

import { adjustUserBalance, updateUserStatus, deleteUser } from "@/lib/actions/admin";
import type { User } from "@/types";
import { useState, useTransition } from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Modal } from "../ui/modal";
import { Select } from "../ui/select";

export function UserActions({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="text-[var(--accent)]"
        onClick={() => setOpen(true)}
      >
        Düzenle
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`${user.full_name} düzenle`}
        description="Kullanıcı durumunu ve bakiyesini güncelleyin."
      >
        <div className="space-y-6">
          <div className="rounded-xl bg-[var(--card)] p-4 text-sm text-[var(--muted-foreground)]">
            <div className="flex justify-between">
              <span>Email</span>
              <span className="text-white">{user.email}</span>
            </div>
            <div className="mt-2 flex justify-between">
              <span>Burç</span>
              <span className="text-white">{user.zodiac_sign ?? "-"}</span>
            </div>
            <div className="mt-2 flex justify-between">
              <span>Durum</span>
              <Badge variant={user.status === "active" ? "success" : "danger"}>
                {user.status === "active" ? "Aktif" : "Yasaklı"}
              </Badge>
            </div>
          </div>

          <form
            action={(formData) =>
              startTransition(async () => {
                await adjustUserBalance(formData);
                setOpen(false);
              })
            }
            className="space-y-3"
          >
            <input type="hidden" name="id" value={user.id} />
            <p className="text-sm font-semibold text-white">Kredi / Elmas</p>
            <Input
              name="credits"
              type="number"
              defaultValue={user.credits}
              placeholder="Kredi"
            />
            <Input
              name="diamonds"
              type="number"
              defaultValue={user.diamonds}
              placeholder="Elmas"
            />
            <Button type="submit" disabled={pending} className="w-full">
              Bakiye Güncelle
            </Button>
          </form>

          <form
            action={(formData) =>
              startTransition(async () => {
                await updateUserStatus(formData);
                setOpen(false);
              })
            }
            className="space-y-3"
          >
            <input type="hidden" name="id" value={user.id} />
            <p className="text-sm font-semibold text-white">Durum</p>
            <Select
              name="status"
              defaultValue={user.status}
              options={[
                { label: "Aktif", value: "active" },
                { label: "Yasaklı", value: "banned" },
              ]}
            />
            <Button type="submit" variant="outline" disabled={pending} className="w-full">
              Durumu Güncelle
            </Button>
          </form>

        </div>

        <form
          action={(formData) =>
            startTransition(async () => {
              const { setUserRole } = await import("@/lib/actions/admin");
              await setUserRole(formData);
              setOpen(false);
            })
          }
          className="space-y-3 pt-4 border-t border-[var(--border)]"
        >
          <input type="hidden" name="email" value={user.email} />
          <input type="hidden" name="userId" value={user.id} />

          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-white">Admin Yetkisi 🛡️</p>
            {user.admin_role && <Badge variant="default" className="bg-purple-600">{user.admin_role}</Badge>}
          </div>

          <Select
            name="role"
            defaultValue={user.admin_role || "none"}
            options={[
              { label: "Yetki Yok (Normal Kullanıcı)", value: "none" },
              { label: "Admin (Tam Yetki)", value: "admin" },
              { label: "Moderatör", value: "moderator" },
              { label: "Falcı", value: "fortune_teller" },
            ]}
          />
          <Button type="submit" variant="secondary" disabled={pending} className="w-full">
            Yetkiyi Güncelle
          </Button>
        </form>

        <form
          action={(formData) => {
            if (confirm("Bu kullanıcıyı tamamen silmek istediğinize emin misiniz? Bu işlem geri alınamaz.")) {
              startTransition(async () => {
                await deleteUser(formData);
                setOpen(false);
              });
            }
          }}
          className="space-y-3 pt-4 border-t border-[var(--border)]"
        >
          <input type="hidden" name="id" value={user.id} />
          <p className="text-sm font-semibold text-red-500">Tehlikeli Bölge</p>
          <Button type="submit" variant="destructive" disabled={pending} className="w-full">
            Kullanıcıyı Tamamen Sil
          </Button>
        </form>
      </div>
    </Modal >
    </>
  );
}
