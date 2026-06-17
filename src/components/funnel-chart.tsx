import { formatNumber, formatPercent } from "@/lib/utils";

interface FunnelStage {
  stage: string;
  value: number;
}

const COLORS = ["#16A34A", "#FACC15", "#FB923C"];

export function FunnelChart({ stages }: { stages: FunnelStage[] }) {
  const max = Math.max(...stages.map((s) => s.value), 1);
  return (
    <div className="flex flex-col gap-3">
      {stages.map((s, i) => {
        const width = Math.max(8, (s.value / max) * 100);
        const conv = i === 0 ? 100 : (s.value / stages[i - 1].value) * 100;
        return (
          <div key={s.stage}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium text-ink">{s.stage}</span>
              <span className="text-muted">
                {formatNumber(s.value)}
                {i > 0 && <span className="ml-2 text-xs text-brand-700">{formatPercent(conv, 0)}</span>}
              </span>
            </div>
            <div className="h-9 w-full overflow-hidden rounded-lg bg-canvas">
              <div
                className="flex h-full items-center justify-end rounded-lg px-3 text-xs font-semibold text-white transition-all"
                style={{ width: `${width}%`, backgroundColor: COLORS[i % COLORS.length] }}
              >
                {formatNumber(s.value)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
