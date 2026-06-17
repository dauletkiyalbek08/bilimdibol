import {
  startOfDay,
  endOfDay,
  subDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  format,
} from "date-fns";
import { ru } from "date-fns/locale";
import type { DateRange, DateRangePreset } from "./types";

export const PRESET_LABELS: Record<DateRangePreset, string> = {
  today: "Сегодня",
  yesterday: "Вчера",
  last7: "Последние 7 дней",
  last30: "Последние 30 дней",
  this_week: "Эта неделя",
  last_week: "Прошлая неделя",
  this_month: "Этот месяц",
  last_month: "Прошлый месяц",
  this_year: "Этот год",
  custom: "Свой период",
};

export const PRESET_ORDER: DateRangePreset[] = [
  "today",
  "yesterday",
  "last7",
  "last30",
  "this_week",
  "last_week",
  "this_month",
  "last_month",
  "this_year",
  "custom",
];

function fmt(d: Date): string {
  return format(d, "d MMM", { locale: ru });
}

export function buildRange(preset: DateRangePreset, now = new Date()): DateRange {
  let from: Date;
  let to: Date;
  switch (preset) {
    case "today":
      from = startOfDay(now);
      to = endOfDay(now);
      break;
    case "yesterday":
      from = startOfDay(subDays(now, 1));
      to = endOfDay(subDays(now, 1));
      break;
    case "last7":
      from = startOfDay(subDays(now, 6));
      to = endOfDay(now);
      break;
    case "last30":
      from = startOfDay(subDays(now, 29));
      to = endOfDay(now);
      break;
    case "this_week":
      from = startOfWeek(now, { weekStartsOn: 1 });
      to = endOfWeek(now, { weekStartsOn: 1 });
      break;
    case "last_week":
      from = startOfWeek(subDays(now, 7), { weekStartsOn: 1 });
      to = endOfWeek(subDays(now, 7), { weekStartsOn: 1 });
      break;
    case "this_month":
      from = startOfMonth(now);
      to = endOfMonth(now);
      break;
    case "last_month": {
      const prev = subDays(startOfMonth(now), 1);
      from = startOfMonth(prev);
      to = endOfMonth(prev);
      break;
    }
    case "this_year":
      from = startOfYear(now);
      to = endOfYear(now);
      break;
    case "custom":
    default:
      from = startOfDay(subDays(now, 29));
      to = endOfDay(now);
      break;
  }

  const label =
    preset === "today" || preset === "yesterday"
      ? PRESET_LABELS[preset]
      : `${fmt(from)} — ${fmt(to)}`;

  return {
    preset,
    from: from.toISOString(),
    to: to.toISOString(),
    label,
  };
}

export const DEFAULT_RANGE = buildRange("last30");

/** Number of days in the range — used to scale mock aggregates. */
export function rangeDays(range: DateRange): number {
  const ms = new Date(range.to).getTime() - new Date(range.from).getTime();
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
}

export function isInRange(iso: string, range: DateRange): boolean {
  const t = new Date(iso).getTime();
  return t >= new Date(range.from).getTime() && t <= new Date(range.to).getTime();
}
