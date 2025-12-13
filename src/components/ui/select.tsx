"use client";

import { clsx } from "clsx";

type Option = { label: string; value: string };

export function Select({
  options,
  name,
  defaultValue,
  value,
  onChange,
  className,
  disabled,
  required,
}: {
  options: Option[];
  name?: string;
  defaultValue?: string;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
  className?: string;
  disabled?: boolean;
  required?: boolean;
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      value={value}
      onChange={onChange}
      disabled={disabled}
      required={required}
      className={clsx(
        "h-12 w-full rounded-xl border border-transparent bg-[var(--card)] px-4 text-sm font-semibold text-[var(--foreground)] shadow-[0_10px_30px_rgba(0,0,0,0.2)] outline-none",
        "focus:border-[var(--accent)] focus:bg-[color-mix(in_srgb,var(--card)_90%,transparent)]",
        disabled && "opacity-60",
        className
      )}
    >
      {options.map((option) => (
        <option
          key={option.value}
          value={option.value}
          className="bg-[var(--panel)] text-[var(--foreground)]"
        >
          {option.label}
        </option>
      ))}
    </select>
  );
}
