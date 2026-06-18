"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { DateRange, DateRangePreset, RoleId, User } from "./types";
import { buildRange, DEFAULT_RANGE } from "./date-range";
import { EMPLOYEES } from "./mock-data";
import { authenticate, userById, userByLogin } from "./auth";
import { getSupabase } from "./supabase/client";
import { fetchUserById, fetchUserByEmail } from "./data/users";

const SESSION_KEY = "bilimdibol.session"; // stores userId
const RANGE_KEY = "bilimdibol.range";

interface AppState {
  userId: string | null;
  currentUser: User | null;
  role: RoleId;
  currentUserName: string;
  isAuthed: boolean;
  login: (login: string, password: string) => Promise<boolean>;
  logout: () => void;
  setRole: (r: RoleId) => void;
  range: DateRange;
  setPreset: (p: DateRangePreset) => void;
  setCustomRange: (from: string, to: string) => void;
  hydrated: boolean;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [range, setRange] = useState<DateRange>(DEFAULT_RANGE);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage once on mount
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const savedSession = localStorage.getItem(SESSION_KEY);
        const savedRange = localStorage.getItem(RANGE_KEY);
        if (savedRange) {
          const preset = savedRange as DateRangePreset;
          if (preset !== "custom") setRange(buildRange(preset));
        }
        if (savedSession) {
          // demo-аккаунты — из mock мгновенно; новые сотрудники — из БД
          let user = userById(savedSession);
          if (!user && getSupabase()) user = (await fetchUserById(savedSession)) ?? undefined;
          if (active && user) setCurrentUser(user);
        }
      } catch {
        /* ignore */
      }
      if (active) setHydrated(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  const role: RoleId = currentUser?.role ?? "admin";
  const currentUserName = currentUser?.name ?? "Гость";
  const isAuthed = !!currentUser;

  const finishLogin = useCallback(
    (user: User) => {
      setCurrentUser(user);
      try {
        localStorage.setItem(SESSION_KEY, user.id);
      } catch {
        /* ignore */
      }
      router.push("/dashboard");
    },
    [router],
  );

  const login = useCallback(
    async (loginName: string, password: string): Promise<boolean> => {
      const sb = getSupabase();

      if (sb) {
        // 1. login → email (demo из mock, иначе резолв из БД через сервер)
        let email = userByLogin(loginName)?.email ?? null;
        if (!email) {
          try {
            const res = await fetch("/api/auth/resolve", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ login: loginName }),
            });
            const j = await res.json();
            email = j.email ?? null;
          } catch {
            email = null;
          }
        }
        if (!email) return false;

        // 2. проверка пароля через Supabase Auth
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) return false;

        // 3. идентичность: demo из mock, иначе из БД
        let user: User | null = userByLogin(loginName);
        if (!user) user = await fetchUserByEmail(email);
        if (!user) return false;

        finishLogin(user);
        return true;
      }

      // mock-режим (без Supabase)
      const user = authenticate(loginName, password);
      if (!user) return false;
      finishLogin(user);
      return true;
    },
    [finishLogin],
  );

  const setRole = useCallback((r: RoleId) => {
    const user = EMPLOYEES.find((e) => e.role === r);
    if (!user) return;
    setCurrentUser(user);
    try {
      localStorage.setItem(SESSION_KEY, user.id);
    } catch {
      /* ignore */
    }
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
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
        userId: currentUser?.id ?? null,
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
