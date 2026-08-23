"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Circular financial-health gauge (spec §41). Informational, not advice. */
export function FinancialHealth({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score));
  const label = clamped >= 75 ? "Healthy" : clamped >= 50 ? "Fair" : "Needs attention";
  const tone =
    clamped >= 75 ? "text-success" : clamped >= 50 ? "text-warning-foreground" : "text-destructive";
  const r = 52;
  const c = 2 * Math.PI * r;
  const offset = c - (clamped / 100) * c;

  return (
    <Card className="overflow-hidden">
      <CardContent className="flex items-center gap-6 p-6">
        <div className="relative size-32 shrink-0">
          <svg viewBox="0 0 128 128" className="size-full -rotate-90">
            <circle cx="64" cy="64" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="12" />
            <motion.circle
              cx="64"
              cy="64"
              r={r}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={c}
              initial={{ strokeDashoffset: c }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="tabular text-3xl font-semibold">{clamped}</span>
            <span className="text-[10px] text-muted-foreground">/ 100</span>
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Financial Health</p>
          <p className={cn("text-xl font-semibold", tone)}>{label}</p>
          <p className="mt-2 max-w-xs text-xs leading-relaxed text-muted-foreground">
            Based on your savings rate, budget adherence, and EMI-to-income ratio.
            Informational only — not financial advice.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
