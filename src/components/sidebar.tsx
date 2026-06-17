"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Database } from "lucide-react";
import { useApp } from "@/lib/store";
import { NAV_ITEMS, canAccess, getRole } from "@/lib/roles";
import { Logo } from "@/components/logo";
import { ICONS } from "@/components/icon-map";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { cn } from "@/lib/utils";

const GROUP_LABELS: Record<string, string> = {
  main: "Обзор",
  sales: "Продажи и CRM",
  marketing: "Маркетинг",
  automation: "Автоматизация",
  finance: "Финансы и HR",
  system: "Система",
};
const GROUP_ORDER = ["main", "sales", "marketing", "automation", "finance", "system"] as const;

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { role } = useApp();
  const current = getRole(role);

  const visible = NAV_ITEMS.filter((item) => canAccess(role, item.key));

  return (
    <>
      {/* Mobile backdrop */}
      {open && <div className="fixed inset-0 z-30 bg-ink/40 lg:hidden" onClick={onClose} />}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-border bg-white transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-5">
          <Link href="/dashboard" onClick={onClose}>
            <Logo size={32} />
          </Link>
          <button onClick={onClose} className="rounded-lg p-1 text-muted hover:bg-canvas lg:hidden">
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {GROUP_ORDER.map((group) => {
            const items = visible.filter((i) => i.group === group);
            if (items.length === 0) return null;
            return (
              <div key={group}>
                <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
                  {GROUP_LABELS[group]}
                </p>
                <ul className="space-y-0.5">
                  {items.map((item) => {
                    const Icon = ICONS[item.icon];
                    const active = pathname === item.href;
                    return (
                      <li key={item.key}>
                        <Link
                          href={item.href}
                          onClick={onClose}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                            active
                              ? "bg-brand-50 text-brand-700"
                              : "text-ink/80 hover:bg-canvas hover:text-ink",
                          )}
                        >
                          {Icon && (
                            <Icon className={cn("size-4.5 shrink-0", active ? "text-brand" : "text-muted")} />
                          )}
                          <span className="truncate">{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        <div className="space-y-2 border-t border-border p-4">
          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
            <span className="flex items-center gap-1.5 text-xs text-muted">
              <Database className="size-3.5" /> Источник данных
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                isSupabaseConfigured ? "bg-brand-50 text-brand-700" : "bg-amber-50 text-amber-700",
              )}
            >
              <span className={cn("size-1.5 rounded-full", isSupabaseConfigured ? "bg-brand" : "bg-amber-400")} />
              {isSupabaseConfigured ? "Supabase" : "Mock"}
            </span>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-brand-50 to-amber-50 p-3.5">
            <p className="text-xs font-semibold text-brand-700">Демо-режим</p>
            <p className="mt-1 text-xs text-muted">
              Вы вошли как «{current.short}». {isSupabaseConfigured ? "Данные из Supabase." : "Данные сгенерированы для демонстрации."}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
