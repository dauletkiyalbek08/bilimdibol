import type { Role, RoleId } from "./types";

export const PROJECT = {
  id: "english-course",
  name: "Английский курс",
  badge: "EN",
} as const;

export const ROLES: Role[] = [
  {
    id: "admin",
    name: "Admin / Директор",
    short: "Директор",
    description: "Полный доступ ко всем разделам платформы",
  },
  {
    id: "rop",
    name: "Руководитель отдела продаж",
    short: "РОП",
    description: "Лиды, продажи, команда, отчёты и KPI",
  },
  {
    id: "target",
    name: "Таргетолог",
    short: "Таргетолог",
    description: "Реклама, CAPI, воронки и AI-рекомендации",
  },
  {
    id: "hunter",
    name: "Hunter",
    short: "Hunter",
    description: "Свои лиды, пробные уроки и бонусы",
  },
  {
    id: "manager",
    name: "Менеджер / Учитель",
    short: "Менеджер",
    description: "Свои уроки, продажи, клиенты и бонусы",
  },
  {
    id: "accountant",
    name: "Бухгалтер",
    short: "Бухгалтер",
    description: "Финансы, продажи, чеки, зарплаты, договоры",
  },
  {
    id: "content",
    name: "Контент-редактор",
    short: "Контент",
    description: "AI Studio, ресурсы, воронки и креативы",
  },
  {
    id: "marketer",
    name: "Маркетолог",
    short: "Маркетолог",
    description: "Источники и качество лидов, атрибуция, креативы",
  },
  {
    id: "smm",
    name: "SMM-специалист",
    short: "SMM",
    description: "Идеи постов, stories, reels и контент-план",
  },
];

export function getRole(id: RoleId): Role {
  return ROLES.find((r) => r.id === id) ?? ROLES[0];
}

// ---------- Navigation / page access ----------
export type PageKey =
  | "dashboard"
  | "leads"
  | "crm"
  | "trials"
  | "sales"
  | "clients"
  | "calls"
  | "hunter"
  | "managers"
  | "advertising"
  | "creatives"
  | "marketing"
  | "smm"
  | "capi"
  | "chatbot"
  | "integrations"
  | "finance"
  | "payroll"
  | "attendance"
  | "contracts"
  | "resources"
  | "ai-studio"
  | "reports"
  | "settings"
  | "permissions";

export interface NavItem {
  key: PageKey;
  label: string;
  href: string;
  icon: string; // lucide icon name
  group: "main" | "sales" | "marketing" | "automation" | "finance" | "system";
}

export const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", label: "Главная", href: "/dashboard", icon: "LayoutDashboard", group: "main" },
  { key: "leads", label: "Лиды", href: "/leads", icon: "Users", group: "sales" },
  { key: "crm", label: "CRM Воронка", href: "/crm", icon: "KanbanSquare", group: "sales" },
  { key: "trials", label: "Пробные уроки", href: "/trials", icon: "GraduationCap", group: "sales" },
  { key: "sales", label: "Продажи", href: "/sales", icon: "ShoppingCart", group: "sales" },
  { key: "clients", label: "Клиенты", href: "/clients", icon: "UserCheck", group: "sales" },
  { key: "calls", label: "Анализ звонков", href: "/calls", icon: "PhoneCall", group: "sales" },
  { key: "hunter", label: "Hunter кабинет", href: "/hunter", icon: "Target", group: "sales" },
  { key: "managers", label: "Менеджеры / Учителя", href: "/managers", icon: "Presentation", group: "sales" },
  { key: "advertising", label: "Реклама", href: "/advertising", icon: "Megaphone", group: "marketing" },
  { key: "creatives", label: "Аналитика креативов", href: "/creatives", icon: "Image", group: "marketing" },
  { key: "marketing", label: "Marketing Dashboard", href: "/marketing", icon: "Radar", group: "marketing" },
  { key: "smm", label: "SMM Studio", href: "/smm", icon: "Instagram", group: "marketing" },
  { key: "capi", label: "CAPI", href: "/capi", icon: "Webhook", group: "marketing" },
  { key: "resources", label: "Ресурсы / Воронки", href: "/resources", icon: "Workflow", group: "marketing" },
  { key: "ai-studio", label: "AI Studio", href: "/ai-studio", icon: "Sparkles", group: "marketing" },
  { key: "chatbot", label: "ChatBot Builder", href: "/chatbot", icon: "Bot", group: "automation" },
  { key: "integrations", label: "Интеграции", href: "/integrations", icon: "Plug", group: "automation" },
  { key: "finance", label: "Финансы", href: "/finance", icon: "Wallet", group: "finance" },
  { key: "payroll", label: "Зарплаты", href: "/payroll", icon: "Banknote", group: "finance" },
  { key: "attendance", label: "Посещаемость", href: "/attendance", icon: "Clock", group: "finance" },
  { key: "contracts", label: "Договоры", href: "/contracts", icon: "FileText", group: "finance" },
  { key: "reports", label: "Отчёты", href: "/reports", icon: "BarChart3", group: "system" },
  { key: "settings", label: "Настройки", href: "/settings", icon: "Settings", group: "system" },
  { key: "permissions", label: "Права доступа", href: "/permissions", icon: "ShieldCheck", group: "system" },
];

