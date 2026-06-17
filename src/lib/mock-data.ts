import { seededRandom } from "./utils";
import { PROJECT } from "./roles";
import type {
  User,
  Lead,
  LeadSource,
  LeadStatus,
  TrialLesson,
  TrialStatus,
  Sale,
  PaymentMethod,
  ReceiptStatus,
  Client,
  AdCampaign,
  AdPlatform,
  AdSpend,
  FinanceOperation,
  PayrollRecord,
  AttendanceRecord,
  AttendanceStatus,
  Contract,
  ContractType,
  ContractStatus,
  Funnel,
  FunnelType,
  RoleId,
} from "./types";

const PID = PROJECT.id;
const rnd = seededRandom(20260617);
const pick = <T,>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)];
const pad = (n: number) => String(n).padStart(2, "0");

function daysAgoISO(days: number, hour = 10, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}
function daysFromNowISO(days: number, hour = 10, minute = 0): string {
  return daysAgoISO(-days, hour, minute);
}

// =============================================================
// Employees
// =============================================================
const AVATAR_COLORS = [
  "#16A34A",
  "#FB923C",
  "#0EA5E9",
  "#8B5CF6",
  "#EC4899",
  "#F59E0B",
  "#14B8A6",
  "#EF4444",
  "#6366F1",
  "#84CC16",
  "#D946EF",
  "#0891B2",
];

export const EMPLOYEES: User[] = [
  { id: "u1", name: "Айжан К.", role: "admin", email: "aizhan@bilimdibol.kz", phone: "+7 701 111 22 33", avatarColor: AVATAR_COLORS[0], projectId: PID },
  { id: "u2", name: "Тимур Р.", role: "rop", email: "timur@bilimdibol.kz", phone: "+7 701 222 33 44", avatarColor: AVATAR_COLORS[1], projectId: PID },
  { id: "u3", name: "Мадина Т.", role: "hunter", email: "madina@bilimdibol.kz", phone: "+7 701 333 44 55", avatarColor: AVATAR_COLORS[2], projectId: PID },
  { id: "u4", name: "Аружан Ж.", role: "hunter", email: "aruzhan@bilimdibol.kz", phone: "+7 701 444 55 66", avatarColor: AVATAR_COLORS[3], projectId: PID },
  { id: "u5", name: "Нурлан К.", role: "hunter", email: "nurlan@bilimdibol.kz", phone: "+7 701 555 66 77", avatarColor: AVATAR_COLORS[4], projectId: PID },
  { id: "u6", name: "Салтанат Ж.", role: "manager", email: "saltanat@bilimdibol.kz", phone: "+7 701 666 77 88", avatarColor: AVATAR_COLORS[5], projectId: PID },
  { id: "u7", name: "Айна Б.", role: "manager", email: "aina@bilimdibol.kz", phone: "+7 701 777 88 99", avatarColor: AVATAR_COLORS[6], projectId: PID },
  { id: "u8", name: "Диас А.", role: "target", email: "dias@bilimdibol.kz", phone: "+7 701 888 99 00", avatarColor: AVATAR_COLORS[7], projectId: PID },
  { id: "u9", name: "Гульмира С.", role: "accountant", email: "gulmira@bilimdibol.kz", phone: "+7 701 999 00 11", avatarColor: AVATAR_COLORS[8], projectId: PID },
  { id: "u10", name: "Еркежан М.", role: "content", email: "yerkezhan@bilimdibol.kz", phone: "+7 701 000 11 22", avatarColor: AVATAR_COLORS[9], projectId: PID },
  { id: "u11", name: "Жанар О.", role: "marketer", email: "zhanar@bilimdibol.kz", phone: "+7 701 121 34 55", avatarColor: AVATAR_COLORS[10], projectId: PID },
  { id: "u12", name: "Камиля Д.", role: "smm", email: "kamilya@bilimdibol.kz", phone: "+7 701 232 45 66", avatarColor: AVATAR_COLORS[11], projectId: PID },
];

export const HUNTERS = EMPLOYEES.filter((e) => e.role === "hunter");
export const MANAGERS = EMPLOYEES.filter((e) => e.role === "manager");

export function employeeName(id: string): string {
  return EMPLOYEES.find((e) => e.id === id)?.name ?? "—";
}
export function employeeById(id: string): User | undefined {
  return EMPLOYEES.find((e) => e.id === id);
}

