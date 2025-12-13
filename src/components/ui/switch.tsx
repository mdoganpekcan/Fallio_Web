"use client";

import { clsx } from "clsx";
import { useState } from "react";

type Props = {
  checked?: boolean;
  onCheckedChange?: (value: boolean) => void;
  label?: string;
  name?: string;
};

export function Switch({ checked, onCheckedChange, label, name }: Props) {
  const isControlled = checked !== undefined;
  const [internal, setInternal] = useState<boolean>(checked ?? false);
  const value = isControlled ? !!checked : internal;

  const toggle = () => {
    const next = !value;
    if (!isControlled) {
      setInternal(next);
    }
    onCheckedChange?.(next);
  };

  return (
    <button
      type="button"
      aria-pressed={value}
      onClick={toggle}
      className="group inline-flex items-center gap-3"
    >
      <span
        className={clsx(
          "relative h-7 w-12 rounded-full transition-colors duration-150",
          value ? "bg-[var(--accent)]" : "bg-[color-mix(in_srgb,var(--border)_80%,transparent)]"
        )}
      >
        <span
          className={clsx(
            "absolute left-1 top-1 h-5 w-5 rounded-full bg-white transition-all duration-150 shadow-md",
            value ? "translate-x-5" : "translate-x-0"
          )}
        />
      </span>
      {label ? (
        <span className="text-sm text-[var(--muted-foreground)]">{label}</span>
      ) : null}
      {name ? <input type="hidden" name={name} value={value ? "1" : "0"} /> : null}
    </button>
  );
}
