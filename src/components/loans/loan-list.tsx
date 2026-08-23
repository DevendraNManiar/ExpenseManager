"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { HandCoins, Trash2, ChevronRight, Inbox } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { deleteLoan } from "@/server/actions/loans";
import { formatCurrency } from "@/lib/format";
import type { LoanSummary } from "@/server/queries/loans";

export function LoanList({ loans }: { loans: LoanSummary[] }) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);

  async function onDelete(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this loan and its schedule?")) return;
    setPending(id);
    const res = await deleteLoan(id);
    setPending(null);
    if (!res.ok) return toast.error(res.error ?? "Could not delete.");
    toast.success("Loan deleted");
    router.refresh();
  }

  if (loans.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center gap-2 py-14 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground"><Inbox className="size-6" /></span>
        <p className="font-medium">No loans yet.</p>
        <p className="max-w-xs text-sm text-muted-foreground">Plan a loan above to generate its EMI and repayment schedule.</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {loans.map((l) => (
        <Link key={l.id} href={`/loans/${l.id}`}>
          <Card className="group h-full p-5 transition-shadow hover:shadow-glow">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><HandCoins className="size-5" /></span>
                <div>
                  <p className="font-semibold">{l.name}</p>
                  <p className="text-xs text-muted-foreground">{l.interestRate}% · {l.tenureMonths} months</p>
                </div>
              </div>
              <Badge variant={l.status === "CLOSED" ? "success" : "secondary"}>{l.status}</Badge>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Monthly EMI</p>
                <p className="tabular font-semibold">{formatCurrency(l.emiAmount)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Remaining</p>
                <p className="tabular font-semibold">{formatCurrency(l.remainingBalance)}</p>
              </div>
            </div>

            <div className="mt-3">
              <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                <span>{l.paidCount}/{l.tenureMonths} EMIs paid</span>
                <span>{l.progressPct}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.max(2, l.progressPct)}%` }} />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t pt-3 text-sm">
              {l.nextPayment ? (
                <span className="text-muted-foreground">
                  Next: <span className="tabular font-medium text-foreground">{formatCurrency(l.nextPayment.emiAmount)}</span> ·{" "}
                  {new Date(l.nextPayment.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              ) : (
                <span className="text-success">Fully repaid 🎉</span>
              )}
              <span className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive" aria-label="Delete loan" disabled={pending === l.id} onClick={(e) => onDelete(e, l.id)}>
                  <Trash2 className="size-4" />
                </Button>
                <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
