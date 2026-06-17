"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface Tab {
  value: string;
  label: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function Tabs({ tabs, value, onChange, className }: TabsProps) {
  return (
    <div className={cn("inline-flex items-center gap-1 rounded-xl bg-canvas p-1", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            "rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors",
            value === tab.value ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