// =============================================================
// Catalogs
// =============================================================
export const COURSES = [
  "General English A1",
  "General English A2",
  "General English B1",
  "General English B2",
  "Speaking Club",
  "IELTS Start",
  "IELTS Pro",
  "English for Work",
  "English for Travel",
];

export const PRICES = [89000, 129000, 159000, 189000, 249000];

export const SOURCES: LeadSource[] = [
  "Instagram",
  "TikTok",
  "YouTube",
  "Meta Ads",
  "Google Ads",
  "Quiz",
  "Landing Page",
  "WhatsApp",
  "Referral",
];

export const PAYMENT_METHODS: PaymentMethod[] = [
  "Kaspi",
  "Наличные",
  "Банк",
  "Рассрочка",
  "Halyk",
  "Forte",
];

const FIRST_NAMES = [
  "Алишер", "Дана", "Ержан", "Камила", "Бекзат", "Айгерим", "Санжар", "Динара",
  "Арман", "Жанель", "Алмас", "Аяулым", "Ислам", "Балжан", "Дамир", "Назгуль",
  "Темирлан", "Асель", "Руслан", "Гаухар", "Олжас", "Сабина", "Мирас", "Алия",
  "Нурсултан", "Жанна", "Адиль", "Карина", "Бауыржан", "Меруерт", "Ескендир",
  "Айша", "Данияр", "Зарина", "Кайрат", "Лейла", "Серик", "Томирис", "Ансар",
];
const LAST_INITIALS = ["А.", "Б.", "Е.", "К.", "М.", "Н.", "С.", "Т.", "Ж.", "Д."];

function fullName(i: number): string {
  return `${FIRST_NAMES[i % FIRST_NAMES.length]} ${LAST_INITIALS[i % LAST_INITIALS.length]}`;
}
function phone(i: number): string {
  const a = 700 + (i % 80);
  return `+7 ${a} ${pad((i * 7) % 100)}${pad((i * 3) % 10)} ${pad((i * 11) % 100)} ${pad((i * 13) % 100)}`;
}

// =============================================================
// Leads
// =============================================================
const LEAD_STATUSES: LeadStatus[] = [
  "new", "in_progress", "no_answer", "bought_trial",
  "passed_to_manager", "rejected", "duplicate", "low_quality",
];
const LEAD_COMMENTS = [
  "Интересуется курсом для работы",
  "Просила перезвонить вечером",
  "Хочет IELTS до конца года",
  "Уточняет цену и рассрочку",
  "Готова на пробный урок",
  "Сомневается, думает",
  "Нужен английский для путешествий",
  "Спрашивала про расписание",
  "Родитель ученика, интересуется детским",
  "Оставила заявку через квиз",
];

export const LEADS: Lead[] = Array.from({ length: 64 }).map((_, i) => {
  const status = LEAD_STATUSES[i % LEAD_STATUSES.length];
  const hunter = pick(HUNTERS);
  const created = daysAgoISO(Math.floor(rnd() * 45));
  const history = [
    { date: created, author: hunter.name, text: "Лид создан, первый контакт" },
  ];
  if (rnd() > 0.4) {
    history.push({
      date: daysAgoISO(Math.floor(rnd() * 20)),
      author: hunter.name,
      text: pick(["Дозвонился, отправил оффер", "Не ответил, написал в WhatsApp", "Договорились о пробном", "Уточнил детали курса"]),
    });
  }
  return {
    id: `lead-${i + 1}`,
    projectId: PID,
    name: fullName(i),
    phone: phone(i),
    email: rnd() > 0.5 ? `${FIRST_NAMES[i % FIRST_NAMES.length].toLowerCase()}${i}@gmail.com` : undefined,
    instagram: rnd() > 0.4 ? `@${FIRST_NAMES[i % FIRST_NAMES.length].toLowerCase()}_${i}` : undefined,
    source: pick(SOURCES),
    hunterId: hunter.id,
    status,
    createdAt: created,
    nextTouch: status === "in_progress" || status === "new" ? daysFromNowISO(Math.floor(rnd() * 5)) : undefined,
    comment: pick(LEAD_COMMENTS),
    history,
  };
});

// =============================================================
// Trial lessons
// =============================================================
const TRIAL_STATUSES: TrialStatus[] = [
  "scheduled", "completed", "no_show", "rescheduled", "bought", "rejected",
];
const TRIAL_RESULTS: Record<TrialStatus, string> = {
  scheduled: "Ожидается",
  completed: "Урок проведён, думает",
  no_show: "Не явился на урок",
  rescheduled: "Перенесён по просьбе клиента",
  bought: "Купил курс после пробного",
  rejected: "Отказался после пробного",
};

