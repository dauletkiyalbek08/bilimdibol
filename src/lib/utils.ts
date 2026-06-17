import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format an ISO date string as "12 июн" (ru). */
export function fmtDate(iso?: string): string {
  if (!iso) return "—";
  return format(new Date(iso), "d MMM", { locale: ru });
}

/** Format an ISO date string as "12 июн, 14:30" (ru). */
export function fmtDateTime(iso?: string): string {
  if (!iso) return "—";
  return format(new Date(iso), "d MMM, HH:mm", { locale: ru });
}

/** Format a number as Kazakhstani tenge. */
export function formatKzt(value: number, opts?: { compact?: boolean }): string {
  if (opts?.compact && Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace(".0", "")} млн ₸`;
  }
  if (opts?.compact && Math.abs(value) >= 1_000) {
    return `${(value / 1_000).toFixed(0)} тыс ₸`;
  }
  return `${new Intl.NumberFormat("ru-RU").format(Math.round(value))} ₸`;
}

/** Format a number as USD. */
export function formatUsd(value: number): string {
  return `$${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value)}`;
}

/** Format a plain number with thousands separators. */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("ru-RU").format(value);
}

export function formatPercent(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`;
}

/** Deterministic pseudo-random generator so mock data is stable between renders. */
export function seededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
