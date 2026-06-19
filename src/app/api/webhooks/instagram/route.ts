import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { ingestLead } from "@/lib/server/lead-intake";
import { sendIgMessage, replyToComment, sendPrivateReply } from "@/lib/server/instagram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || "bilimdibol-demo-verify-token";

// Тексты автоответчика (рус). При желании вынесем в настройки.
const GREETING =
  "Здравствуйте! 👋 Это bilimdibol — онлайн-курсы английского.\nКак вас зовут?";
const ASK_PHONE = (name: string) =>
  `Приятно познакомиться, ${name}! 🙌\nОставьте номер телефона (например +7 777 123 45 67) — менеджер свяжется и подберёт программу.`;
const BAD_PHONE = "Кажется, это не номер 🙈 Напишите телефон в формате +7 777 123 45 67.";
const DONE = "Спасибо! Заявка принята ✅ Менеджер скоро напишет или позвонит. Хорошего дня! 🌟";
const ALREADY = "Мы уже получили вашу заявку — менеджер скоро свяжется 🙌";
const COMMENT_PUBLIC = "Спасибо за интерес! 🙌 Написали вам в Директ — ответьте там, подберём программу.";

async function logEvent(type: string, payload: unknown, status: "ok" | "failed" | "pending") {
  try {
    const admin = getSupabaseAdmin();
    await admin?.from("integration_events").insert({
      channel: "instagram",
      type,
      payload: typeof payload === "string" ? payload : JSON.stringify(payload).slice(0, 1500),
      status,
    });
  } catch {
    /* ignore */
  }
}

function extractPhone(text: string): string {
  const m = (text || "").match(/\+?\d[\d\s()\-]{8,}\d/);
  return m ? m[0].trim() : "";
}

// Верификация webhook (Meta дёргает GET при подключении).
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  if (
    searchParams.get("hub.mode") === "subscribe" &&
    searchParams.get("hub.verify_token") === VERIFY_TOKEN
  ) {
    return new NextResponse(searchParams.get("hub.challenge") ?? "", { status: 200 });
  }
  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

// --- Direct: машина состояний приветствие → имя → телефон → лид ---
async function handleDm(senderId: string, text: string) {
  const admin = getSupabaseAdmin();
  if (!admin) return;
  const t = (text || "").trim();
  const { data: convo } = await admin
    .from("ig_conversations")
    .select("*")
    .eq("ig_user_id", senderId)
    .maybeSingle();

  if (!convo) {
    await admin.from("ig_conversations").insert({
      ig_user_id: senderId,
      state: "await_name",
      last_message: t,
    });
    await sendIgMessage(senderId, GREETING);
    return;
  }

  const touch = { last_message: t, updated_at: new Date().toISOString() };

  if (convo.state === "await_name") {
    const name = t.slice(0, 80) || "Instagram-гость";
    await admin
      .from("ig_conversations")
      .update({ name, state: "await_phone", ...touch })
      .eq("ig_user_id", senderId);
    await sendIgMessage(senderId, ASK_PHONE(name));
    return;
  }

  if (convo.state === "await_phone") {
    const phone = extractPhone(t);
    if (!phone) {
      await sendIgMessage(senderId, BAD_PHONE);
      return;
    }
    const result = await ingestLead({
      name: convo.name || "Instagram-гость",
      phone,
      source: "Instagram Direct",
      comment: "Заявка из переписки в Instagram Direct",
    });
    await admin
      .from("ig_conversations")
      .update({ phone, state: "done", lead_id: result.id ?? null, ...touch })
      .eq("ig_user_id", senderId);
    await sendIgMessage(senderId, DONE);
    await logEvent("dm_lead_created", { senderId, name: convo.name, phone, result }, result.ok ? "ok" : "failed");
    return;
  }

  // state === "done" или иное
  await sendIgMessage(senderId, ALREADY);
}

export async function POST(req: Request) {
  let body: {
    object?: string;
    entry?: {
      id?: string;
      messaging?: {
        sender?: { id?: string };
        recipient?: { id?: string };
        message?: { text?: string; is_echo?: boolean };
      }[];
      changes?: {
        field?: string;
        value?: { id?: string; text?: string; from?: { id?: string; username?: string } };
      }[];
    }[];
  } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ received: true });
  }

  await logEvent("post_received", body, "pending");

  for (const entry of body.entry ?? []) {
    const ourId = entry.id; // IG business account id — чтобы не отвечать самим себе

    // Direct-сообщения
    for (const m of entry.messaging ?? []) {
      const senderId = m.sender?.id;
      if (!senderId || senderId === ourId) continue; // пропускаем эхо/свои
      if (m.message?.is_echo) continue;
      const text = m.message?.text ?? "";
      if (!text) continue;
      try {
        await handleDm(senderId, text);
      } catch (e) {
        await logEvent("dm_exception", String(e), "failed");
      }
    }

    // Комментарии
    for (const ch of entry.changes ?? []) {
      if (ch.field !== "comments" || !ch.value?.id) continue;
      const fromId = ch.value.from?.id;
      if (fromId && fromId === ourId) continue; // наш собственный ответ — игнор (анти-цикл)
      const commentId = ch.value.id;
      try {
        await replyToComment(commentId, COMMENT_PUBLIC);
        await sendPrivateReply(commentId, GREETING);
        await logEvent("comment_handled", { commentId, from: ch.value.from }, "ok");
      } catch (e) {
        await logEvent("comment_exception", String(e), "failed");
      }
    }
  }

  return NextResponse.json({ received: true });
}
