// Удаляет все демо-отметки посещаемости (таблица attendance),
// чтобы назначение лидов считалось только по реальным «Пришёл/Ушёл».
//   node scripts/clear-attendance.mjs
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

try {
  const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  for (const line of env.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Нужны NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY в .env.local");
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false } });
const { error, count } = await sb.from("attendance").delete({ count: "exact" }).neq("id", "00000000-0000-0000-0000-000000000000");
if (error) {
  console.error("Ошибка:", error.message);
  process.exit(1);
}
console.log(`Удалено отметок посещаемости: ${count ?? "?"}. Теперь присутствие считается только по реальным «Пришёл».`);
