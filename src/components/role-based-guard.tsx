"use client";

import { Lock } from "lucide-react";
import { useApp } from "@/lib/store";
import { canAccess, getRole, type PageKey } from "@/lib/roles";
import { Card } from "@/components/ui/card";

interface RoleBasedGuardProps {
  page: PageKey;
  children: React.ReactNode;
}

/** Renders children only if the active role can access the page. */
export function RoleBasedGuard({ page, children }: RoleBasedGuardProps) {
  const { role } = useApp();
  if (canAccess(role, page)) return <>{children}</>;

  const current = getRole(role);
  return (
    <Card className="mx-auto mt-10 max-w-md p-8 text-center">
      <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
        <Lock className="size-6" />
      </span>
      <h2 className="text-lg font-semibold text-ink">Нет доступа к разделу</h2>
      <p className="mt-2 text-sm text-muted">
        Роль «{current.short}» не имеет прав на просмотр этой страницы. Переключите роль в правом верхнем углу,
        чтобы посмотреть демо других сценариев.
      </p>
    </Card>
  );
}
