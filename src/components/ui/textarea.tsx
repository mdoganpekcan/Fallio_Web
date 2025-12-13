import { forwardRef } from "react";
import { clsx } from "clsx";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={clsx(
          "w-full rounded-xl border border-transparent bg-[var(--card)] px-4 py-3 text-sm text-[var(--foreground)] shadow-[0_10px_30px_rgba(0,0,0,0.2)] outline-none",
          "placeholder:text-[var(--muted-foreground)] focus:border-[var(--accent)] focus:bg-[color-mix(in_srgb,var(--card)_90%,transparent)]",
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";
