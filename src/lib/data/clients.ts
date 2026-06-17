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
