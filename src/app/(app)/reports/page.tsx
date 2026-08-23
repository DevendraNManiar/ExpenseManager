import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getCurrentUserId } from "@/lib/auth";
import { getReport } from "@/server/queries/reports";
import { generateInsights } from "@/server/queries/insights";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IncomeExpenseChart } from "@/components/dashboard/income-expense-chart";
import { InsightsWidget } from "@/components/dashboard/insights-widget";
import { ReportExport } from "@/components/reports/report-export";
import { formatCurrency, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const sp = await searchParams;
  const now = new Date();
  const period = sp.period === "year" ? "year" : "month";
  const month = Math.min(12, Math.max(1, Number(sp.month) || now.getMonth() + 1));
  const year = Math.min(2100, Math.max(2000, Number(sp.year) || now.getFullYear()));

  const [report, insights] = await Promise.all([
    getReport(userId, period, month, year),
    generateInsights(userId, period === "month" ? new Date(year, month - 1, 15) : now),
  ]);

  const prev = period === "year"
    ? { period, year: year - 1, month }
    : month === 1 ? { period, month: 12, year: year - 1 } : { period, month: month - 1, year };
  const next = period === "year"
    ? { period, year: year + 1, month }
    : month === 12 ? { period, month: 1, year: year + 1 } : { period, month: month + 1, year };
  const q = (o: Record<string, string | number>) => "?" + new URLSearchParams(Object.fromEntries(Object.entries(o).map(([k, v]) => [k, String(v)]))).toString();

  const tiles = [
    { label: "Income", value: formatCurrency(report.income), tone: "good" as const },
    { label: "Expenses", value: formatCurrency(report.expenses) },
    { label: "Bills", value: formatCurrency(report.bills) },
    { label: "EMI", value: formatCurrency(report.emi) },
    { label: "Investments", value: formatCurrency(report.investments) },
    { label: "Net cashflow", value: formatCurrency(report.netCashflow), tone: report.netCashflow >= 0 ? ("good" as const) : ("bad" as const) },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground">{report.label} · savings rate {formatPercent(report.savingsRatePct)}</p>
        </div>
        <ReportExport report={report} />
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex gap-1 rounded-lg border bg-muted/40 p-0.5">
          <Tab active={period === "month"} href={q({ period: "month", month, year })}>Monthly</Tab>
          <Tab active={period === "year"} href={q({ period: "year", year })}>Annual</Tab>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild aria-label="Previous"><Link href={q(prev)}><ChevronLeft className="size-4" /></Link></Button>
          <span className="min-w-28 text-center text-sm font-medium">{report.label}</span>
          <Button variant="outline" size="icon" asChild aria-label="Next"><Link href={q(next)}><ChevronRight className="size-4" /></Link></Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {tiles.map((t) => (
          <Card key={t.label} className="p-4">
            <p className="text-xs text-muted-foreground">{t.label}</p>
            <p className={cn("tabular mt-1 text-lg font-semibold", t.tone === "good" && "text-success", t.tone === "bad" && "text-destructive")}>{t.value}</p>
          </Card>
        ))}
      </div>

      {period === "year" && report.byMonth.length > 0 && (
        <IncomeExpenseChart data={report.byMonth.map((m) => ({ label: m.label, income: m.income, expenses: m.spending }))} />
      )}

      <Card>
        <CardHeader><CardTitle>Category breakdown</CardTitle></CardHeader>
        <CardContent>
          {report.categories.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No spending recorded for this period.</p>
          ) : (
            <ul className="space-y-3">
              {report.categories.map((c) => (
                <li key={c.name}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium">{c.name}</span>
                    <span className="tabular text-muted-foreground">{formatCurrency(c.value)} · {c.pct}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(2, c.pct)}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <InsightsWidget insights={insights} />
    </div>
  );
}

function Tab({ active, href, children }: { active: boolean; href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className={cn("rounded-md px-3 py-1.5 text-sm font-medium transition-colors", active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
      {children}
    </Link>
  );
}
