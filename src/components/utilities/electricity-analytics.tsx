"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { ElectricityStats } from "@/server/queries/utility";
import { TrendingUp, Gauge, ArrowUp, ArrowDown } from "lucide-react";

export function ElectricityAnalytics({ stats }: { stats: ElectricityStats }) {
  if (stats.count < 1) return null;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Gauge} label="Avg consumption" value={`${formatNumber(stats.avgUnits)} units`} />
        <Stat icon={TrendingUp} label="Avg bill" value={formatCurrency(stats.avgBill)} />
        <Stat icon={ArrowUp} label="Highest" value={`${formatNumber(stats.highest?.units ?? 0)}u`} hint={stats.highest?.label} />
        <Stat icon={ArrowDown} label="Lowest" value={`${formatNumber(stats.lowest?.units ?? 0)}u`} hint={stats.lowest?.label} />
      </div>

      {stats.estimatedNextBill != null && (
        <Card className="bg-gradient-to-br from-primary/10 via-card to-card">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 py-5">
            <div>
              <p className="text-sm text-muted-foreground">Estimated next bill</p>
              <p className="tabular text-3xl font-semibold">{formatCurrency(stats.estimatedNextBill)}</p>
            </div>
            <p className="max-w-xs text-sm text-muted-foreground">
              Based on your average of <span className="font-medium text-foreground">{formatNumber(stats.avgUnits)} units/month</span> at your latest rate.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Units consumed" data={stats.series} dataKey="units" color="hsl(158 74% 42%)" fmt={(n) => `${formatNumber(n)}u`} />
        <ChartCard title="Monthly cost" data={stats.series} dataKey="cost" color="hsl(199 89% 48%)" fmt={(n) => formatCurrency(n)} />
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, hint }: { icon: typeof Gauge; label: string; value: string; hint?: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" />
        <span className="text-sm">{label}</span>
      </div>
      <p className="tabular mt-1 text-xl font-semibold">{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </Card>
  );
}

function ChartCard({
  title,
  data,
  dataKey,
  color,
  fmt,
}: {
  title: string;
  data: { label: string; units: number; cost: number }[];
  dataKey: "units" | "cost";
  color: string;
  fmt: (n: number) => string;
}) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tickLine={false} axisLine={false} width={48} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => fmt(Number(v))} />
              <Tooltip
                content={({ active, payload, label }: any) =>
                  active && payload?.length ? (
                    <div className="rounded-lg border bg-popover px-3 py-1.5 text-xs shadow-md">
                      <span className="font-medium">{label}: </span>
                      <span className="tabular">{fmt(payload[0].value)}</span>
                    </div>
                  ) : null
                }
              />
              <Bar dataKey={dataKey} fill={color} radius={[6, 6, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
