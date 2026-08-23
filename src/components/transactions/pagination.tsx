import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Pagination({
  page,
  pageCount,
  baseParams,
}: {
  page: number;
  pageCount: number;
  baseParams: Record<string, string | undefined>;
}) {
  if (pageCount <= 1) return null;
  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(baseParams)) if (v) sp.set(k, v);
    sp.set("page", String(p));
    return `?${sp.toString()}`;
  };
  const base = "inline-flex h-9 items-center gap-1 rounded-md border px-3 text-sm font-medium transition-colors";
  return (
    <nav className="flex items-center justify-between pt-2" aria-label="Pagination">
      <Link
        href={href(Math.max(1, page - 1))}
        aria-disabled={page <= 1}
        className={cn(base, page <= 1 ? "pointer-events-none opacity-50" : "hover:bg-accent")}
      >
        <ChevronLeft className="size-4" /> Prev
      </Link>
      <span className="text-sm text-muted-foreground">
        Page {page} of {pageCount}
      </span>
      <Link
        href={href(Math.min(pageCount, page + 1))}
        aria-disabled={page >= pageCount}
        className={cn(base, page >= pageCount ? "pointer-events-none opacity-50" : "hover:bg-accent")}
      >
        Next <ChevronRight className="size-4" />
      </Link>
    </nav>
  );
}
