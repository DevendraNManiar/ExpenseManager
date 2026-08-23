"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatCompactCurrency, formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Point {
  label: string;
  income: number;
  expenses: number;
}

const ranges = ["6M", "3M", "YTD"] as const;
type Range = (typeof ranges)[number];

export function IncomeExpenseChart({ data }: { data: Point[] }) {
  const [range, setRange] = useState<Range>("6M");
  const sliced =
    range === "3M" ? data.slice(-3) : range === "YTD" ? data : data;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Income vs Expenses</CardTitle>
        <div className="flex gap-1 rounded-lg border bg-muted/40 p-0.5">
          {ranges.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                range === r
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sliced} margin={{ left: 4, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="inc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(158 74% 45%)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="hsl(158 74% 45%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="exp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(0 72% 55%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(0 72% 55%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={44}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(v) => formatCompactCurrency(Number(v))}
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="income"
                stroke="hsl(158 74% 42%)"
                strokeWidth={2.5}
                fill="url(#inc)"
              />
              <Area
                type="monotone"
                dataKey="expenses"
                stroke="hsl(0 72% 55%)"
                strokeWidth={2.5}
                fill="url(#exp)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-medium">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="flex items-center justify-between gap-4 tabular">
          <span className="capitalize text-muted-foreground">{p.dataKey}</span>
          <span className="font-semibold" style={{ color: p.color }}>
            {formatCurrency(p.value)}
          </span>
        </p>
      ))}
    </div>
  );
}
