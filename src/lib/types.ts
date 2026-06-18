// =============================================================
// Core domain types for the bilimdibol platform (demo)
// Designed so mock data can later be swapped for Supabase rows.
// =============================================================

export type RoleId =
  | "admin"
  | "rop"
  | "target"
  | "hunter"
  | "manager"
  | "accountant"
  | "content"
  | "marketer"
  | "smm";

export interface Role {
  id: RoleId;
  name: string;
  short: string;
  description: string;
}

export interface Project {
  id: string; // e.g. "english-course"
  name: string;
  badge: string; // e.g. "EN"
}

export interface User {
  id: string;
  name: string;
  role: RoleId;
  email: string;
  phone?: string;
  avatarColor: string;
  projectId: string;
}

// ---------- Leads / CRM ----------
export type LeadStatus =
  | "new"
  | "in_progress"
  | "no_answer"
  | "bought_trial"
  | "passed_to_manager"
  | "rejected"
  | "duplicate"
  | "low_quality";

export type LeadSource =
  | "Instagram"
  | "TikTok"
  | "YouTube"
  | "Meta Ads"
  | "Google Ads"
  | "Quiz"
  | "Landing Page"
  | "WhatsApp"
  | "Referral";

export interface InteractionLog {
  date: string; // ISO
  author: string;
  text: string;
}

export interface Lead {
  id: string;
  projectId: string;
  name: string;
  phone: string;
  email?: string;
  instagram?: string;
  source: LeadSource;
  hunterId: string;
  status: LeadStatus;
  createdAt: string; // ISO
  nextTouch?: string; // ISO
  comment: string;
  history: InteractionLog[];
}

// ---------- Trial lessons ----------
export type TrialStatus =
  | "scheduled"
  | "completed"
  | "no_show"
  | "rescheduled"
  | "bought"
  | "rejected";

export interface TrialLesson {
  id: string;
  projectId: string;
  clientName: string;
  datetime: string; // ISO
  hunterId: string;
  managerId: string;
  status: TrialStatus;
  result: string;
  offeredCourse: string;
  price: number;
}

// ---------- Sales / payments ----------
export type PaymentMethod =
  | "Kaspi"
  | "Наличные"
  | "Банк"
  | "Рассрочка"
  | "Halyk"
  | "Forte";

export type ReceiptStatus = "pending" | "confirmed" | "rejected";

export interface Sale {
  id: string;
  projectId: string;
  clientName: string;
  course: string;
  amount: number;
  method: PaymentMethod;
  managerId: string;
  hunterId: string;
  receiptStatus: ReceiptStatus;
  contractStatus: "Подписан" | "Отправлен" | "Черновик";
  capiSent: boolean;
  date: string; // ISO
  installment: boolean;
}

// ---------- Clients ----------
export interface Client {
  id: string;
  projectId: string;
  name: string;
  phone: string;
  email?: string;
  course: string;
  managerId: string;
  totalPaid: number;
  status: "Активный" | "Завершил" | "Пауза" | "Возврат";
  joinedAt: string;
  progress: number; // 0-100
}

// ---------- Advertising ----------
export type AdPlatform = "Meta" | "TikTok" | "YouTube" | "Google";

export interface AdCampaign {
  id: string;
  projectId: string;
  platform: AdPlatform;
  name: string;
  budgetUsd: number;
  budgetKzt: number;
  leads: number;
  cplUsd: number;
  cplKzt: number;
  sales: number;
  revenueKzt: number;
  romi: number;
  recommendation: string;
}

export interface AdSpend {
  date: string; // ISO
  platform: AdPlatform;
  spendUsd: number;
  spendKzt: number;
  leads: number;
}

// ---------- Finance ----------
export type FinanceType = "income" | "expense";

export interface FinanceOperation {
  id: string;
  date: string;
  category: string;
  type: FinanceType;
  amount: number;
  responsible: string;
  comment: string;
}

// ---------- Payroll ----------
export type PayrollStatus = "accrued" | "review" | "paid";

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  role: RoleId;
  baseSalary: number;
  kpiPercent: number; // 0-100
  salesCount: number;
  bonus: number;
  attendanceScore: number; // 0-100
  bonusAdjustment: number; // can be negative — "корректировка бонуса"
  total: number;
  status: PayrollStatus;
}

