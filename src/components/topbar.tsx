"use client";

import * as React from "react";
import { Bell, Menu, LogOut, Search } from "lucide-react";
import { useApp } from "@/lib/store";
import { getRole, PROJECT } from "@/lib/roles";
import { NOTIFICATIONS } from "@/lib/mock-data";
import { DateRangePicker } from "@/components/date-range-picker";
import { UserAvatar } from "@/components/user-avatar";
import { Dropdown, DropdownItem, DropdownLabel, DropdownSeparator } from "@/components/ui/dropdown";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { role, currentUserName, logout } = useApp();
  const current = getRole(role);
  const unread = NOTIFICATIONS.filter((n) => n.unread).length;

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-white/90 px-4 backdrop-blur lg:px-6">
      <button onClick={onMenu} className="rounded-lg p-2 text-muted hover:bg-canvas lg:hidden">
        <Menu className="size-5" />
      </button>

      {/* Project badge — fixed, single project */}
      <Badge variant="green" className="hidden h-8 gap-1.5 px-3 text-sm sm:inline-flex">
        <span className="flex size-5 items-center justify-center rounded bg-brand text-[10px] font-bold text-white">
          {PROJECT.badge}
        </span>
        {PROJECT.name}
      </Badge>

      {/* Search */}
      <div className="relative ml-1 hidden flex-1 max-w-md md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <input
          placeholder="Поиск лидов, клиентов, продаж…"
          className="h-9 w-full rounded-lg border border-border bg-canvas/60 pl-9 pr-3 text-sm text-ink placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <DateRangePicker />

        {/* Notifications */}
        <Dropdown
          align="right"
          contentClassName="w-80 p-2"
          trigger={
            <button className="relative rounded-lg border border-border bg-white p-2 text-muted transition-colors hover:bg-canvas">
              <Bell className="size-4.5" />
              {unread > 0 && (
                <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-accent-orange text-[10px] font-bold text-white">
                  {unread}
                </span>
              )}
            </button>
          }
        >
          <DropdownLabel>Уведомления</DropdownLabel>
          <DropdownSeparator />
          <div className="max-h-80 overflow-y-auto">
            {NOTIFICATIONS.map((n) => (
              <div
                key={n.id}
                className={cn(
                  "flex gap-2.5 rounded-lg px-3 py-2.5 hover:bg-canvas",
                  n.unread && "bg-brand-50/40",
                )}
              >
                <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.unread ? "bg-brand" : "bg-border")} />
                <div>
                  <p className="text-sm font-medium text-ink">{n.title}</p>
                  <p className="text-xs text-muted">{n.text}</p>
                  <p className="mt-0.5 text-[11px] text-muted">{n.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Dropdown>

        {/* Current role badge (read-only — set by login) */}
        <Badge variant="gray" className="hidden h-8 items-center px-3 sm:inline-flex">
          {current.short}
        </Badge>

        {/* Profile */}
        <Dropdown
          align="right"
          trigger={
            <button className="flex items-center gap-2 rounded-lg p-0.5 pr-1 transition-colors hover:bg-canvas">
              <UserAvatar name={currentUserName} color={current.id === "admin" ? "#16A34A" : "#FB923C"} />
            </button>
          }
        >
          <div className="px-3 py-2">
            <p className="text-sm font-semibold text-ink">{currentUserName}</p>
            <p className="text-xs text-muted">{current.name}</p>
          </div>
          <DropdownSeparator />
          <DropdownItem onClick={logout}>
            <LogOut className="size-4" /> Выйти из системы
          </DropdownItem>
        </Dropdown>
      </div>
    </header>
  );
}
