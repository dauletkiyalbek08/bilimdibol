import { SOURCES } from "../mock-data";
import { makeRng, fullName } from "./_shared";
import type { MarketingAttribution, LeadSource } from "../types";

const { pick, int, rnd } = makeRng(660066);

const UTM = ["ielts_cold", "speaking_retarget", "a1a2_lookalike", "tiktok_trends", "search_almaty", "bio_link_promo"];

// Common real-world journey: Ad → Instagram → bio link → WhatsApp → заявка
const JOURNEYS: { first: LeadSource; assisted: LeadSource; last: LeadSource; confidence: number }[] = [
  { first: "Meta Ads", assisted: "Instagram", last: "WhatsApp", confidence: 62 },
  { first: "TikTok", assisted: "Instagram", last: "WhatsApp", confidence: 48 },
  { first: "Meta Ads", assisted: "Instagram", last: "Instagram", confidence: 78 },
  { first: "YouTube", assisted: "YouTube", last: "Landing Page", confidence: 71 },
  { first: "Google Ads", assisted: "Landing Page", last: "Quiz", confidence: 84 },
  { first: "Instagram", assisted: "Instagram", last: "WhatsApp", confidence: 55 },
  { first: "Referral", assisted: "WhatsApp", last: "WhatsApp", confidence: 90 },
];

export const ATTRIBUTION: MarketingAttribution[] = Array.from({ length: 26 }).map((_, i) => {
  const j = pick(JOURNEYS);
  return {
    id: `attr-${i + 1}`,
    clientName: fullName(i + 1),
    firstTouchSource: j.first,
    lastTouchSource: j.last,
    assistedSource: j.assisted,
    utmCampaign: pick(UTM),
    creativeId: `cr-${int(1, 10)}`,
    confidenceScore: Math.min(98, j.confidence + int(-8, 8)),
    converted: rnd() > 0.55,
  };
});

/** Lead counts grouped by a touchpoint type. */
export function leadsBySource(
  touch: "firstTouchSource" | "lastTouchSource" | "assistedSource",
  rows: MarketingAttribution[] = ATTRIBUTION,
): { source: LeadSource; leads: number }[] {
  const map = new Map<LeadSource, number>();
  for (const s of SOURCES) map.set(s, 0);
  for (const a of rows) map.set(a[touch], (map.get(a[touch]) ?? 0) + 1);
  return SOURCES.map((s) => ({ source: s, leads: map.get(s) ?? 0 })).sort((a, b) => b.leads - a.leads);
}

/** High-confidence converted leads per source — a proxy for lead quality. */
export function qualityBySource(
  rows: MarketingAttribution[] = ATTRIBUTION,
): { source: LeadSource; quality: number }[] {
  const map = new Map<LeadSource, { sum: number; n: number }>();
  for (const a of rows) {
    const cur = map.get(a.firstTouchSource) ?? { sum: 0, n: 0 };
    cur.sum += a.confidenceScore * (a.converted ? 1 : 0.5);
    cur.n += 1;
    map.set(a.firstTouchSource, cur);
  }
  return Array.from(map.entries())
    .map(([source, v]) => ({ source, quality: Math.round(v.sum / Math.max(1, v.n)) }))
    .sort((a, b) => b.quality - a.quality);
}

export const MARKETING_RECOMMENDATIONS = [
  { type: "good", text: "Лиды с Google Ads → Landing → Quiz имеют самый высокий confidence (84%) и конверсию." },
  { type: "warn", text: "Связка TikTok → Instagram → WhatsApp теряет атрибуцию: confidence всего 48%, добавьте UTM в bio link." },
  { type: "bad", text: "Креатив cr-5 даёт дешёвые, но некачественные лиды — рекомендуется отключить." },
  { type: "good", text: "Referral конвертируется лучше всех (90% confidence) — усилить реферальную программу." },
  { type: "warn", text: "Часть заявок из Instagram bio link не размечена — внедрите параметр ?utm для точной атрибуции." },
];
