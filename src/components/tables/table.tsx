import { clsx } from "clsx";

type Column<T> = {
  key: keyof T | string;
  header: string;
  className?: string;
  render?: (row: T) => React.ReactNode;
  align?: "left" | "right" | "center";
};

interface TableProps<T extends object> {
  data: T[];
  columns: Column<T>[];
  empty?: React.ReactNode;
}

export function Table<T extends object>({
  data,
  columns,
  empty,
}: TableProps<T>) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--panel)] shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
      <div className="grid grid-cols-1 overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-[color-mix(in_srgb,var(--panel)_85%,transparent)]">
            <tr className="text-left text-[var(--muted-foreground)]">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={clsx(
                    "px-4 py-4 font-semibold uppercase tracking-tight text-xs",
                    col.className,
                    col.align === "right" && "text-right",
                    col.align === "center" && "text-center"
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && empty ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-10 text-center text-[var(--muted-foreground)]"
                >
                  {empty}
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr
                  key={idx}
                  className="border-t border-[var(--border)]/60 text-[var(--foreground)]"
                >
                  {columns.map((col) => (
                    <td
                      key={String(col.key)}
                      className={clsx(
                        "px-4 py-4",
                        col.className,
                        col.align === "right" && "text-right",
                        col.align === "center" && "text-center"
                      )}
                    >
                      {col.render
                        ? col.render(row)
                        : (row[col.key as keyof T] as React.ReactNode)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
