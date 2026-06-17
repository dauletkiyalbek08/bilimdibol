// Offer-specific landing funnels. Each slug = a ready ad link at /f/<slug>.
// All submit to /api/leads/intake (source = utm_source || "Landing Page").

export interface FunnelOffer {
  slug: string;
  title: string; // short label for the catalog
  badge: string;
  headlineStart: string;
  headlineHighlight: string;
  subtitle: string;
  benefits: string[];
  courses: string[];
  cta: string;
}

export const FUNNEL_OFFERS: FunnelOffer[] = [
  {
    slug: "general",
    title: "General English",
    badge: "Английский с нуля",
    headlineStart: "Английский, на котором ты",
    headlineHighlight: "заговоришь",
    subtitle: "Бесплатный пробный урок — подберём программу под твой уровень и цель.",
    benefits: [
      "Speaking-first методика: говоришь с первого занятия",
      "Гибкое расписание — утром, днём или вечером",
      "Преподаватели с опытом и сертификатами",
    ],
    courses: ["General English", "Разговорный", "Для себя", "Не знаю — нужен тест"],
    cta: "Записаться на пробный",
  },
  {
    slug: "ielts",
    title: "IELTS",
    badge: "Подготовка к IELTS",
    headlineStart: "Сдай IELTS на",
    headlineHighlight: "7.0+",
    subtitle: "Индивидуальная подготовка с разбором всех модулей. Бесплатный пробный урок.",
    benefits: [
      "Стратегии под Listening, Reading, Writing, Speaking",
      "Пробный экзамен и разбор ошибок",
      "Результат в среднем за 3–4 месяца",
    ],
    courses: ["IELTS Start", "IELTS Pro", "Не знаю — нужен тест"],
    cta: "Начать подготовку",
  },
  {
    slug: "work",
    title: "Английский для работы",
    badge: "English for Work",
    headlineStart: "Английский для",
    headlineHighlight: "карьеры",
    subtitle: "Деловой английский для созвонов, переписки и переговоров. Пробный урок бесплатно.",
    benefits: [
      "Фразы для митингов, писем и презентаций",
      "Уверенный small talk с иностранными партнёрами",
      "Программа под вашу сферу",
    ],
    courses: ["English for Work", "Разговорный", "Бизнес-английский"],
    cta: "Прокачать рабочий английский",
  },
  {
    slug: "kids",
    title: "Английский для детей",
    badge: "Детям и подросткам",
    headlineStart: "Английский, который ребёнок",
    headlineHighlight: "полюбит",
    subtitle: "Занятия в игровой форме, без зубрёжки. Бесплатный пробный урок для ребёнка.",
    benefits: [
      "Интерактивные уроки — детям интересно",
      "Преподаватели, которые умеют с детьми",
      "Отчёты о прогрессе для родителей",
    ],
    courses: ["Для ребёнка 6–10 лет", "Для подростка 11–16 лет", "Не знаю — нужен тест"],
    cta: "Записать ребёнка",
  },
  {
    slug: "speaking",
    title: "Разговорный клуб",
    badge: "Speaking Club",
    headlineStart: "Заговори свободно в",
    headlineHighlight: "Speaking Club",
    subtitle: "Живая разговорная практика с носителями тем и преподавателями. Первое занятие бесплатно.",
    benefits: [
      "Реальная практика речи каждое занятие",
      "Снятие языкового барьера",
      "Дружелюбная атмосфера в мини-группах",
    ],
    courses: ["Speaking Club", "Разговорный (инд.)", "Не знаю — нужен тест"],
    cta: "Прийти на клуб",
  },
  {
    slug: "travel",
    title: "Английский для путешествий",
    badge: "English for Travel",
    headlineStart: "Английский для",
    headlineHighlight: "путешествий",
    subtitle: "Всё для уверенных поездок: аэропорт, отель, кафе, общение. Пробный урок бесплатно.",
    benefits: [
      "Готовые фразы для реальных ситуаций",
      "Быстрый старт за несколько недель",
      "Без скучной грамматики",
    ],
    courses: ["English for Travel", "Разговорный", "Не знаю — нужен тест"],
    cta: "Подготовиться к поездке",
  },
];

export function getOffer(slug: string): FunnelOffer | undefined {
  return FUNNEL_OFFERS.find((o) => o.slug === slug);
}
