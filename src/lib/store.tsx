"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { DateRange, DateRangePreset, RoleId, User } from "./types";
import { buildRange, DEFAULT_RANGE } from "./date-range";
import { EMPLOYEES } from "./mock-data";
import { authenticate, userById, userByLogin } from "./auth";
import { getSupabase } from "./supabase/client";

const SESSION_KEY = "bilimdibol.session"; // stores userId
const RANGE_KEY = "bilimdibol.range";

interface AppState {
  userId: string | null;
  currentUser: User | null;
  role: RoleId;
  currentUserName: string;
  isAuthed: boolean;
  /** Login by credentials. Verifies via Supabase Auth when configured, else mock. */
  login: (login: string, password: string) => Promise<boolean>;
  logout: () => void;
  /** Demo helper kept for compatibility (switches to first user of role). */
  setRole: (r: RoleId) => void;
  range: DateRange;
  setPreset: (p: DateRangePreset) => void;
  setCustomRange: (from: string, to: string) => void;
  hydrated: boolean;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [range, setRange] = useState<DateRange>(DEFAULT_RANGE);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage once on mount
  useEffect(() => {
    try {
      const savedSession = localStorage.getItem(SESSION_KEY);
      const savedRange = localStorage.getItem(RANGE_KEY);
      if (savedSession && userById(savedSession)) setUserId(savedSession);
      if (savedRange) {
        const preset = savedRange as DateRangePreset;
        if (preset !== "custom") setRange(buildRange(preset));
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  const currentUser = useMemo(() => (userId ? userById(userId) ?? null : null), [userId]);
  const role: RoleId = currentUser?.role ?? "admin";
  const currentUserName = currentUser?.name ?? "Гость";
  const isAuthed = !!currentUser;

  const login = useCallback(
    async (loginName: string, password: string): Promise<boolean> => {
      const sb = getSupabase();

      if (sb) {
        // Real auth path: map login → email, verify password via Supabase Auth.
        const user = userByLogin(loginName);
        if (!user?.email) return false;
        const { error } = await sb.auth.signInWithPassword({ email: user.email, password });
        if (error) return false;
        setUserId(user.id);
        try {
          localStorage.setItem(SESSION_KEY, user.id);
        } catch {
          /* ignore */
        }
        router.push("/dashboard");
        return true;
      }

      // Mock path (no Supabase configured).
      const user = authenticate(loginName, password);
      if (!user) return false;
      setUserId(user.id);
      try {
        localStorage.setItem(SESSION_KEY, user.id);
      } catch {
        /* ignore */
      }
      router.push("/dashboard");
      return true;
    },
    [router],
  );

  const setRole = useCallback((r: RoleId) => {
    const user = EMPLOYEES.find((e) => e.role === r);
    if (!user) return;
    setUserId(user.id);
    try {
      localStorage.setItem(SESSION_KEY, user.id);
    } catch {
      /* ignore */
    }
  }, []);

  const logout = useCallback(() => {
    setUserId(null);
    try {
      localStorage.removeItem(SESSION_KEY);
      getSupabase()?.auth.signOut();
    } catch {
      /* ignore */
    }
    router.push("/");
  }, [router]);

  const setPreset = useCallback((p: DateRangePreset) => {
    const next = buildRange(p);
    setRange(next);
    try {
      localStorage.setItem(RANGE_KEY, p);
    } catch {
      /* ignore */
    }
  }, []);

  const setCustomRange = useCallback((from: string, to: string) => {
    setRange({ preset: "custom", from, to, label: "Свой период" });
  }, []);

  return (
    <AppContext.Provider
      value={{
        userId,
        currentUser,
        role,
        currentUserName,
        isAuthed,
        login,
        logout,
        setRole,
        range,
        setPreset,
        setCustomRange,
        hydrated,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
