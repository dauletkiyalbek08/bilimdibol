"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "left" | "right";
  className?: string;
  contentClassName?: string;
}

/** Click-to-open dropdown with outside-click close. */
export function Dropdown({ trigger, children, align = "right", className, contentClassName }: DropdownProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <div onClick={() => setOpen((o) => !o)}>{trigger}</div>
      {open && (
        <div
          className={cn(
            "absolute z-40 mt-2 min-w-[14rem] rounded-xl border border-border bg-white p-1.5 shadow-pop animate-scale-in",
            align === "right" ? "right-0" : "left-0",
            contentClassName,
          )}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function DropdownItem({
  className,
  active,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-ink transition-colors hover:bg-canvas",
        active && "bg-brand-50 text-brand-700",
        className,
      )}
      {...props}
    />
  );
}

export function DropdownLabel({ children }: { children: React.ReactNode }) {
  return <div className="px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-muted">{children}</div>;
}

export function DropdownSeparator() {
  return <div className="my-1 h-px bg-border" />;
}
