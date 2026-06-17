"use client";

import { Check, Minus, ShieldCheck } from "lucide-react";
import { useApp } from "@/lib/store";
import { ROLES, PERMISSION_MATRIX, ROLE_PAGES, NAV_ITEMS } from "@/lib/roles";
import { PageHeader } from "@/components/page-header";
import { RoleBasedGuard } from "@/components/role-based-guard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { RoleId } from "@/lib/types";

export default function PermissionsPage() {
  return (
    <RoleBasedGuard page="permissions">
      <PermissionsInner />
    </RoleBasedGuard>
  );
}

function Cell({ allowed }: { allowed: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex size-6 items-center justify-center rounded-full",
        allowed ? "bg-brand-50 text-brand-700" : "bg-gray-100 text-gray-400",
      )}
    >
      {allowed ? <Check className="size-3.5" /> : <Minus className="size-3.5" />}
    </span>
  );
}

function PermissionsInner() {
  const { role: activeRole } = useApp();

  return (
    <div className="space-y-6">
      <PageHeader title="Права доступа" description="Матрица доступа ролей к разделам и действиям" />

      {/* Roles overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ROLES.map((r) => (
          <Card key={r.id} className={cn("p-4", r.id === activeRole && "ring-1 ring-brand/40")}>
            <div className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <ShieldCheck className="size-4.5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">{r.name}</p>
                <p className="text-xs text-muted">{ROLE_PAGES[r.id].length} разделов</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted">{r.description}</p>
          </Card>
        ))}
      </div>

      {/* Action permission matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Матрица прав</CardTitle>
          <CardDescription>Кто что может делать в системе</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="sticky left-0 bg-white">Действие</TableHead>
                {ROLES.map((r) => (
                  <TableHead key={r.id} className="text-center">{r.short}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {PERMISSION_MATRIX.map((row) => (
                <TableRow key={row.label}>
                  <TableCell className="sticky left-0 bg-white font-medium">{row.label}</TableCell>
                  {ROLES.map((r) => (
                    <TableCell key={r.id} className="text-center">
                      <Cell allowed={row.perms[r.id]} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Page visibility matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Доступ к страницам</CardTitle>
          <CardDescription>Какие разделы видит каждая роль в меню</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="sticky left-0 bg-white">Раздел</TableHead>
                {ROLES.map((r) => (
                  <TableHead key={r.id} className="text-center">{r.short}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {NAV_ITEMS.map((item) => (
                <TableRow key={item.key}>
                  <TableCell className="sticky left-0 bg-white font-medium">{item.label}</TableCell>
                  {ROLES.map((r) => (
                    <TableCell key={r.id} className="text-center">
                      <Cell allowed={ROLE_PAGES[r.id as RoleId].includes(item.key)} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center gap-4 text-sm text-muted">
        <span className="inline-flex items-center gap-1.5"><Cell allowed /> Есть доступ</span>
        <span className="inline-flex items-center gap-1.5"><Cell allowed={false} /> Нет доступа</span>
        <Badge variant="gray">Демо · права настраиваются администратором</Badge>
      </div>
    </div>
  );
}
