import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "bg-brand-50 text-brand-700",
        gray: "bg-gray-100 text-gray-600",
        green: "bg-green-50 text-green-700",
        yellow: "bg-amber-50 text-amber-700",
        orange: "bg-orange-50 text-orange-700",
        red: "bg-red-50 text-red-700",
        blue: "bg-sky-50 text-sky-700",
        purple: "bg-violet-50 text-violet-700",
        outline: "border border-border text-ink",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
