"use client";

import { adjustUserBalance, updateUserStatus, deleteUser, assignAdminRole, revokeAdminRole } from "@/lib/actions/admin";
import type { User } from "@/types";
import { useState, useTransition } from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Modal } from "../ui/modal";
import { Select } from "../ui/select";
import { ShieldCheck, ShieldAlert, Shield } from "lucide-react";

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
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
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
            {user.admin_role && (
              <div className="mt-2 flex justify-between">
                <span>Yetki</span>
                <Badge variant="default" className="border-[var(--accent)] text-[var(--accent)]">
                  <ShieldCheck size={12} className="mr-1" /> {user.admin_role.toUpperCase()}
                </Badge>
              </div>
            )}
          </div>

          {/* Yetki Yönetimi Section */}
          <div className="space-y-3 pt-4 border-t border-[var(--border)]">
            <p className="text-sm font-semibold text-white flex items-center gap-2">
              <Shield size={16} className="text-[var(--accent)]" /> Yetki Yönetimi
            </p>

            <form
              action={(formData) =>
                startTransition(async () => {
                  await assignAdminRole(formData);
                  setOpen(false);
                })
              }
              className="space-y-3"
            >
              <input type="hidden" name="userId" value={user.id} />
              <input type="hidden" name="email" value={user.email} />
              <input type="hidden" name="name" value={user.full_name} />

              <div className="grid grid-cols-2 gap-3">
                <Select
                  name="role"
                  defaultValue={user.admin_role || "moderator"}
                  options={[
                    { label: "Admin (Tam Yetki)", value: "admin" },
                    { label: "Moderator", value: "moderator" },
                    { label: "Falcı (Sadece Fallar)", value: "fortune_teller" },
                  ]}
                />
                <Button type="submit" disabled={pending} variant="outline" className="border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white">
                  {user.admin_role ? "Yetkiyi Güncelle" : "Yetki Ver"}
                </Button>
              </div>
            </form>

            {user.admin_role && (
              <form
                action={(formData) => {
                  if (confirm("Bu kullanıcının admin yetkisini almak istediğinize emin misiniz?")) {
                    startTransition(async () => {
                      await revokeAdminRole(formData);
                      setOpen(false);
                    });
                  }
                }}
              >
                <input type="hidden" name="userId" value={user.id} />
                <Button type="submit" variant="ghost" disabled={pending} className="w-full text-red-400 hover:text-red-500 hover:bg-red-500/10">
                  <ShieldAlert size={16} className="mr-2" /> Yetkiyi Tamamen Kaldır
                </Button>
              </form>
            )}
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
      </Modal>
    </>
  );
}
