import { Card } from "@/components/ui/card";
import { clsx } from "clsx";

export function StatCard({
  title,
  value,
  change,
  positive = true,
  action,
}: {
  title: string;
  value: string;
  change?: string;
  positive?: boolean;
  action?: React.ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-[var(--muted-foreground)]">
            {title}
          </p>
          <p className="font-display text-3xl font-semibold text-white">
            {value}
          </p>
          {change ? (
            <p
              className={clsx(
                "text-sm font-semibold",
                positive ? "text-[var(--success)]" : "text-[var(--danger)]"
              )}
            >
              {change}
            </p>
          ) : null}
        </div>
        {action}
      </div>
    </Card>
  );
}
