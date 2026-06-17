import { makeRng, daysFromNowISO, daysAgoISO } from "./_shared";
import type { SmmContentIdea, SmmContentPlanItem, SmmFormat, SmmStatus } from "../types";

const { pick, int } = makeRng(220077);

export const SMM_FORMATS: SmmFormat[] = ["Instagram post", "Stories", "Reels", "TikTok", "YouTube Shorts"];

export const SMM_STATUS_LABEL: Record<SmmStatus, { label: string; variant: string }> = {
  idea: { label: "Идея", variant: "gray" },
  planned: { label: "В плане", variant: "blue" },
  in_progress: { label: "В работе", variant: "yellow" },
  published: { label: "Опубликовано", variant: "green" },
};

const RUBRICS = ["Польза", "Кейс ученика", "Прогрев", "Развлекательное", "Оффер", "За кадром", "Отзыв"];
const GOALS = ["Охват", "Вовлечённость", "Заявки", "Доверие", "Прогрев к офферу"];
const CTAS = [
  "Запишись на бесплатный пробный урок",
  "Напиши «СТАРТ» в директ",
  "Переходи по ссылке в bio",
  "Сохрани пост, чтобы не потерять",
  "Оставь заявку на сайте",
];
const TOPICS = [
  "3 ошибки, из-за которых ты не говоришь по-английски",
  "Как выучить 50 слов за неделю",
  "История ученицы: с нуля до B2 за полгода",
  "Топ-5 сериалов для прокачки английского",
  "Разбор: как сдать IELTS на 7.0",
  "Английский для работы: фразы для созвонов",
  "Мифы об изучении английского после 30",
  "Что входит в пробный урок bilimdibol",
  "Speaking Club: как проходят встречи",
  "Чек-лист: твой уровень английского",
];
const HOOKS = [
  "Стоп! Ты говоришь это неправильно…",
  "Я учила английский 5 лет и не говорила. Вот что помогло.",
  "Этот метод выучил мой мозг за выходные",
  "Никто не расскажет тебе про IELTS вот это",
  "POV: ты наконец заговорил на английском",
];

/** Deterministic idea generator (used as fallback) + topic-aware generator. */
export function generateIdeas(format: SmmFormat, topicSeed: string, count = 4): SmmContentIdea[] {
  const rng = makeRng(topicSeed.length * 131 + format.length);
  return Array.from({ length: count }).map((_, i) => ({
    id: `idea-${Date.now()}-${i}`,
    topic: topicSeed ? `${topicSeed}: ${rng.pick(["часть 1", "разбор", "чек-лист", "история", "ошибки"])}` : rng.pick(TOPICS),
    format,
    goal: rng.pick(GOALS),
    offer: "Бесплатный пробный урок английского",
    cta: rng.pick(CTAS),
    rubric: rng.pick(RUBRICS),
    hook: rng.pick(HOOKS),
  }));
}

export const SMM_IDEAS: SmmContentIdea[] = TOPICS.slice(0, 6).map((topic, i) => ({
  id: `idea-seed-${i + 1}`,
  topic,
  format: pick(SMM_FORMATS),
  goal: pick(GOALS),
  offer: "Бесплатный пробный урок английского",
  cta: pick(CTAS),
  rubric: pick(RUBRICS),
  hook: pick(HOOKS),
}));

const STATUSES: SmmStatus[] = ["idea", "planned", "in_progress", "published"];

export const SMM_PLAN: SmmContentPlanItem[] = Array.from({ length: 12 }).map((_, i) => {
  const status = STATUSES[i % STATUSES.length];
  const published = status === "published";
  return {
    id: `plan-${i + 1}`,
    topic: pick(TOPICS),
    format: pick(SMM_FORMATS),
    rubric: pick(RUBRICS),
    goal: pick(GOALS),
    cta: pick(CTAS),
    status,
    publishDate: published ? daysAgoISO(int(1, 10), int(9, 20)) : daysFromNowISO(int(0, 14), int(9, 20)),
  };
});
