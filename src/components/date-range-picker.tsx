"use client";

import { CalendarDays, Check } from "lucide-react";
import { useApp } from "@/lib/store";
import { PRESET_ORDER, PRESET_LABELS } from "@/lib/date-range";
import { Dropdown, DropdownItem, DropdownLabel, DropdownSeparator } from "@/components/ui/dropdown";

export function DateRangePicker() {
  const { range, setPreset } = useApp();

  return (
    <Dropdown
      align="right"
      trigger={
        <button className="flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-canvas">
          <CalendarDays className="size-4 text-brand" />
          <span className="hidden md:inline">{PRESET_LABELS[range.preset]}</span>
          <span className="hidden text-xs text-muted lg:inline">· {range.label}</span>
        </button>
      }
      contentClassName="min-w-[16rem]"
    >
      <DropdownLabel>Период</DropdownLabel>
      <DropdownSeparator />
      {PRESET_ORDER.map((p) => (
        <DropdownItem key={p} active={p === range.preset} onClick={() => setPreset(p)}>
          <span className="flex-1">{PRESET_LABELS[p]}</span>
          {p === range.preset && <Check className="size-4 text-brand" />}
        </DropdownItem>
      ))}
      <DropdownSeparator />
      <div className="px-3 py-1.5 text-xs text-muted">Таймзона: Asia/Almaty</div>
    </Dropdown>
  );
}
