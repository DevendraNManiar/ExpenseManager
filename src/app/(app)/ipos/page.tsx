import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth";
import { listIpos, getIpoSummary } from "@/server/queries/ipos";
import { IpoManager } from "@/components/ipos/ipo-manager";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "IPO Tracker" };

export default async function IposPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const [rows, summary] = await Promise.all([listIpos(userId), getIpoSummary(userId)]);
  const up = summary.realizedPL >= 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">IPO Tracker</h1>
        <p className="text-sm text-muted-foreground">Follow applications from planning through allotment to listing.</p>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Tile label="Tracked" value={String(summary.total)} />
        <Tile label="Applied" value={String(summary.applied)} />
        <Tile label="Total applied" value={formatCurrency(summary.totalApplied)} />
        <Tile label="Gain / Loss" value={`${up ? "+" : ""}${formatCurrency(summary.realizedPL)}`} tone={up ? "good" : "bad"} />
      </div>

      <IpoManager rows={rows} />
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
