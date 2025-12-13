"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Pagination } from "../ui/pagination";

export function UsersPagination({
  page,
  pageCount,
}: {
  page: number;
  pageCount: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updatePage = (p: number) => {
    const params = new URLSearchParams(searchParams ?? undefined);
    params.set("page", String(p));
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <Pagination page={page} pageCount={pageCount} onPageChange={updatePage} />
  );
}
