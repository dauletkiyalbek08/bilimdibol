import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROLES = ["admin", "rop", "target", "hunter", "manager", "accountant", "content", "marketer", "smm"];
const PALETTE = ["#16A34A", "#FB923C", "#0EA5E9", "#8B5CF6", "#EC4899", "#F59E0B", "#14B8A6", "#EF4444", "#6366F1", "#84CC16", "#D946EF", "#0891B2"];

// Создание сотрудника: Supabase Auth аккаунт (логин/пароль) + строка в users.
// Только service_role (серверная сторона). Вызывается из админского UI.
export async function POST(req: Request) {
  let body: { name?: string; login?: string; email?: string; password?: string; role?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });
  }

  const name = (body.name || "").trim();
  const login = (body.login || "").trim().toLowerCase();
  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";
  const role = (body.role || "").trim();

  if (!name || !login || !email || !password || !role) {
    return NextResponse.json({ ok: false, error: "Заполните все поля" }, { status: 400 });
  }
  if (!ROLES.includes(role)) {
    return NextResponse.json({ ok: false, error: "Неизвестная роль" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ ok: false, error: "Пароль минимум 6 символов" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Supabase не настроен" }, { status: 503 });
  }

  // 1. Auth-аккаунт
  const { data: authData, error: authErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, role },
  });
  if (authErr) {
    return NextResponse.json({ ok: false, error: `Auth: ${authErr.message}` }, { status: 400 });
  }

  // 2. Строка в users
  const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
  const { data: row, error: rowErr } = await admin
    .from("users")
    .insert({ name, login, role, email, avatar_color: color })
    .select("id")
    .single();

  if (rowErr) {
    // откат auth-аккаунта, чтобы не висел без профиля
    if (authData?.user?.id) await admin.auth.admin.deleteUser(authData.user.id).catch(() => {});
    const dup = /duplicate|unique/i.test(rowErr.message);
    return NextResponse.json(
      { ok: false, error: dup ? "Логин уже занят" : `БД: ${rowErr.message}` },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true, id: row?.id });
}
