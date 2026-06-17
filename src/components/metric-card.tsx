import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  icon?: LucideIcon;
  delta?: number; // percentage change
  hint?: string;
  accent?: "green" | "yellow" | "orange" | "blue" | "red" | "purple";
}

const accentBg: Record<NonNullable<MetricCardProps["accent"]>, string> = {
  green: "bg-brand-50 text-brand-700",
  yellow: "bg-amber-50 text-amber-600",
  orange: "bg-orange-50 text-orange-600",
  blue: "bg-sky-50 text-sky-600",
  red: "bg-red-50 text-red-600",
  purple: "bg-violet-50 text-violet-600",
};

export function MetricCard({ title, value, icon: Icon, delta, hint, accent = "green" }: MetricCardProps) {
  const positive = (delta ?? 0) >= 0;
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-muted">{title}</p>
        {Icon && (
          <span className={cn("flex size-9 items-center justify-center rounded-xl", accentBg[accent])}>
            <Icon className="size-4.5" />
          </span>
        )}
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-ink">{value}</p>
      <div className="mt-2 flex items-center gap-2">
        {delta !== undefined && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium",
              positive ? "bg-brand-50 text-brand-700" : "bg-red-50 text-red-600",
            )}
          >
            {positive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
            {Math.abs(delta)}%
          </span>
        )}
        {hint && <span className="text-xs text-muted">{hint}</span>}
      </div>
    </Card>
  );
}
