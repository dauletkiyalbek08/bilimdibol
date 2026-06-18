"use client";

import * as React from "react";
import { LogIn, LogOut, Clock, CheckCircle2, Users, MapPin } from "lucide-react";
import { useApp } from "@/lib/store";
import { EMPLOYEES } from "@/lib/mock-data";
import { fetchAttendance, checkIn as dbCheckIn, checkOut as dbCheckOut } from "@/lib/data/attendance";
import { OFFICE, distanceM } from "@/lib/geo";
import { fetchOfficeSettings, type OfficeSettings } from "@/lib/data/settings";
import { getRole } from "@/lib/roles";
import { ATTENDANCE_MAP } from "@/components/status-badge";
import { PageHeader } from "@/components/page-header";
import { RoleBasedGuard } from "@/components/role-based-guard";
import { MetricCard } from "@/components/metric-card";
import { DataTable, type Column } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { ExportButton } from "@/components/export-button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { UserAvatar } from "@/components/user-avatar";
import { fmtDate } from "@/lib/utils";
import type { AttendanceRecord } from "@/lib/types";

function nowTime() {
  return new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export default function AttendancePage() {
  return (
    <RoleBasedGuard page="attendance">
      <AttendanceInner />
    </RoleBasedGuard>
  );
}

function AttendanceInner() {
  const { range, currentUser, role } = useApp();
  const [records, setRecords] = React.useState<AttendanceRecord[]>([]);
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [checkedIn, setCheckedIn] = React.useState(false);
  const [myCheckIn, setMyCheckIn] = React.useState<string | null>(null);
  const [myCheckOut, setMyCheckOut] = React.useState<string | null>(null);
  const [locating, setLocating] = React.useState(false);
  const [geoMsg, setGeoMsg] = React.useState<{ ok: boolean; text: string } | null>(null);
  const [office, setOffice] = React.useState<OfficeSettings>({ lat: OFFICE.lat, lng: OFFICE.lng, radiusM: OFFICE.radiusM });

  React.useEffect(() => {
    let active = true;
    fetchAttendance().then((rows) => {
      if (active) setRecords(rows);
    });
    fetchOfficeSettings().then((o) => {
      if (active) setOffice(o);
    });
    return () => {
      active = false;
    };
  }, []);

  const me = currentUser ?? EMPLOYEES[0];

  // Приватность: всю команду видят только руководитель/бухгалтер/админ.
  // Остальные видят только свои отметки.
  const canSeeAll = role === "admin" || role === "accountant" || role === "rop";
  const visible = canSeeAll ? records : records.filter((r) => r.employeeId === me.id);

  const filtered = visible.filter((r) => statusFilter === "all" || r.status === statusFilter);

  const onTime = visible.filter((r) => r.status === "on_time").length;
  const late = visible.filter((r) => r.status === "late").length;
  const remote = visible.filter((r) => r.status === "remote").length;
  const present = onTime + late + remote;

  async function checkIn() {
    setGeoMsg(null);
    setLocating(true);
    // 1. Определяем геолокацию
    let pos: GeolocationPosition;
    try {
      pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) return reject(new Error("no geo"));
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });
    } catch {
      setLocating(false);
      setGeoMsg({ ok: false, text: "Не удалось определить геолокацию. Разрешите доступ к местоположению в браузере и попробуйте снова." });
      return;
    }
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    const dist = distanceM(lat, lng, office.lat, office.lng);
    setLocating(false);

    // 2. Проверяем геозону офиса
    if (dist > office.radiusM) {
      setGeoMsg({ ok: false, text: `Вы не в офисе (≈${dist} м от точки). Отметка прихода доступна только в офисе.` });
      return;
    }

    // 3. В офисе — отмечаем
    const t = nowTime();
    setCheckedIn(true);
    setMyCheckIn(t);
    setMyCheckOut(null);
    setGeoMsg({ ok: true, text: `Вы в офисе (≈${dist} м). Отметка прихода принята.` });
    setRecords((prev) => [
      {
        id: `att-me-${Date.now()}`,
        employeeId: me.id,
        employeeName: me.name,
        role: me.role,
        date: new Date().toISOString(),
        checkIn: t,
        status: "on_time",
        comment: "Отметка прихода · 📍 в офисе",
        lat,
        lng,
      },
      ...prev,
    ]);
    const ok = await dbCheckIn(me.id, { lat, lng }); // персист в Supabase
    if (ok) fetchAttendance().then(setRecords);
  }

  async function checkOut() {
    const t = nowTime();
    setCheckedIn(false);
    setMyCheckOut(t);
    setRecords((prev) => {
      const idx = prev.findIndex((r) => r.employeeId === me.id && r.checkIn === myCheckIn && !r.checkOut);
      if (idx === -1) return prev;
      const next = [...prev];
      next[idx] = { ...next[idx], checkOut: t, comment: "Смена завершена" };
      return next;
    });
    const ok = await dbCheckOut(me.id);
    if (ok) fetchAttendance().then(setRecords);
  }

  const columns: Column<AttendanceRecord>[] = [
    {
      key: "name",
      header: "Сотрудник",
      cell: (r) => (
        <div className="flex items-center gap-2.5">
          <UserAvatar name={r.employeeName} size="sm" />
          <div>
            <p className="font-medium">{r.employeeName}</p>
            <p className="text-xs text-muted">{getRole(r.role).short}</p>
          </div>
        </div>
      ),
    },
    { key: "date", header: "Дата", cell: (r) => <span className="text-muted">{fmtDate(r.date)}</span> },
    { key: "in", header: "Приход", cell: (r) => r.checkIn ?? "—" },
    { key: "out", header: "Уход", cell: (r) => r.checkOut ?? "—" },
    { key: "status", header: "Статус", cell: (r) => <StatusBadge kind="attendance" value={r.status} /> },
    { key: "comment", header: "Комментарий", cell: (r) => <span className="text-muted">{r.comment || "—"}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Посещаемость"
        description={canSeeAll ? `Учёт рабочего времени · вся команда · ${range.label}` : `Моя посещаемость · ${range.label}`}
      >
        {canSeeAll && <ExportButton />}
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard title="Присутствуют" value={String(present)} icon={Users} accent="green" />
        <MetricCard title="Вовремя" value={String(onTime)} icon={CheckCircle2} accent="green" />
        <MetricCard title="Опоздания" value={String(late)} icon={Clock} accent="orange" />
        <MetricCard title="Удалённо" value={String(remote)} icon={LogIn} accent="blue" />
      </div>

      {/* Check-in / out panel */}
      <Card>
        <CardHeader>
          <CardTitle>Отметка времени</CardTitle>
          <CardDescription>«Пришёл» доступен только в офисе — проверяется по геолокации</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <UserAvatar name={me.name} color={me.avatarColor} size="lg" />
              <div>
                <p className="font-semibold text-ink">{me.name}</p>
                <p className="text-sm text-muted">
                  {myCheckIn ? `Приход: ${myCheckIn}` : "Ещё не отметились"}
                  {myCheckOut && ` · Уход: ${myCheckOut}`}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={checkIn} disabled={checkedIn || locating}>
                <LogIn /> {locating ? "Определяем геолокацию…" : "Пришёл"}
              </Button>
              <Button variant="outline" onClick={checkOut} disabled={!checkedIn}>
                <LogOut /> Ушёл
              </Button>
            </div>
          </div>
          {geoMsg && (
            <p
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm ${
                geoMsg.ok ? "bg-brand-50 text-brand-700" : "bg-red-50 text-red-600"
              }`}
            >
              <MapPin className="size-4 shrink-0" /> {geoMsg.text}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>{canSeeAll ? "Журнал посещаемости (команда)" : "Мои отметки"}</CardTitle>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-44">
            <option value="all">Все статусы</option>
            {Object.entries(ATTENDANCE_MAP).map(([key, v]) => (
              <option key={key} value={key}>{v.label}</option>
            ))}
          </Select>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable columns={columns} data={filtered} rowKey={(r) => r.id} />
        </CardContent>
      </Card>
    </div>
  );
}
