"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthed, hydrated } = useApp();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  React.useEffect(() => {
    if (hydrated && !isAuthed) router.replace("/");
  }, [hydrated, isAuthed, router]);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="size-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    );
  }

  if (!isAuthed) return null;

  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenu={() => setSidebarOpen(true)} />
        <main className="flex-1 px-4 py-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1400px] animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
}
