import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth";
import { listTransactions, typeTotals } from "@/server/queries/transactions";
import { getFormRefs } from "@/server/queries/refs";
import { currentMonthRange } from "@/lib/dates";
import { formatCurrency } from "@/lib/format";
import { TransactionList } from "@/components/transactions/transaction-list";
import { TransactionSheet } from "@/components/transactions/transaction-sheet";
import { Pagination } from "@/components/transactions/pagination";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Expenses" };

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? "1") || 1);
  const { start, end } = currentMonthRange();

  const [{ data, total: count, pageCount }, monthTotal, refs] = await Promise.all([
    listTransactions(userId, { type: "EXPENSE", page, pageSize: 15, sort: "date_desc" }),
    typeTotals(userId, "EXPENSE", start, end),
    getFormRefs(userId),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Expenses</h1>
          <p className="text-sm text-muted-foreground">Track where your money goes.</p>
        </div>
        <TransactionSheet refs={refs} defaultType="EXPENSE" />
      </header>

      <Card className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">Spent this month</p>
          <p className="tabular text-2xl font-semibold">{formatCurrency(monthTotal.total)}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Total entries</p>
          <p className="tabular text-2xl font-semibold">{count}</p>
        </div>
      </Card>

      <TransactionList
        rows={data}
        refs={refs}
        emptyLabel="No expenses yet."
        emptyHint="Start tracking your spending by adding your first expense."
      />
      <Pagination page={page} pageCount={pageCount} baseParams={{}} />
    </div>
  );
}
