import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { TransactionType } from "@prisma/client";
import { getCurrentUserId } from "@/lib/auth";
import { listTransactions, type ListParams } from "@/server/queries/transactions";
import { getFormRefs } from "@/server/queries/refs";
import { TransactionList } from "@/components/transactions/transaction-list";
import { FilterBar } from "@/components/transactions/filter-bar";
import { Pagination } from "@/components/transactions/pagination";

export const metadata: Metadata = { title: "Transactions" };

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? "1") || 1);
  const params: ListParams = {
    type: (sp.type as TransactionType) ?? "ALL",
    search: sp.q,
    sort: (sp.sort as ListParams["sort"]) ?? "date_desc",
    page,
    pageSize: 20,
  };

  const [{ data, total, pageCount }, refs] = await Promise.all([
    listTransactions(userId, params),
    getFormRefs(userId),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
        <p className="text-sm text-muted-foreground">
          {total} {total === 1 ? "entry" : "entries"} in your ledger.
        </p>
      </header>

      <FilterBar />
      <TransactionList
        rows={data}
        refs={refs}
        emptyLabel="No transactions match your filters."
        emptyHint="Try clearing filters, or add a new transaction from the top bar."
      />
      <Pagination page={page} pageCount={pageCount} baseParams={{ type: sp.type, q: sp.q, sort: sp.sort }} />
    </div>
  );
}
