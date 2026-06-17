import { Badge, type BadgeProps } from "@/components/ui/badge";
import type {
  LeadStatus,
  TrialStatus,
  ReceiptStatus,
  PayrollStatus,
  AttendanceStatus,
  ContractStatus,
} from "@/lib/types";

type Variant = NonNullable<BadgeProps["variant"]>;

const LEAD_MAP: Record<LeadStatus, { label: string; variant: Variant }> = {
  new: { label: "Новый", variant: "blue" },
  in_progress: { label: "В работе", variant: "yellow" },
  no_answer: { label: "Не отвечает", variant: "gray" },
  bought_trial: { label: "Купил пробный", variant: "green" },
  passed_to_manager: { label: "Передан менеджеру", variant: "purple" },
  rejected: { label: "Отказ", variant: "red" },
  duplicate: { label: "Дубль", variant: "gray" },
  low_quality: { label: "Некачественный", variant: "orange" },
};

const TRIAL_MAP: Record<TrialStatus, { label: string; variant: Variant }> = {
  scheduled: { label: "Назначен", variant: "blue" },
  completed: { label: "Проведён", variant: "green" },
  no_show: { label: "Не пришёл", variant: "red" },
  rescheduled: { label: "Перенос", variant: "yellow" },
  bought: { label: "Купил курс", variant: "green" },
  rejected: { label: "Отказ", variant: "gray" },
};

const RECEIPT_MAP: Record<ReceiptStatus, { label: string; variant: Variant }> = {
  pending: { label: "На проверке", variant: "yellow" },
  confirmed: { label: "Подтверждён", variant: "green" },
  rejected: { label: "Отклонён", variant: "red" },
};

const PAYROLL_MAP: Record<PayrollStatus, { label: string; variant: Variant }> = {
  accrued: { label: "Начислено", variant: "blue" },
  review: { label: "На проверке", variant: "yellow" },
  paid: { label: "Выплачено", variant: "green" },
};

const ATTENDANCE_MAP: Record<AttendanceStatus, { label: string; variant: Variant }> = {
  on_time: { label: "Вовремя", variant: "green" },
  late: { label: "Опоздал", variant: "orange" },
  absent: { label: "Отсутствовал", variant: "red" },
  remote: { label: "Удалённо", variant: "blue" },
  day_off: { label: "Выходной", variant: "gray" },
};

const CONTRACT_MAP: Record<ContractStatus, { label: string; variant: Variant }> = {
  draft: { label: "Черновик", variant: "gray" },
  sent: { label: "Отправлен", variant: "yellow" },
  signed: { label: "Подписан", variant: "green" },
  rejected: { label: "Отклонён", variant: "red" },
};

const GENERIC_MAP: Record<string, Variant> = {
  Подписан: "green",
  Отправлен: "yellow",
  Черновик: "gray",
  Активный: "green",
  Завершил: "blue",
  Пауза: "yellow",
  Возврат: "red",
};

type Kind = "lead" | "trial" | "receipt" | "payroll" | "attendance" | "contract" | "generic";

export function StatusBadge({ kind, value }: { kind: Kind; value: string }) {
  let cfg: { label: string; variant: Variant } | undefined;
  switch (kind) {
    case "lead":
      cfg = LEAD_MAP[value as LeadStatus];
      break;
    case "trial":
      cfg = TRIAL_MAP[value as TrialStatus];
      break;
    case "receipt":
      cfg = RECEIPT_MAP[value as ReceiptStatus];
      break;
    case "payroll":
      cfg = PAYROLL_MAP[value as PayrollStatus];
      break;
    case "attendance":
      cfg = ATTENDANCE_MAP[value as AttendanceStatus];
      break;
    case "contract":
      cfg = CONTRACT_MAP[value as ContractStatus];
      break;
    default:
      cfg = { label: value, variant: GENERIC_MAP[value] ?? "gray" };
  }
  if (!cfg) cfg = { label: value, variant: "gray" };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

export { LEAD_MAP, TRIAL_MAP, RECEIPT_MAP, PAYROLL_MAP, ATTENDANCE_MAP, CONTRACT_MAP };
