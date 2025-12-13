"use client";

import { clsx } from "clsx";
import { X } from "lucide-react";
import { useEffect } from "react";

type ModalProps = {
  title: string;
  description?: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  widthClass?: string;
};

export function Modal({
  title,
  description,
  open,
  onClose,
  children,
  widthClass = "max-w-2xl",
}: ModalProps) {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur">
      <div
        className={clsx(
          "relative w-full rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[0_40px_120px_rgba(0,0,0,0.6)]",
          widthClass
        )}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-[var(--muted-foreground)] transition hover:bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] hover:text-white"
        >
          <X size={18} />
        </button>
        <div className="mb-4 space-y-1">
          <h3 className="font-display text-xl font-semibold text-white">
            {title}
          </h3>
          {description ? (
            <p className="text-sm text-[var(--muted-foreground)]">{description}</p>
          ) : null}
        </div>
        {children}
      </div>
    </div>
  );
}