export const TRIALS: TrialLesson[] = Array.from({ length: 38 }).map((_, i) => {
  const status = TRIAL_STATUSES[i % TRIAL_STATUSES.length];
  const dayOffset = status === "scheduled" ? -Math.floor(rnd() * 6) : Math.floor(rnd() * 30);
  const course = pick(COURSES);
  return {
    id: `trial-${i + 1}`,
    projectId: PID,
    clientName: fullName(i + 3),
    datetime: daysAgoISO(dayOffset, 9 + (i % 9), (i % 2) * 30),
    hunterId: pick(HUNTERS).id,
    managerId: pick(MANAGERS).id,
    status,
    result: TRIAL_RESULTS[status],
    offeredCourse: course,
    price: pick(PRICES),
  };
});

// =============================================================
// Sales
// =============================================================
const RECEIPT_STATUSES: ReceiptStatus[] = ["pending", "confirmed", "rejected"];

export const SALES: Sale[] = Array.from({ length: 46 }).map((_, i) => {
  const method = pick(PAYMENT_METHODS);
  const receiptStatus: ReceiptStatus =
    i % 7 === 0 ? "pending" : i % 11 === 0 ? "rejected" : "confirmed";
  return {
    id: `sale-${i + 1}`,
    projectId: PID,
    clientName: fullName(i + 1),
    course: pick(COURSES),
    amount: pick(PRICES),
    method,
    managerId: pick(MANAGERS).id,
    hunterId: pick(HUNTERS).id,
    receiptStatus,
    contractStatus: pick(["Подписан", "Отправлен", "Черновик"] as const),
    capiSent: rnd() > 0.3,
    date: daysAgoISO(Math.floor(rnd() * 40)),
    installment: method === "Рассрочка",
  };
});

// =============================================================
// Clients (>= 30)
// =============================================================
export const CLIENTS: Client[] = Array.from({ length: 34 }).map((_, i) => {
  const course = pick(COURSES);
  const status = pick(["Активный", "Активный", "Активный", "Завершил", "Пауза", "Возврат"] as const);
  return {
    id: `client-${i + 1}`,
    projectId: PID,
    name: fullName(i + 5),
    phone: phone(i + 5),
    email: rnd() > 0.4 ? `${FIRST_NAMES[(i + 5) % FIRST_NAMES.length].toLowerCase()}.client${i}@mail.kz` : undefined,
    course,
    managerId: pick(MANAGERS).id,
    totalPaid: pick(PRICES) * (rnd() > 0.6 ? 1 : 1),
    status,
    joinedAt: daysAgoISO(Math.floor(rnd() * 120) + 10),
    progress: Math.floor(rnd() * 100),
  };
});

// =============================================================
// Advertising
// =============================================================
const PLATFORMS: AdPlatform[] = ["Meta", "TikTok", "YouTube", "Google"];
const USD_RATE = 478;
const AD_RECS: Record<string, string> = {
  good: "Масштабировать бюджет +30%",
  mid: "Тест новых креативов",
  low: "Снизить бюджет, слабый CPL",
};

const CAMPAIGN_NAMES: Record<AdPlatform, string[]> = {
  Meta: ["IELTS — холодная", "Speaking Club — ретаргет", "A1-A2 lookalike"],
  TikTok: ["Reels English Hacks", "Trends — пробный урок", "Студенты TikTok"],
  YouTube: ["Shorts — English for Work", "Pre-roll IELTS Pro"],
  Google: ["Search — курсы английского", "Search — IELTS Алматы"],
};

export const AD_CAMPAIGNS: AdCampaign[] = PLATFORMS.flatMap((platform, pi) =>
  CAMPAIGN_NAMES[platform].map((name, ci) => {
    const budgetUsd = 400 + Math.floor(rnd() * 1400);
    const leads = 30 + Math.floor(rnd() * 160);
    const cplUsd = +(budgetUsd / leads).toFixed(2);
    const sales = Math.floor(leads * (0.05 + rnd() * 0.12));
    const revenueKzt = sales * pick(PRICES);
    const budgetKzt = budgetUsd * USD_RATE;
    const romi = +(((revenueKzt - budgetKzt) / budgetKzt) * 100).toFixed(0);
    const rec = romi > 250 ? AD_RECS.good : romi > 80 ? AD_RECS.mid : AD_RECS.low;
    return {
      id: `camp-${pi}-${ci}`,
      projectId: PID,
      platform,
      name,
      budgetUsd,
      budgetKzt,
      leads,
      cplUsd,
      cplKzt: Math.round(cplUsd * USD_RATE),
      sales,
      revenueKzt,
      romi,
      recommendation: rec,
    };
  }),
);

