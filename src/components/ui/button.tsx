import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import { forwardRef } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--accent)] text-white shadow-[0_12px_40px_rgba(124,92,255,0.35)] hover:bg-[var(--accent-strong)] focus-visible:outline-[var(--accent-strong)]",
        outline:
          "border border-[color-mix(in_srgb,var(--accent)_60%,transparent)] text-[var(--foreground)] hover:border-[var(--accent)] hover:bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] focus-visible:outline-[var(--accent)]",
        ghost:
          "bg-[color-mix(in_srgb,var(--card)_70%,transparent)] text-[var(--foreground)] hover:bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] focus-visible:outline-[var(--accent)]",
        destructive:
          "bg-[var(--danger)] text-white hover:bg-[#d94b58] focus-visible:outline-[var(--danger)]",
        link: "text-[var(--accent)] underline-offset-4 hover:underline focus-visible:outline-[var(--accent)]",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-11 px-4 text-base",
        lg: "h-12 px-5 text-base",
        pill: "h-12 px-6 text-base rounded-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={clsx(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
