"use client";

import { Button } from "@/components/ui/button";
import { clsx } from "clsx";

export function PageHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "mb-6 flex flex-wrap items-center justify-between gap-4",
        className
      )}
    >
      <div>
        <h1 className="font-display text-3xl font-semibold text-white">
          {title}
        </h1>
        {description ? (
          <p className="text-sm text-[var(--muted-foreground)]">{description}</p>
        ) : null}
      </div>
      {action ?? <Button className="hidden" />} {/* spacer when no action */}
    </div>
  );
}
