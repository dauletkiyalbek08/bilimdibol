// =============================================================
// Creates the 12 demo Supabase Auth accounts (login → email).
// Run once after creating your Supabase project:
//
//   node scripts/seed-auth.mjs
//
// Reads credentials from .env.local (or process.env):
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY   (server secret — never commit)
// =============================================================
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// --- tiny .env.local loader (so you don't need extra deps) ---
try {
  const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  for (const line of env.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {
  /* no .env.local — rely on process.env */
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("✗ Нужны NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY (в .env.local).");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

const ACCOUNTS = [
  { email: "aizhan@bilimdibol.kz",   password: "admin2026",     name: "Айжан К.",    role: "admin" },
  { email: "timur@bilimdibol.kz",    password: "sales2026",     name: "Тимур Р.",    role: "rop" },
  { email: "madina@bilimdibol.kz",   password: "hunter2026",    name: "Мадина Т.",   role: "hunter" },
  { email: "aruzhan@bilimdibol.kz",  password: "hunter2026",    name: "Аружан Ж.",   role: "hunter" },
  { email: "nurlan@bilimdibol.kz",   password: "hunter2026",    name: "Нурлан К.",   role: "hunter" },
  { email: "saltanat@bilimdibol.kz", password: "teacher2026",   name: "Салтанат Ж.", role: "manager" },
  { email: "aina@bilimdibol.kz",     password: "teacher2026",   name: "Айна Б.",     role: "manager" },
  { email: "dias@bilimdibol.kz",     password: "target2026",    name: "Диас А.",     role: "target" },
  { email: "gulmira@bilimdibol.kz",  password: "finance2026",   name: "Гульмира С.", role: "accountant" },
  { email: "yerkezhan@bilimdibol.kz",password: "content2026",   name: "Еркежан М.",  role: "content" },
  { email: "zhanar@bilimdibol.kz",   password: "marketing2026", name: "Жанар О.",    role: "marketer" },
  { email: "kamilya@bilimdibol.kz",  password: "smm2026",       name: "Камиля Д.",   role: "smm" },
];

let created = 0;
let skipped = 0;

for (const acc of ACCOUNTS) {
  const { error } = await supabase.auth.admin.createUser({
    email: acc.email,
    password: acc.password,
    email_confirm: true,
    user_metadata: { name: acc.name, role: acc.role },
  });
  if (error) {
    if (/already|exists|registered/i.test(error.message)) {
      skipped++;
      console.log(`• ${acc.email} — уже существует`);
    } else {
      console.error(`✗ ${acc.email}: ${error.message}`);
    }
  } else {
    created++;
    console.log(`✓ ${acc.email} (${acc.role})`);
  }
}

console.log(`\nГотово: создано ${created}, пропущено ${skipped}.`);
