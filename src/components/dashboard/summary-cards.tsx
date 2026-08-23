"use client";

import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { AnimatedCounter } from "@/components/animated-counter";
import { formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { SummaryMetric } from "@/lib/dashboard-types";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

export function SummaryCards({ metrics }: { metrics: SummaryMetric[] }) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
    >
      {metrics.map((m) => {
        const positive = m.changePct >= 0;
        // For expenses/bills, a decrease is good — flip the sentiment color.
        const goodWhenDown = m.key === "expenses" || m.key === "bills";
        const good = goodWhenDown ? !positive : positive;
        const isPercentMetric = m.key === "savings";

        return (
          <motion.div key={m.key} variants={item}>
            <Card className="group relative overflow-hidden p-5 transition-shadow hover:shadow-glow">
              <div className="pointer-events-none absolute -right-8 -top-8 size-28 rounded-full bg-primary/5 blur-2xl transition-opacity group-hover:opacity-100" />
              <p className="text-sm font-medium text-muted-foreground">{m.label}</p>
              <div className="mt-2 flex items-end justify-between gap-3">
                <span className="tabular text-2xl font-semibold tracking-tight sm:text-[1.7rem]">
                  {isPercentMetric ? (
                    <AnimatedCounterPercent value={m.value} />
                  ) : (
                    <AnimatedCounter value={m.value} currency={m.currency} />
                  )}
                </span>
                {m.changePct !== 0 && (
                  <span
                    className={cn(
                      "mb-1 inline-flex items-center gap-0.5 text-xs font-semibold",
                      good ? "text-success" : "text-destructive",
                    )}
                  >
                    {positive ? (
                      <ArrowUpRight className="size-3.5" />
                    ) : (
                      <ArrowDownRight className="size-3.5" />
                    )}
                    {formatPercent(m.changePct)}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{m.hint}</p>
            </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

function AnimatedCounterPercent({ value }: { value: number }) {
  return <span className="tabular">{value.toFixed(1)}%</span>;
}
