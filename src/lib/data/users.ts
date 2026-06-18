// Пользователи (команда) — из Supabase, иначе mock EMPLOYEES.
import { getSupabase } from "../supabase/client";
import { EMPLOYEES } from "../mock-data";
import type { User, RoleId } from "../types";

interface UserRow {
  id: string;
  name: string;
  login: string | null;
  role: string;
  email: string | null;
  phone: string | null;
  avatar_color: string | null;
  active?: boolean | null;
}

const PALETTE = ["#16A34A", "#FB923C", "#0EA5E9", "#8B5CF6", "#EC4899", "#F59E0B", "#14B8A6", "#EF4444", "#6366F1", "#84CC16", "#D946EF", "#0891B2"];

export function mapUser(r: UserRow): User {
  return {
    id: r.id,
    name: r.name,
    role: r.role as RoleId,
    email: r.email ?? "",
    phone: r.phone ?? undefined,
    avatarColor: r.avatar_color ?? PALETTE[0],
    projectId: "english-course",
    active: r.active ?? true,
  };
}

export async function fetchUsers(): Promise<User[]> {
  const sb = getSupabase();
  if (!sb) return EMPLOYEES;
  try {
    const { data, error } = await sb.from("users").select("*").order("created_at", { ascending: true });
    if (error || !data || data.length === 0) return EMPLOYEES;
    return (data as UserRow[]).map(mapUser);
  } catch {
    return EMPLOYEES;
  }
}

export async function fetchUserById(id: string): Promise<User | null> {
  const sb = getSupabase();
  if (!sb) return EMPLOYEES.find((e) => e.id === id) ?? null;
  try {
    const { data, error } = await sb.from("users").select("*").eq("id", id).single();
    if (error || !data) return null;
    return mapUser(data as UserRow);
  } catch {
    return null;
  }
}

export async function fetchUserByEmail(email: string): Promise<User | null> {
  const sb = getSupabase();
  if (!sb) return EMPLOYEES.find((e) => e.email === email) ?? null;
  try {
    const { data, error } = await sb.from("users").select("*").eq("email", email).single();
    if (error || !data) return null;
    return mapUser(data as UserRow);
  } catch {
    return null;
  }
}

/** Сменить роль сотрудника (RLS: только админ). */
export async function updateUserRole(id: string, role: RoleId): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  try {
    const { error } = await sb.from("users").update({ role }).eq("id", id);
    return !error;
  } catch {
    return false;
  }
}

/** Включить / выключить сотрудника (RLS: только админ). */
export async function updateUserActive(id: string, active: boolean): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  try {
    const { error } = await sb.from("users").update({ active }).eq("id", id);
    return !error;
  } catch {
    return false;
  }
}

export const NEW_USER_COLOR = () => PALETTE[Math.floor(Math.random() * PALETTE.length)];
