"use client";

import { ChevronDown, Check, UserCog } from "lucide-react";
import { useApp } from "@/lib/store";
import { ROLES, getRole } from "@/lib/roles";
import { Dropdown, DropdownItem, DropdownLabel, DropdownSeparator } from "@/components/ui/dropdown";

export function RoleSwitcher({ compact = false }: { compact?: boolean }) {
  const { role, setRole } = useApp();
  const current = getRole(role);

  return (
    <Dropdown
      align="right"
      trigger={
        <button className="flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-canvas">
          <UserCog className="size-4 text-brand" />
          {!compact && <span className="hidden sm:inline">{current.short}</span>}
          <ChevronDown className="size-4 text-muted" />
        </button>
      }
      contentClassName="min-w-[18rem]"
    >
      <DropdownLabel>Демо: выбрать роль</DropdownLabel>
      <DropdownSeparator />
      {ROLES.map((r) => (
        <DropdownItem key={r.id} active={r.id === role} onClick={() => setRole(r.id)}>
          <div className="flex w-full items-start gap-2">
            <div className="flex-1">
              <div className="font-medium">{r.name}</div>
              <div className="text-xs text-muted">{r.description}</div>
            </div>
            {r.id === role && <Check className="mt-0.5 size-4 text-brand" />}
          </div>
        </DropdownItem>
      ))}
    </Dropdown>
  );
}
