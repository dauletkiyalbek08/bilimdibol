import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Маппинг логин → email (для входа). До авторизации RLS не пускает к users,
// поэтому резолвим через service_role на сервере. Отдаём только email.
export async function POST(req: Request) {
  let body: { login?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ email: null }, { status: 400 });
  }
  const login = (body.login || "").trim().toLowerCase();
  if (!login) return NextResponse.json({ email: null });

  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ email: null });

  try {
    const { data } = await admin.from("users").select("email").eq("login", login).single();
    return NextResponse.json({ email: data?.email ?? null });
  } catch {
    return NextResponse.json({ email: null });
  }
}
