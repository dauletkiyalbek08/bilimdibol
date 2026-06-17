import { PRICES } from "../mock-data";
import { makeRng } from "./_shared";
import type { CreativeAnalytics, CreativeRecommendation, AdPlatform } from "../types";

const { pick, int, rnd } = makeRng(440055);

export const REC_META: Record<CreativeRecommendation, { label: string; variant: string }> = {
  scale: { label: "Масштабировать", variant: "green" },
  keep: { label: "Оставить", variant: "blue" },
  stop: { label: "Остановить", variant: "red" },
  change_offer: { label: "Заменить оффер", variant: "orange" },
  change_audience: { label: "Поменять аудиторию", variant: "yellow" },
  new_hook: { label: "Новый hook", variant: "purple" },
};

const PLATFORMS: AdPlatform[] = ["Meta", "TikTok", "YouTube", "Google"];
const NAMES = [
  "Reels «3 ошибки в английском»",
  "UGC отзыв ученицы IELTS",
  "Хук «Заговори за 2 месяца»",
  "Карусель «Уровни A1-C1»",
  "TikTok тренд + субтитры",
  "Сторис-опрос «Твой уровень»",
  "Кейс: 7.0 за 3 месяца",
  "Оффер «Пробный бесплатно»",
  "Shorts «English for Work»",
  "Статика «Speaking Club»",
];
const CAMPAIGNS = ["IELTS — холодная", "Speaking — ретаргет", "A1-A2 lookalike", "TikTok трафик", "Search Алматы"];

function recommend(cpl: number, roas: number, quality: number): CreativeRecommendation {
  if (roas >= 4 && quality >= 70) return "scale";
  if (roas >= 2 && quality >= 55) return "keep";
  if (cpl > 3000 && roas < 1.2) return "stop";
  if (quality < 45) return "change_audience";
  if (roas < 1.8 && quality >= 55) return "change_offer";
  return "new_hook";
}

export const CREATIVES: CreativeAnalytics[] = NAMES.map((name, i) => {
  const views = int(8000, 120000);
  const ctr = +(0.8 + rnd() * 4).toFixed(2);
  const clicks = Math.round((views * ctr) / 100);
  const leads = Math.max(5, Math.round(clicks * (0.04 + rnd() * 0.09)));
  const spend = leads * int(700, 2600);
  const cpl = Math.round(spend / leads);
  const trials = Math.round(leads * (0.25 + rnd() * 0.2));
  const sales = Math.round(trials * (0.2 + rnd() * 0.3));
  const revenue = sales * pick(PRICES);
  const roas = +(revenue / Math.max(1, spend)).toFixed(2);
  const quality = int(35, 95);
  return {
    id: `cr-${i + 1}`,
    name,
    platform: PLATFORMS[i % PLATFORMS.length],
    campaign: pick(CAMPAIGNS),
    views,
    clicks,
    ctr,
    leads,
    cpl,
    trials,
    sales,
    conversion: +((sales / Math.max(1, leads)) * 100).toFixed(1),
    revenue,
    roas,
    leadQuality: quality,
    recommendation: recommend(cpl, roas, quality),
  };
});
