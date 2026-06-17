// Clients data access — Supabase when configured, else mock.
import { getSupabase } from "../supabase/client";
import { CLIENTS } from "../mock-data";
import type { Client } from "../types";

interface ClientRow {
  id: string;
  project_id: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  course: string | null;
  manager_id: string | null;
  total_paid: number | null;
  status: string | null;
  progress: number | null;
  joined_at: string;
}

function mapRow(r: ClientRow): Client {
  return {
    id: r.id,
    projectId: r.project_id ?? "english-course",
    name: r.name,
    phone: r.phone ?? "",
    email: r.email ?? undefined,
    course: r.course ?? "",
    managerId: r.manager_id ?? "",
    totalPaid: r.total_paid ?? 0,
    status: (r.status as Client["status"]) ?? "Активный",
    joinedAt: r.joined_at,
    progress: r.progress ?? 0,
  };
}

export async function fetchClients(): Promise<Client[]> {
  const sb = getSupabase();
  if (!sb) return CLIENTS;
  try {
    const { data, error } = await sb.from("clients").select("*").order("joined_at", { ascending: false });
    if (error || !data) return CLIENTS;
    return (data as ClientRow[]).map(mapRow);
  } catch {
    return CLIENTS;
  }
}

export interface NewClientInput {
  name: string;
  phone: string;
  course: string;
  managerId: string;
  totalPaid?: number;
  email?: string;
}

/** Create a client — persists to Supabase when configured, else local object. */
export async function createClient(input: NewClientInput): Promise<Client> {
  const sb = getSupabase();
  const nowIso = new Date().toISOString();

  if (sb) {
    try {
      const { data, error } = await sb
        .from("clients")
        .insert({
          name: input.name,
          phone: input.phone,
          course: input.course,
          manager_id: input.managerId || null,
          total_paid: input.totalPaid ?? 0,
          status: "Активный",
          progress: 0,
          email: input.email ?? null,
        })
        .select("*")
        .single();
      if (!error && data) return mapRow(data as ClientRow);
    } catch {
      /* fall through */
    }
  }

  return {
    id: `client-local-${Date.now()}`,
    projectId: "english-course",
    name: input.name,
    phone: input.phone,
    email: input.email,
    course: input.course,
    managerId: input.managerId,
    totalPaid: input.totalPaid ?? 0,
    status: "Активный",
    joinedAt: nowIso,
    progress: 0,
  };
}
