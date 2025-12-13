import { clsx } from "clsx";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "muted";

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  const styles: Record<BadgeVariant, string> = {
    default:
      "bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] text-[var(--accent)]",
    success:
      "bg-[color-mix(in_srgb,var(--success)_18%,transparent)] text-[var(--success)]",
    warning:
      "bg-[color-mix(in_srgb,var(--warning)_18%,transparent)] text-[var(--warning)]",
    danger:
      "bg-[color-mix(in_srgb,var(--danger)_18%,transparent)] text-[var(--danger)]",
    muted:
      "bg-[color-mix(in_srgb,var(--muted-foreground)_14%,transparent)] text-[var(--muted-foreground)]",
  };

  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        styles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
