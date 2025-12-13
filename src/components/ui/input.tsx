import { forwardRef } from "react";
import { clsx } from "clsx";

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "prefix" | "suffix"> {
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, prefix, suffix, type = "text", ...props }, ref) => {
    return (
      <label
        className={clsx(
          "group flex h-12 w-full items-center gap-3 rounded-xl border border-transparent bg-[var(--card)] px-4 text-sm text-[var(--foreground)] shadow-[0_16px_40px_rgba(0,0,0,0.18)]",
          "focus-within:border-[color-mix(in_srgb,var(--accent)_60%,transparent)] focus-within:bg-[color-mix(in_srgb,var(--card)_80%,transparent)]",
          className
        )}
      >
        {prefix && <span className="text-[var(--muted-foreground)]">{prefix}</span>}
        <input
          ref={ref}
          type={type}
          className="flex-1 bg-transparent text-base text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none"
          {...props}
        />
        {suffix && (
          <span className="text-[var(--muted-foreground)] transition-colors group-focus-within:text-[var(--accent)]">
            {suffix}
          </span>
        )}
      </label>
    );
  }
);
Input.displayName = "Input";
