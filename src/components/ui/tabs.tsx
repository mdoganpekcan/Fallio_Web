// Simple tabs component to mirror shadcn/ui behavior
"use client";

import { clsx } from "clsx";
import { useState } from "react";

export type TabItem = {
  value: string;
  label: string;
};

export function Tabs({
  items,
  defaultValue,
  onChange,
  className,
}: {
  items: TabItem[];
  defaultValue?: string;
  onChange?: (value: string) => void;
  className?: string;
}) {
  const [active, setActive] = useState(defaultValue ?? items[0]?.value);

  const handleChange = (value: string) => {
    setActive(value);
    onChange?.(value);
  };

  return (
    <div className={clsx("flex items-center gap-2 rounded-2xl bg-[var(--surface)] p-1", className)}>
      {items.map((item) => (
        <button
          key={item.value}
          onClick={() => handleChange(item.value)}
          className={clsx(
            "flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition-all",
            active === item.value
              ? "bg-[var(--panel)] text-white shadow-[0_12px_30px_rgba(0,0,0,0.25)]"
              : "text-[var(--muted-foreground)] hover:text-white hover:bg-[color-mix(in_srgb,var(--accent)_8%,transparent)]"
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
