import { ShieldCheck } from "lucide-react";
import { formatKzt } from "@/lib/utils";
import { LogoMark } from "@/components/logo";
import type { Sale } from "@/lib/types";
import { employeeName } from "@/lib/mock-data";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

/** Mock payment receipt preview (e.g. Kaspi-style check). */
export function ReceiptPreview({ sale }: { sale: Sale }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-canvas/60 p-4">
      <div className="rounded-lg bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-dashed border-border pb-3">
          <div className="flex items-center gap-2">
            <LogoMark size={28} />
            <div>
              <p className="text-sm font-semibold text-ink">Чек об оплате</p>
              <p className="text-xs text-muted">{sale.method}</p>
            </div>
          </div>
          <ShieldCheck className="size-5 text-brand" />
        </div>
        <dl className="mt-3 space-y-2 text-sm">
          <Row label="Клиент" value={sale.clientName} />
          <Row label="Курс" value={sale.course} />
          <Row label="Менеджер" value={employeeName(sale.managerId)} />
          <Row label="Дата" value={format(new Date(sale.date), "d MMMM yyyy, HH:mm", { locale: ru })} />
          <div className="border-t border-dashed border-border pt-2">
            <Row label="Сумма" value={formatKzt(sale.amount)} bold />
          </div>
        </dl>
        <p className="mt-3 text-center text-[11px] text-muted">
          Транзакция №{sale.id.toUpperCase()} · bilimdibol · демо-документ
        </p>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted">{label}</dt>
      <dd className={bold ? "text-base font-bold text-ink" : "font-medium text-ink"}>{value}</dd>
    </div>
  );
}
