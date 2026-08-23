import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth";
import { listInvestments, getPortfolioSummary } from "@/server/queries/investments";
import { InvestmentsManager } from "@/components/investments/investments-manager";
import { CategoryDonut } from "@/components/dashboard/category-donut";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Investments" };

export default async function InvestmentsPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const [rows, summary] = await Promise.all([listInvestments(userId), getPortfolioSummary(userId)]);
  const up = summary.totalPL >= 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Investments</h1>
        <p className="text-sm text-muted-foreground">Stocks, mutual funds, FDs, gold and crypto — with live P/L and ROI.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="Invested" value={formatCurrency(summary.totalInvested)} />
        <Tile label="Current value" value={formatCurrency(summary.totalCurrent)} />
        <Tile label="Profit / Loss" value={`${up ? "+" : ""}${formatCurrency(summary.totalPL)}`} tone={up ? "good" : "bad"} />
        <Tile label="ROI" value={formatPercent(summary.roiPct)} tone={up ? "good" : "bad"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <InvestmentsManager rows={rows} />
        </div>
        {summary.allocation.length > 0 && (
          <CategoryDonut data={summary.allocation} title="Portfolio allocation" />
        )}
      </div>
    </div>
  );
}

function Tile({ label, value, tone }: { label: string; value: string; tone?: "good" | "bad" }) {
  return (
    <Card className="p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={cn("tabular mt-1 text-xl font-semibold", tone === "good" && "text-success", tone === "bad" && "text-destructive")}>{value}</p>
    </Card>
  );
}