export const AD_SPEND: AdSpend[] = Array.from({ length: 30 }).flatMap((_, d) =>
  PLATFORMS.map((platform) => {
    const spendUsd = 30 + Math.floor(rnd() * 120);
    return {
      date: daysAgoISO(29 - d),
      platform,
      spendUsd,
      spendKzt: spendUsd * USD_RATE,
      leads: 3 + Math.floor(rnd() * 18),
    };
  }),
);

export { USD_RATE };

// =============================================================
// Finance
// =============================================================
const INCOME_CATEGORIES = ["Продажа курса", "Рассрочка — платёж", "Доп. услуги", "Speaking Club"];
const EXPENSE_CATEGORIES = ["Реклама", "Зарплаты", "Аренда офиса", "Сервисы и софт", "Возврат клиенту", "Налоги"];

export const FINANCE_OPS: FinanceOperation[] = Array.from({ length: 60 }).map((_, i) => {
  const type = rnd() > 0.42 ? "income" : "expense";
  const category = type === "income" ? pick(INCOME_CATEGORIES) : pick(EXPENSE_CATEGORIES);
  const base =
    type === "income"
      ? pick(PRICES)
      : pick([180000, 450000, 320000, 95000, 89000, 240000]);
  return {
    id: `fin-${i + 1}`,
    date: daysAgoISO(Math.floor(rnd() * 45)),
    category,
    type,
    amount: base,
    responsible: type === "income" ? pick(MANAGERS).name : pick([EMPLOYEES[8].name, EMPLOYEES[7].name, EMPLOYEES[0].name]),
    comment:
      type === "income"
        ? pick(["Оплата Kaspi", "Перевод на счёт", "Наличные в кассу", "Платёж по рассрочке"])
        : pick(["Бюджет Meta", "ФОТ отдела", "Месячная аренда", "Подписка CRM", "Возврат по заявлению", "Квартальный налог"]),
  };
});

// =============================================================
// Payroll
// =============================================================
const ROLE_BASE: Record<RoleId, number> = {
  admin: 900000,
  rop: 600000,
  target: 450000,
  hunter: 250000,
  manager: 320000,
  accountant: 380000,
  content: 300000,
  marketer: 420000,
  smm: 320000,
};

export const PAYROLL: PayrollRecord[] = EMPLOYEES.map((e, i) => {
  const base = ROLE_BASE[e.role];
  const kpi = 60 + Math.floor(rnd() * 40);
  const salesCount = e.role === "hunter" || e.role === "manager" ? 8 + Math.floor(rnd() * 22) : 0;
  const bonus = Math.round((base * 0.35 * kpi) / 100 + salesCount * 6000);
  const attendance = 80 + Math.floor(rnd() * 20);
  const bonusAdjustment = attendance < 90 ? -Math.round(bonus * 0.08) : rnd() > 0.7 ? Math.round(bonus * 0.05) : 0;
  const total = base + bonus + bonusAdjustment;
  const status = i % 5 === 0 ? "review" : i % 3 === 0 ? "accrued" : "paid";
  return {
    id: `pay-${e.id}`,
    employeeId: e.id,
    employeeName: e.name,
    role: e.role,
    baseSalary: base,
    kpiPercent: kpi,
    salesCount,
    bonus,
    attendanceScore: attendance,
    bonusAdjustment,
    total,
    status,
  };
});

// =============================================================
// Attendance
// =============================================================
const ATT_STATUSES: AttendanceStatus[] = ["on_time", "late", "absent", "remote", "day_off"];

