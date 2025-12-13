"use client";

import { clsx } from "clsx";

export function Pagination({
  page,
  pageCount,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}) {
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === pageCount || Math.abs(p - page) <= 2
  );

  return (
    <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
      <button
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="rounded-full px-3 py-1 transition-colors hover:bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] disabled:opacity-50"
      >
        {"<"}
      </button>
      {pages.map((p, idx) => {
        const next = pages[idx + 1];
        const showDots = next && next - p > 1;
        return (
          <div key={p} className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(p)}
              className={clsx(
                "min-w-[36px] rounded-full px-3 py-1 text-center font-semibold transition-all",
                p === page
                  ? "bg-[var(--accent)] text-white shadow-[0_10px_30px_rgba(124,92,255,0.35)]"
                  : "hover:bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]"
              )}
            >
              {p}
            </button>
            {showDots ? <span className="px-1">…</span> : null}
          </div>
        );
      })}
      <button
        onClick={() => onPageChange(Math.min(pageCount, page + 1))}
        disabled={page === pageCount}
        className="rounded-full px-3 py-1 transition-colors hover:bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] disabled:opacity-50"
      >
        {">"}
      </button>
    </div>
  );
}
