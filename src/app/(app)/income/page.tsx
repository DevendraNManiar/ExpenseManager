import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth";
import { listTransactions, typeTotals } from "@/server/queries/transactions";
import { getFormRefs } from "@/server/queries/refs";
import { currentMonthRange, monthRange } from "@/lib/dates";
import { formatCurrency } from "@/lib/format";
import { TransactionList } from "@/components/transactions/transaction-list";
import { TransactionSheet } from "@/components/transactions/transaction-sheet";
import { Pagination } from "@/components/transactions/pagination";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Income" };

export default async function IncomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? "1") || 1);
  const now = new Date();
  const { start, end } = currentMonthRange(now);
  const yearStart = monthRange(now.getFullYear(), 0).start;
  const yearEnd = monthRange(now.getFullYear(), 11).end;

  const [{ data, total: count, pageCount }, monthTotal, yearTotal, refs] = await Promise.all([
    listTransactions(userId, { type: "INCOME", page, pageSize: 15, sort: "date_desc" }),
    typeTotals(userId, "INCOME", start, end),
    typeTotals(userId, "INCOME", yearStart, yearEnd),
    getFormRefs(userId),
  ]);

  const avgMonthly = yearTotal.total / (now.getMonth() + 1);

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Income</h1>
          <p className="text-sm text-muted-foreground">Salary, freelance, rental and more.</p>
        </div>
        <TransactionSheet refs={refs} defaultType="INCOME" />
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="This month" value={formatCurrency(monthTotal.total)} />
        <Stat label="This year" value={formatCurrency(yearTotal.total)} />
        <Stat label="Avg / month" value={formatCurrency(avgMonthly)} />
      </div>

      <TransactionList
        rows={data}
        refs={refs}
        emptyLabel="No income recorded yet."
        emptyHint="Add your salary or other income to track your cash inflow."
      />
      <Pagination page={page} pageCount={pageCount} baseParams={{}} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="tabular text-2xl font-semibold">{value}</p>
    </Card>
  );
}
