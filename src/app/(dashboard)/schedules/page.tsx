"use client";

import * as React from "react";
import { CalendarClock, Check, Clock } from "lucide-react";
import { useApp } from "@/lib/store";
import { canManageRole, getRole } from "@/lib/roles";
import { fetchUsers } from "@/lib/data/users";
import { fetchSchedules, saveSchedule, WEEKDAYS, type Schedule } from "@/lib/data/schedules";
import { PageHeader } from "@/components/page-header";
import { RoleBasedGuard } from "@/components/role-based-guard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/user-avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";
import type { User } from "@/lib/types";

export default function SchedulesPage() {
  return (
    <RoleBasedGuard page="schedules">
      <SchedulesInner />
    </RoleBasedGuard>
  );
}

const DEFAULT: Omit<Schedule, "employeeId"> = { weekdays: [1, 2, 3, 4, 5], start: "09:00", end: "18:00" };

function SchedulesInner() {
  const { role } = useApp();
  const [users, setUsers] = React.useState<User[]>([]);
  const [edits, setEdits] = React.useState<Record<string, Schedule>>({});
  const [savedId, setSavedId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let active = true;
    Promise.all([fetchUsers(), fetchSchedules()]).then(([us, sch]) => {
      if (!active) return;
      setUsers(us);
      const e: Record<string, Schedule> = {};
      for (const u of us) {
        e[u.id] = sch[u.id] ?? { employeeId: u.id, ...DEFAULT };
      }
      setEdits(e);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const manageable = users.filter((u) => canManageRole(role, u.role));

  function toggleDay(id: string, day: number) {
    setEdits((prev) => {
      const cur = prev[id];
      const has = cur.weekdays.includes(day);
      const weekdays = has ? cur.weekdays.filter((d) => d !== day) : [...cur.weekdays, day].sort((a, b) => a - b);
      return { ...prev, [id]: { ...cur, weekdays } };
    });
  }

  function setField(id: string, field: "start" | "end", value: string) {
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  }

  async function save(id: string) {
    const ok = await saveSchedule(edits[id]);
    if (ok) {
      setSavedId(id);
      window.setTimeout(() => setSavedId((s) => (s === id ? null : s)), 1500);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Графики работы" description="Назначайте смены своей команде" />

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center gap-2 py-16 text-sm text-muted">
            <span className="size-4 animate-spin rounded-full border-2 border-brand border-t-transparent" />
            Загрузка…
          </CardContent>
        </Card>
      ) : manageable.length === 0 ? (
        <Card>
          <EmptyState
            icon={CalendarClock}
            title="Нет сотрудников для управления"
            description="Графики назначает руководитель своей команде (РОП — хантерам/менеджерам, маркетолог — таргет/SMM/контенту, админ — всем)."
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {manageable.map((u) => {
            const sc = edits[u.id];
            return (
              <Card key={u.id}>
                <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-3 lg:w-56">
                    <UserAvatar name={u.name} color={u.avatarColor} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{u.name}</p>
                      <p className="truncate text-xs text-muted">{getRole(u.role).short}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {WEEKDAYS.map((d) => {
                      const on = sc.weekdays.includes(d.n);
                      return (
                        <button
                          key={d.n}
                          onClick={() => toggleDay(u.id, d.n)}
                          className={cn(
                            "size-9 rounded-lg border text-sm font-medium transition-colors",
                            on ? "border-brand bg-brand text-white" : "border-border text-muted hover:bg-canvas",
                          )}
                        >
                          {d.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="size-4 text-muted" />
                    <Input type="time" value={sc.start} onChange={(e) => setField(u.id, "start", e.target.value)} className="w-28" />
                    <span className="text-muted">—</span>
                    <Input type="time" value={sc.end} onChange={(e) => setField(u.id, "end", e.target.value)} className="w-28" />
                  </div>

                  <div className="flex items-center gap-2">
                    {sc.weekdays.length === 0 && <Badge variant="gray">Выходной всю неделю</Badge>}
                    <Button size="sm" onClick={() => save(u.id)}>
                      {savedId === u.id ? <><Check className="text-white" /> Сохранено</> : "Сохранить"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
