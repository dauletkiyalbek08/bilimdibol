// Contracts data access — Supabase when configured, else mock.
import { getSupabase } from "../supabase/client";
import { CONTRACTS } from "../mock-data";
import type { Contract, ContractType, ContractStatus } from "../types";

interface ContractRow {
  id: string;
  type: string;
  party: string | null;
  status: string | null;
  created_at: string;
  signed_at: string | null;
}

function mapRow(r: ContractRow): Contract {
  return {
    id: r.id,
    type: r.type as ContractType,
    party: r.party ?? "",
    status: (r.status as ContractStatus) ?? "draft",
    createdAt: r.created_at,
    signedAt: r.signed_at ?? undefined,
  };
}

export async function fetchContracts(): Promise<Contract[]> {
  const sb = getSupabase();
  if (!sb) return CONTRACTS;
  try {
    const { data, error } = await sb.from("contracts").select("*").order("created_at", { ascending: false });
    if (error || !data || data.length === 0) return CONTRACTS;
    return (data as ContractRow[]).map(mapRow);
  } catch {
    return CONTRACTS;
  }
}