export const ATTENDANCE: AttendanceRecord[] = EMPLOYEES.flatMap((e, ei) =>
  Array.from({ length: 5 }).map((_, d) => {
    const status = ATT_STATUSES[(ei + d) % ATT_STATUSES.length];
    const isPresent = status === "on_time" || status === "late" || status === "remote";
    const lateMin = status === "late" ? 10 + Math.floor(rnd() * 35) : 0;
    return {
      id: `att-${e.id}-${d}`,
      employeeId: e.id,
      employeeName: e.name,
      role: e.role,
      date: daysAgoISO(d),
      checkIn: isPresent ? `${pad(9 + Math.floor(lateMin / 60))}:${pad((lateMin % 60))}` : undefined,
      checkOut: isPresent ? `${pad(18 + (d % 2))}:${pad((ei * 7) % 60)}` : undefined,
      status,
      comment:
        status === "late"
          ? `Опоздание ${lateMin} мин`
          : status === "remote"
          ? "Удалённый день"
          : status === "absent"
          ? "Отсутствовал"
          : status === "day_off"
          ? "Выходной"
          : "",
    };
  }),
);

// =============================================================
// Contracts
// =============================================================
const CONTRACT_TYPES: ContractType[] = [
  "Договор с учеником",
  "Договор рассрочки",
  "Оферта",
  "Согласие на обработку ПД",
  "Договор с сотрудником",
  "NDA",
  "KPI-приложение",
  "Акт оказанных услуг",
];
const CONTRACT_STATUSES: ContractStatus[] = ["draft", "sent", "signed", "rejected"];

export const CONTRACTS: Contract[] = Array.from({ length: 24 }).map((_, i) => {
  const type = CONTRACT_TYPES[i % CONTRACT_TYPES.length];
  const status = CONTRACT_STATUSES[i % CONTRACT_STATUSES.length];
  const isEmployeeDoc = ["Договор с сотрудником", "NDA", "KPI-приложение"].includes(type);
  return {
    id: `doc-${i + 1}`,
    type,
    party: isEmployeeDoc ? pick(EMPLOYEES).name : fullName(i + 2),
    status,
    createdAt: daysAgoISO(Math.floor(rnd() * 30) + 1),
    signedAt: status === "signed" ? daysAgoISO(Math.floor(rnd() * 20)) : undefined,
  };
});

// =============================================================
// Funnels / Resources
// =============================================================
const FUNNEL_DEFS: { name: string; type: FunnelType; source: string; url: string }[] = [
  { name: "Quiz «Узнай свой уровень»", type: "Quiz", source: "Meta Ads", url: "quiz.bilimdibol.kz/level" },
  { name: "Landing — IELTS Pro", type: "Landing", source: "Google Ads", url: "bilimdibol.kz/ielts" },
  { name: "Landing — General English", type: "Landing", source: "Google Ads", url: "bilimdibol.kz/start" },
  { name: "Instagram воронка", type: "Instagram", source: "Instagram", url: "instagram.com/bilimdibol" },
  { name: "TikTok воронка", type: "TikTok", source: "TikTok", url: "tiktok.com/@bilimdibol" },
  { name: "YouTube воронка", type: "YouTube", source: "YouTube", url: "youtube.com/@bilimdibol" },
  { name: "WhatsApp воронка", type: "WhatsApp", source: "WhatsApp", url: "wa.me/bilimdibol" },
];

export const FUNNELS: Funnel[] = FUNNEL_DEFS.map((f, i) => {
  const visitors = 1800 + Math.floor(rnd() * 9000);
  const leads = Math.floor(visitors * (0.04 + rnd() * 0.09));
  const sales = Math.floor(leads * (0.06 + rnd() * 0.12));
  const revenue = sales * pick(PRICES);
  const spend = leads * (900 + Math.floor(rnd() * 1500));
  return {
    id: `funnel-${i + 1}`,
    name: f.name,
    url: f.url,
    source: f.source,
    type: f.type,
    visitors,
    leads,
    conversion: +((leads / visitors) * 100).toFixed(1),
    cpl: Math.round(spend / leads),
    sales,
    revenue,
  };
});

// Notification feed (topbar bell)
export const NOTIFICATIONS = [
  { id: "n1", title: "Новый лид с Instagram", text: "Камила А. оставила заявку через квиз", time: "5 мин назад", unread: true },
  { id: "n2", title: "Чек на проверке", text: "Продажа IELTS Pro — 249 000 ₸, ожидает подтверждения", time: "32 мин назад", unread: true },
  { id: "n3", title: "Пробный урок проведён", text: "Айна Б. провела пробный урок, клиент думает", time: "1 ч назад", unread: true },
  { id: "n4", title: "ROAS вырос", text: "Кампания «IELTS — холодная» вышла на ROMI 280%", time: "3 ч назад", unread: false },
  { id: "n5", title: "Зарплата начислена", text: "Начисления за период готовы к проверке", time: "Вчера", unread: false },
];
