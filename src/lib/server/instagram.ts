// Отправка сообщений/ответов в Instagram через Messenger Platform (Graph API).
// Используют Page Access Token (страница, связанная с IG Professional аккаунтом).
const GRAPH = "https://graph.facebook.com/v21.0";

type SendResult = { ok: boolean; status?: number; raw?: string; error?: string };

function token(): string | null {
  return process.env.META_PAGE_ACCESS_TOKEN || null;
}

/** Личное сообщение пользователю в Instagram Direct по его IGSID. */
export async function sendIgMessage(recipientId: string, text: string): Promise<SendResult> {
  const t = token();
  if (!t) return { ok: false, error: "no token" };
  try {
    const res = await fetch(`${GRAPH}/me/messages?access_token=${t}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipient: { id: recipientId }, message: { text } }),
    });
    return { ok: res.ok, status: res.status, raw: await res.text() };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

/** Публичный ответ на комментарий под постом/рилсом. */
export async function replyToComment(commentId: string, text: string): Promise<SendResult> {
  const t = token();
  if (!t) return { ok: false, error: "no token" };
  try {
    const res = await fetch(`${GRAPH}/${commentId}/replies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, access_token: t }),
    });
    return { ok: res.ok, status: res.status, raw: await res.text() };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

/** Приватный ответ в Direct на комментарий (в течение 7 дней после комментария). */
export async function sendPrivateReply(commentId: string, text: string): Promise<SendResult> {
  const t = token();
  if (!t) return { ok: false, error: "no token" };
  try {
    const res = await fetch(`${GRAPH}/me/messages?access_token=${t}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipient: { comment_id: commentId }, message: { text } }),
    });
    return { ok: res.ok, status: res.status, raw: await res.text() };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
