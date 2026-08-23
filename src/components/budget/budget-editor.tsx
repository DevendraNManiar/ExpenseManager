"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { upsertBudget } from "@/server/actions/budgets";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { BudgetLine } from "@/server/queries/budgets";

export function BudgetEditor({
  month,
  year,
  lines,
}: {
  month: number;
  year: number;
  lines: BudgetLine[];
}) {
  const router = useRouter();
  const [limits, setLimits] = useState<Record<string, string>>(
    Object.fromEntries(lines.map((l) => [l.categoryId, l.limit ? String(l.limit) : ""])),
  );
  const [saving, setSaving] = useState(false);

  const totals = useMemo(() => {
    const limit = lines.reduce((s, l) => s + (Number(limits[l.categoryId]) || 0), 0);
    const spent = lines.reduce((s, l) => s + l.spent, 0);
    return { limit, spent, remaining: limit - spent };
  }, [limits, lines]);

  async function onSave() {
    const items = lines
      .map((l) => ({ categoryId: l.categoryId, limit: Number(limits[l.categoryId]) || 0 }))
      .filter((i) => i.limit > 0);
    setSaving(true);
    const res = await upsertBudget({ month, year, items });
    setSaving(false);
    if (!res.ok) {
      toast.error(res.error ?? "Could not save the budget.");
      return;
    }
    toast.success("Budget saved");
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryTile label="Total budget" value={formatCurrency(totals.limit)} />
        <SummaryTile label="Spent" value={formatCurrency(totals.spent)} />
        <SummaryTile
          label="Remaining"
          value={formatCurrency(totals.remaining)}
          tone={totals.remaining < 0 ? "bad" : "good"}
        />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Category budgets</CardTitle>
          <Button size="sm" onClick={onSave} disabled={saving}>
            {saving ? "Saving…" : "Save budget"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {lines.map((l) => {
            const limit = Number(limits[l.categoryId]) || 0;
            const pct = limit > 0 ? Math.min(100, Math.round((l.spent / limit) * 100)) : 0;
            const over = limit > 0 && l.spent > limit;
            const near = limit > 0 && !over && pct >= 80;
            return (
              <div key={l.categoryId} className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="size-2.5 rounded-full" style={{ background: l.color ?? "#64748b" }} />
                  <span className="flex-1 text-sm font-medium">{l.name}</span>
                  <span className="tabular text-xs text-muted-foreground">
                    {formatCurrency(l.spent)} spent
                  </span>
                  <div className="relative w-32">
                    <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
                    <Input
                      inputMode="decimal"
                      value={limits[l.categoryId] ?? ""}
                      onChange={(e) => setLimits((p) => ({ ...p, [l.categoryId]: e.target.value }))}
                      placeholder="0"
                      className="pl-6 text-right"
                    />
                  </div>
                </div>
                {limit > 0 && (
                  <div className="flex items-center gap-2 pl-6">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          over ? "bg-destructive" : near ? "bg-warning" : "bg-primary",
                        )}
                        style={{ width: `${Math.max(4, pct)}%` }}
                      />
                    </div>
                    <span
                      className={cn(
                        "tabular w-24 text-right text-xs",
                        over ? "text-destructive" : "text-muted-foreground",
                      )}
                    >
                      {over ? (
                        <span className="inline-flex items-center gap-1">
                          <AlertTriangle className="size-3" /> over by {formatCurrency(l.spent - limit)}
                        </span>
                      ) : (
                        `${formatCurrency(limit - l.spent)} left`
                      )}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "good" | "bad";
}) {
  return (
    <Card className="p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={cn("tabular text-2xl font-semibold", tone === "bad" && "text-destructive", tone === "good" && "text-success")}>
        {value}
      </p>
    </Card>
  );
}