// ---------- Attendance ----------
export type AttendanceStatus =
  | "on_time"
  | "late"
  | "absent"
  | "remote"
  | "day_off";

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  role: RoleId;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: AttendanceStatus;
  comment: string;
  lat?: number;
  lng?: number;
}

// ---------- Contracts ----------
export type ContractStatus = "draft" | "sent" | "signed" | "rejected";

export type ContractType =
  | "Договор с учеником"
  | "Договор рассрочки"
  | "Оферта"
  | "Согласие на обработку ПД"
  | "Договор с сотрудником"
  | "NDA"
  | "KPI-приложение"
  | "Акт оказанных услуг";

export interface Contract {
  id: string;
  type: ContractType;
  party: string; // client or employee name
  status: ContractStatus;
  createdAt: string;
  signedAt?: string;
}

// ---------- Funnels / resources ----------
export type FunnelType = "Quiz" | "Landing" | "Instagram" | "TikTok" | "YouTube" | "WhatsApp";

export interface Funnel {
  id: string;
  name: string;
  url: string;
  source: string;
  type: FunnelType;
  visitors: number;
  leads: number;
  conversion: number; // %
  cpl: number;
  sales: number;
  revenue: number;
}

// ---------- Reports ----------
export type ReportType =
  | "director"
  | "sales"
  | "advertising"
  | "hunters"
  | "managers"
  | "finance"
  | "payroll"
  | "trials"
  | "funnels";

export interface Report {
  id: string;
  type: ReportType;
  name: string;
  period: string;
  generatedAt: string;
  status: "ready" | "generating";
}

// ---------- AI Studio ----------
export interface AiStudioScene {
  index: number;
  title: string;
  script: string;
  visual: string;
  duration: number;
}

export interface AiStudioTask {
  id: string;
  format: "Reels" | "TikTok" | "Stories" | "YouTube Shorts";
  duration: 15 | 30 | 60;
  videoCount: number;
  consistentCharacter: boolean;
  style: string;
  cta: string;
  scenes: AiStudioScene[];
  createdAt: string;
}

// ---------- Date range ----------
export type DateRangePreset =
  | "today"
  | "yesterday"
  | "last7"
  | "last30"
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_month"
  | "this_year"
  | "custom";

export interface DateRange {
  preset: DateRangePreset;
  from: string; // ISO
  to: string; // ISO
  label: string;
}

// ---------- Dashboard aggregates ----------
export interface DashboardStats {
  revenue: number;
  expenses: number;
  netProfit: number;
  leads: number;
  cpl: number;
  trials: number;
  sales: number;
  conversion: number;
  revenueTrend: { date: string; revenue: number; expense: number }[];
  funnel: { stage: string; value: number }[];
  salesByDay: { date: string; sales: number }[];
  topHunters: { name: string; leads: number; trials: number; sales: number; revenue: number }[];
  topManagers: { name: string; trials: number; sales: number; revenue: number }[];
  recentSales: Sale[];
}

// =============================================================
// STAGE 2 — CRM Pipeline / Calls / ChatBot / Integrations /
// Creatives / Marketing attribution / SMM
// =============================================================

// ---------- CRM Pipeline (amoCRM replacement) ----------
export type DealStage =
  | "new"
  | "contacted"
  | "trial_scheduled"
  | "trial_done"
  | "contract"
  | "payment"
  | "won"
  | "lost";

export type LeadQuality = "hot" | "warm" | "cold";

export interface DealTask {
  id: string;
  title: string;
  due: string; // ISO
  done: boolean;
}

export interface Deal {
  id: string;
  projectId: string;
  clientName: string;
  phone: string;
  source: LeadSource;
  amount: number;
  hunterId: string;
  managerId: string;
  stage: DealStage;
  nextStep: string;
  nextTouch?: string; // ISO
  quality: LeadQuality;
  probability: number; // 0-100
  comment: string;
  utmCampaign?: string;
  creativeId?: string;
  contractStatus: "Нет" | "Черновик" | "Отправлен" | "Подписан";
  receiptStatus: "Нет" | "На проверке" | "Подтверждён";
  createdAt: string;
  history: InteractionLog[];
  tasks: DealTask[];
}