// Pages visible per role
const ALL_PAGES: PageKey[] = NAV_ITEMS.map((n) => n.key);

export const ROLE_PAGES: Record<RoleId, PageKey[]> = {
  admin: ALL_PAGES,
  rop: [
    "dashboard",
    "leads",
    "crm",
    "trials",
    "sales",
    "clients",
    "calls",
    "hunter",
    "managers",
    "reports",
    "settings",
  ],
  target: [
    "dashboard",
    "advertising",
    "creatives",
    "capi",
    "resources",
    "ai-studio",
    "marketing",
    "reports",
    "settings",
  ],
  hunter: ["dashboard", "leads", "crm", "trials", "calls", "hunter", "settings"],
  manager: ["dashboard", "crm", "trials", "sales", "clients", "calls", "managers", "settings"],
  accountant: [
    "dashboard",
    "sales",
    "finance",
    "payroll",
    "attendance",
    "contracts",
    "reports",
    "settings",
  ],
  content: ["dashboard", "ai-studio", "resources", "smm", "creatives", "settings"],
  marketer: [
    "dashboard",
    "marketing",
    "creatives",
    "advertising",
    "resources",
    "capi",
    "smm",
    "reports",
    "settings",
  ],
  smm: ["dashboard", "smm", "chatbot", "resources", "creatives", "settings"],
};

export function canAccess(role: RoleId, page: PageKey): boolean {
  return ROLE_PAGES[role].includes(page);
}

// Granular permission matrix for the "Права доступа" page
export interface PermissionRow {
  label: string;
  perms: Record<RoleId, boolean>;
}

const make = (
  values: Partial<Record<RoleId, boolean>>,
): Record<RoleId, boolean> => ({
  admin: true,
  rop: false,
  target: false,
  hunter: false,
  manager: false,
  accountant: false,
  content: false,
  marketer: false,
  smm: false,
  ...values,
});

export const PERMISSION_MATRIX: PermissionRow[] = [
  {
    label: "Видит главный дашборд",
    perms: make({ rop: true, target: true, hunter: true, manager: true, accountant: true, content: true }),
  },
  {
    label: "Видит лиды (CRM)",
    perms: make({ rop: true, hunter: true }),
  },
  {
    label: "Редактирует лиды",
    perms: make({ rop: true, hunter: true }),
  },
  {
    label: "Видит продажи",
    perms: make({ rop: true, manager: true, accountant: true }),
  },
  {
    label: "Подтверждает чеки",
    perms: make({ accountant: true }),
  },
  {
    label: "Видит финансы",
    perms: make({ accountant: true }),
  },
  {
    label: "Видит зарплаты",
    perms: make({ accountant: true }),
  },
  {
    label: "Видит CRM воронку",
    perms: make({ rop: true, hunter: true, manager: true }),
  },
  {
    label: "Анализ звонков",
    perms: make({ rop: true, hunter: true, manager: true }),
  },
  {
    label: "Видит рекламу и CAPI",
    perms: make({ target: true, marketer: true }),
  },
  {
    label: "Аналитика креативов",
    perms: make({ target: true, marketer: true, content: true }),
  },
  {
    label: "Marketing Dashboard и атрибуция",
    perms: make({ target: true, marketer: true }),
  },
  {
    label: "Управляет воронками",
    perms: make({ target: true, content: true, marketer: true, smm: true }),
  },
  {
    label: "Работает в SMM Studio",
    perms: make({ smm: true, content: true, marketer: true }),
  },
  {
    label: "Настраивает ChatBot Builder",
    perms: make({ smm: true }),
  },
  {
    label: "Работает в AI Studio",
    perms: make({ target: true, content: true }),
  },
  {
    label: "Подтверждает начисление ЗП",
    perms: make({ accountant: true }),
  },
  {
    label: "Управляет интеграциями",
    perms: make({}),
  },
  {
    label: "Управляет правами доступа",
    perms: make({}),
  },
];
