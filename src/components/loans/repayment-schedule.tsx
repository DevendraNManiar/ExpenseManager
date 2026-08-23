"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { setLoanPaymentPaid } from "@/server/actions/loans";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ScheduleRow } from "@/server/queries/loans";

export function RepaymentSchedule({ schedule }: { schedule: ScheduleRow[] }) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const nextUnpaidId = schedule.find((s) => !s.isPaid)?.id;

  async function toggle(id: string, next: boolean) {
    setPending(id);
    const res = await setLoanPaymentPaid(id, next);
    setPending(null);
    if (!res.ok) return toast.error(res.error ?? "Could not update.");
    toast.success(next ? "EMI marked paid" : "EMI marked pending");
    router.refresh();
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">Due date</th>
              <th className="px-4 py-3 text-right font-medium">Principal</th>
              <th className="px-4 py-3 text-right font-medium">Interest</th>
              <th className="px-4 py-3 text-right font-medium">EMI</th>
              <th className="px-4 py-3 text-right font-medium">Balance</th>
              <th className="px-4 py-3 text-right font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {schedule.map((r) => {
              const isNext = r.id === nextUnpaidId;
              return (
                <tr key={r.id} className={cn("transition-colors hover:bg-accent/40", isNext && "bg-primary/5")}>
                  <td className="px-4 py-2.5 text-muted-foreground">{r.installmentNo}</td>
                  <td className="whitespace-nowrap px-4 py-2.5">
                    {new Date(r.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    {isNext && <span className="ml-2 rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">NEXT</span>}
                  </td>
                  <td className="tabular px-4 py-2.5 text-right">{formatCurrency(r.principalPart)}</td>
                  <td className="tabular px-4 py-2.5 text-right text-muted-foreground">{formatCurrency(r.interestPart)}</td>
                  <td className="tabular px-4 py-2.5 text-right font-medium">{formatCurrency(r.emiAmount)}</td>
                  <td className="tabular px-4 py-2.5 text-right text-muted-foreground">{formatCurrency(r.balanceAfter)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <Button
                      variant={r.isPaid ? "secondary" : "outline"}
                      size="sm"
                      className="h-7 gap-1 px-2 text-xs"
                      disabled={pending === r.id}
                      onClick={() => toggle(r.id, !r.isPaid)}
                    >
                      {r.isPaid ? <><Check className="size-3" /> Paid</> : "Mark paid"}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
