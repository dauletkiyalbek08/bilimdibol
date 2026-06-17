import { NextResponse } from "next/server";
import { notifyTelegram } from "@/lib/notify/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Quick check that Telegram is wired up: GET /api/notify/test
export async function GET() {
  const configured = Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
  if (!configured) {
    return NextResponse.json({ ok: false, configured: false, note: "TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID не заданы" });
  }
  const sent = await notifyTelegram("✅ <b>bilimdibol</b>: тестовое уведомление. Связь с CRM работает.");
  return NextResponse.json({ ok: sent, configured: true, note: sent ? "Сообщение отправлено" : "Не удалось отправить — проверьте токен и chat_id" });
}
