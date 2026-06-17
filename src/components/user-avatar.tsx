import { cn, initials } from "@/lib/utils";

interface UserAvatarProps {
  name: string;
  color?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: "size-7 text-xs",
  md: "size-9 text-sm",
  lg: "size-11 text-base",
};

export function UserAvatar({ name, color = "#16A34A", size = "md", className }: UserAvatarProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white",
        sizes[size],
        className,
      )}
      style={{ backgroundColor: color }}
      title={name}
    >
      {initials(name)}
    </span>
  );
}