// ---------- Call analysis (for ROP) ----------
export type CallLanguage = "ru" | "kz" | "mixed";
export type CallAnalysisStatus = "pending" | "analyzing" | "done";

export interface CallAnalysisChecklist {
  greeting: boolean;
  politeTone: boolean;
  needsDiscovered: boolean;
  coursePresented: boolean;
  objectionsHandled: boolean;
  trialOffered: boolean;
  nextStepFixed: boolean;
  properClosing: boolean;
  scriptFollowed: boolean;
}

export interface CallAnalysis {
  summary: string;
  checklist: CallAnalysisChecklist;
  score: number; // 0-100
  recommendations: string[];
  detectedLanguage: CallLanguage;
  good: string;
  improve: string;
}

export interface CallRecord {
  id: string;
  date: string; // ISO
  employeeId: string;
  employeeName: string;
  role: RoleId;
  clientName: string;
  durationSec: number;
  language: CallLanguage;
  status: CallAnalysisStatus;
  score: number | null;
  result: string;
  dealId?: string;
  transcript: { speaker: "agent" | "client"; text: string }[];
  analysis: CallAnalysis | null;
}

// ---------- ChatBot Builder (ChatPlace replacement) ----------
export type BotChannel = "instagram" | "messenger" | "whatsapp";

export type BotNodeType =
  | "message"
  | "question"
  | "buttons"
  | "condition"
  | "collect_phone"
  | "book_trial"
  | "handoff"
  | "tag"
  | "delay"
  | "webhook";

export interface ChatBotNode {
  id: string;
  type: BotNodeType;
  title: string;
  text: string;
  options?: string[]; // for buttons / question
  config?: Record<string, string>;
}

export interface ChatBotEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
}

export interface ChatBotFlow {
  id: string;
  name: string;
  channel: BotChannel;
  active: boolean;
  description: string;
  nodes: ChatBotNode[];
  edges: ChatBotEdge[];
  stats: {
    runs: number;
    replies: number;
    phones: number;
    trials: number;
    handoffs: number;
    conversion: number; // %
  };
}

export interface BotSimMessage {
  from: "bot" | "user";
  text: string;
  options?: string[];
}

// ---------- Integrations ----------
export type IntegrationStatus = "connected" | "mock" | "error";

export interface IntegrationEvent {
  id: string;
  channel: string;
  type: string;
  payload: string;
  time: string;
  status: "ok" | "pending" | "failed";
}

export interface IntegrationChannel {
  id: string;
  name: string;
  icon: string;
  status: IntegrationStatus;
  description: string;
  envVars: string[];
  webhookUrl?: string;
  events: IntegrationEvent[];
}

// ---------- Creative analytics ----------
export type CreativeRecommendation =
  | "scale"
  | "keep"
  | "stop"
  | "change_offer"
  | "change_audience"
  | "new_hook";

export interface CreativeAnalytics {
  id: string;
  name: string;
  platform: AdPlatform;
  campaign: string;
  views: number;
  clicks: number;
  ctr: number; // %
  leads: number;
  cpl: number;
  trials: number;
  sales: number;
  conversion: number; // %
  revenue: number;
  roas: number;
  leadQuality: number; // 0-100
  recommendation: CreativeRecommendation;
}

// ---------- Marketing attribution ----------
export interface MarketingAttribution {
  id: string;
  clientName: string;
  firstTouchSource: LeadSource;
  lastTouchSource: LeadSource;
  assistedSource: LeadSource;
  utmCampaign: string;
  creativeId: string;
  confidenceScore: number; // 0-100
  converted: boolean;
}

// ---------- SMM Studio ----------
export type SmmFormat = "Instagram post" | "Stories" | "Reels" | "TikTok" | "YouTube Shorts";
export type SmmStatus = "idea" | "planned" | "in_progress" | "published";

export interface SmmContentIdea {
  id: string;
  topic: string;
  format: SmmFormat;
  goal: string;
  offer: string;
  cta: string;
  rubric: string;
  hook: string;
}

export interface SmmContentPlanItem {
  id: string;
  topic: string;
  format: SmmFormat;
  rubric: string;
  goal: string;
  cta: string;
  status: SmmStatus;
  publishDate: string; // ISO
}
