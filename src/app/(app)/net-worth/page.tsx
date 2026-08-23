import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { TrendingUp, TrendingDown } from "lucide-react";
import { getCurrentUserId } from "@/lib/auth";
import { getNetWorth, type NetWorthLine } from "@/server/queries/networth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Net Worth" };

export default async function NetWorthPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const nw = await getNetWorth(userId);
  const positive = nw.netWorth >= 0;
  const denom = Math.max(nw.totalAssets, nw.totalLiabilities, 1);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Net Worth</h1>
        <p className="text-sm text-muted-foreground">Assets minus liabilities, from your cash, investments and loans.</p>
      </header>

      <Card className="overflow-hidden bg-gradient-to-br from-primary/10 via-card to-card">
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Estimated net worth</p>
          <p className={cn("tabular mt-1 text-4xl font-semibold tracking-tight sm:text-5xl", !positive && "text-destructive")}>
            {formatCurrency(nw.netWorth)}
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Bar label="Assets" value={nw.totalAssets} denom={denom} tone="asset" />
            <Bar label="Liabilities" value={nw.totalLiabilities} denom={denom} tone="liability" />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 sm:grid-cols-2">
        <Breakdown title="Assets" icon="up" lines={nw.assets} total={nw.totalAssets} empty="No assets recorded. Add investments or set your savings in Settings." />
        <Breakdown title="Liabilities" icon="down" lines={nw.liabilities} total={nw.totalLiabilities} empty="No liabilities — you're debt-free 🎉" />
      </div>
    </div>
  );
}

function Bar({ label, value, denom, tone }: { label: string; value: number; denom: number; tone: "asset" | "liability" }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular font-semibold">{formatCurrency(value)}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full", tone === "asset" ? "bg-success" : "bg-destructive")} style={{ width: `${Math.min(100, (value / denom) * 100)}%` }} />
      </div>
    </div>
  );
}

function Breakdown({ title, icon, lines, total, empty }: { title: string; icon: "up" | "down"; lines: NetWorthLine[]; total: number; empty: string }) {
  const Icon = icon === "up" ? TrendingUp : TrendingDown;
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2 space-y-0">
        <Icon className={cn("size-4", icon === "up" ? "text-success" : "text-destructive")} />
        <CardTitle>{title}</CardTitle>
        <span className="tabular ml-auto text-sm font-semibold">{formatCurrency(total)}</span>
      </CardHeader>
      <CardContent>
        {lines.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{empty}</p>
        ) : (
          <ul className="divide-y">
            {lines.map((l) => (
              <li key={l.label} className="flex items-center justify-between py-2.5 text-sm">
                <span>{l.label}</span>
                <span className="tabular font-medium">{formatCurrency(l.value)}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
