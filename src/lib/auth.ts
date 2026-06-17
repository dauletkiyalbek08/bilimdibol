// =============================================================
// Demo authentication — mock users with login / password.
// Replace with Supabase Auth later; keep the User shape.
// =============================================================
import { EMPLOYEES } from "./mock-data";
import type { User } from "./types";

export interface DemoCredential {
  login: string;
  password: string;
  userId: string;
}

export const CREDENTIALS: DemoCredential[] = [
  { login: "admin", password: "admin2026", userId: "00000000-0000-0000-0000-000000000001" },
  { login: "rop", password: "sales2026", userId: "00000000-0000-0000-0000-000000000002" },
  { login: "hunter1", password: "hunter2026", userId: "00000000-0000-0000-0000-000000000003" },
  { login: "hunter2", password: "hunter2026", userId: "00000000-0000-0000-0000-000000000004" },
  { login: "hunter3", password: "hunter2026", userId: "00000000-0000-0000-0000-000000000005" },
  { login: "manager1", password: "teacher2026", userId: "00000000-0000-0000-0000-000000000006" },
  { login: "manager2", password: "teacher2026", userId: "00000000-0000-0000-0000-000000000007" },
  { login: "target", password: "target2026", userId: "00000000-0000-0000-0000-000000000008" },
  { login: "accountant", password: "finance2026", userId: "00000000-0000-0000-0000-000000000009" },
  { login: "content", password: "content2026", userId: "00000000-0000-0000-0000-000000000010" },
  { login: "marketer", password: "marketing2026", userId: "00000000-0000-0000-0000-000000000011" },
  { login: "smm", password: "smm2026", userId: "00000000-0000-0000-0000-000000000012" },
];

/** Find a user by credentials. Returns null on failure. */
export function authenticate(login: string, password: string): User | null {
  const cred = CREDENTIALS.find(
    (c) => c.login.toLowerCase() === login.trim().toLowerCase() && c.password === password,
  );
  if (!cred) return null;
  return EMPLOYEES.find((e) => e.id === cred.userId) ?? null;
}

/** Resolve the user matching a login name only (used for Supabase Auth email mapping). */
export function userByLogin(login: string): User | null {
  const cred = CREDENTIALS.find((c) => c.login.toLowerCase() === login.trim().toLowerCase());
  if (!cred) return null;
  return EMPLOYEES.find((e) => e.id === cred.userId) ?? null;
}

export function userById(id: string): User | undefined {
  return EMPLOYEES.find((e) => e.id === id);
}

/** Public list (login only) for the demo credentials helper on the login page. */
export const DEMO_LOGINS = CREDENTIALS.map((c) => {
  const user = EMPLOYEES.find((e) => e.id === c.userId)!;
  return { login: c.login, password: c.password, name: user.name, role: user.role };
});
