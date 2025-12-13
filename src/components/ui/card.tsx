import { clsx } from "clsx";

type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-[var(--border)] bg-[var(--panel)]/95 shadow-[0_20px_60px_rgba(0,0,0,0.32)] backdrop-blur",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 p-6">
      <div className="space-y-1">
        <h3 className="font-display text-xl font-semibold text-white">{title}</h3>
        {description ? (
          <p className="text-sm text-[var(--muted-foreground)]">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function CardContent({
  children,
  className,
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx("p-6 pt-0", className)}>{children}</div>;
}
