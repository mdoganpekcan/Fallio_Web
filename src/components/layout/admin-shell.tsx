"use client";

import { logoutAction } from "@/app/admin/actions";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AdminUser } from "@/types";
import {
  Bell,
  CreditCard,
  GaugeCircle,
  LogOut,
  Mail,
  Settings2,
  Sparkles,
  Stars,
  Users,
  Wand2,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

type Props = {
  children: React.ReactNode;
  admin?: AdminUser | null;
};

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: GaugeCircle },
  { href: "/admin/users", label: "Kullanıcı Yönetimi", icon: Users },
  { href: "/admin/tellers", label: "Falcı Yönetimi", icon: Stars },
  { href: "/admin/fortunes", label: "Gelen Fal İstekleri", icon: Wand2 },
  { href: "/admin/horoscopes", label: "Burç Yorumları", icon: Sparkles },
  { href: "/admin/credits", label: "Kredi & Ekonomi", icon: CreditCard },
  { href: "/admin/notifications", label: "Bildirim Merkezi", icon: Bell },
  { href: "/admin/settings", label: "Sistem Ayarları", icon: Settings2 },
];

export function AdminShell({ children, admin }: Props) {
  const pathname = usePathname();

  const filteredNavItems = useMemo(() => {
    if (admin?.role === "fortune_teller") {
      return navItems.filter((item) =>
        ["/admin/fortunes", "/admin/horoscopes"].includes(item.href)
      );
    }
    return navItems;
  }, [admin?.role]);

  const activeLabel = useMemo(
    () => filteredNavItems.find((item) => pathname.startsWith(item.href))?.label,
    [pathname, filteredNavItems]
  );

  return (
    <div className="flex min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <aside className="sticky top-0 hidden h-screen w-72 flex-col border-r border-[var(--border)] bg-[var(--surface)]/90 p-6 shadow-[10px_0_40px_rgba(0,0,0,0.45)] backdrop-blur lg:flex">
        <div className="mb-10 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--accent)_25%,transparent)] text-xl font-display">
            ✦
          </div>
          <div>
            <p className="text-lg font-display font-semibold">Falio</p>
            <p className="text-sm text-[var(--muted-foreground)]">
              Yönetim Paneli
            </p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-2">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                  active
                    ? "bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] text-white shadow-[0_10px_30px_rgba(124,92,255,0.28)]"
                    : "text-[var(--muted-foreground)] hover:bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] hover:text-white"
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="mt-8 flex flex-col gap-3 text-sm">
          <div className="flex items-center gap-3 rounded-xl bg-[var(--panel)] px-4 py-3">
            <div className="flex-1">
              <p className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
                Aktif Sayfa
              </p>
              <p className="font-semibold text-white">{activeLabel}</p>
            </div>
            <Sparkles className="text-[var(--accent)]" size={18} />
          </div>
          <form action={logoutAction}>
            <Button
              variant="ghost"
              size="md"
              className="w-full justify-start gap-3 text-[var(--muted-foreground)] hover:text-white"
            >
              <LogOut size={18} />
              Çıkış Yap
            </Button>
          </form>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex flex-wrap items-center gap-4 border-b border-[var(--border)] bg-[var(--background)]/80 px-6 py-4 backdrop-blur">
          <div className="flex-1">
            <Input
              placeholder="Ara..."
              prefix={<GaugeCircle size={16} />}
              className="max-w-xl"
            />
          </div>
          <div className="hidden items-center gap-3 sm:flex">
            <Button variant="ghost" size="md" className="h-12 w-12 rounded-full">
              <Bell size={18} />
            </Button>
            <Button variant="ghost" size="md" className="h-12 w-12 rounded-full">
              <Mail size={18} />
            </Button>
            <div className="flex items-center gap-3 rounded-full bg-[var(--panel)] px-3 py-2">
              <Avatar src={admin?.avatar_url} name={admin?.display_name} />
              <div className="text-left leading-tight">
                <p className="text-sm font-semibold text-white">
                  {admin?.display_name ?? "Admin"}
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {admin?.email ?? "admin@falio.app"}
                </p>
              </div>
            </div>
            <form action={logoutAction}>
              <Button variant="outline" size="md" className="gap-2">
                <LogOut size={16} />
                Çıkış
              </Button>
            </form>
          </div>
        </header>
        <main className="flex-1 bg-[var(--background)] px-6 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
