import { cn } from "@/lib/utils";

interface LogoProps {
  size?: number;
  withText?: boolean;
  className?: string;
  textClassName?: string;
}

/**
 * bilimdibol mark — a minimalist "b" formed by an open book / growth check.
 * Green base with a yellow accent spark for a premium SaaS feel.
 */
export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <linearGradient id="bdb-grad" x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#16A34A" />
          <stop offset="1" stopColor="#166534" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="13" fill="url(#bdb-grad)" />
      {/* open book pages */}
      <path
        d="M13 16.5c3.6-1.6 7-1.6 10.5 0v15c-3.5-1.6-6.9-1.6-10.5 0v-15Z"
        fill="#ffffff"
        fillOpacity="0.95"
      />
      <path
        d="M24.5 16.5c3.6-1.6 7-1.6 10.5 0v15c-3.5-1.6-6.9-1.6-10.5 0v-15Z"
        fill="#ffffff"
        fillOpacity="0.7"
      />
      {/* growth check / spark accent */}
      <path
        d="M28 13.5l2.1 4.3 4.7.6-3.4 3.3.8 4.7-4.2-2.2-4.2 2.2.8-4.7-3.4-3.3 4.7-.6L28 13.5Z"
        fill="#FACC15"
      />
    </svg>
  );
}

export function Logo({ size = 36, withText = true, className, textClassName }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark size={size} />
      {withText && (
        <span className={cn("text-xl font-bold tracking-tight text-ink", textClassName)}>
          bilim<span className="text-brand">dibol</span>
        </span>
      )}
    </div>
  );
}
