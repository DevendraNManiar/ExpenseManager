import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentUserId } from "@/lib/auth";
import { getLoanDetail } from "@/server/queries/loans";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RepaymentSchedule } from "@/components/loans/repayment-schedule";
import { formatCurrency } from "@/lib/format";

export const metadata: Metadata = { title: "Loan" };

export default async function LoanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const { id } = await params;
  const loan = await getLoanDetail(userId, id);
  if (!loan) notFound();

  const stats = [
    { label: "Monthly EMI", value: formatCurrency(loan.emiAmount) },
    { label: "Remaining balance", value: formatCurrency(loan.remainingBalance) },
    { label: "Total interest", value: formatCurrency(loan.totalInterest) },
    { label: "Total payable", value: formatCurrency(loan.totalPayable) },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2 text-muted-foreground">
          <Link href="/loans"><ArrowLeft className="size-4" /> Loans</Link>
        </Button>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{loan.name}</h1>
            <p className="text-sm text-muted-foreground">
              {formatCurrency(loan.principal)} @ {loan.interestRate}% · {loan.tenureMonths} months ·{" "}
              {loan.paidCount}/{loan.tenureMonths} paid
            </p>
          </div>
          {loan.nextPayment && (
            <div className="rounded-lg border bg-card px-4 py-2 text-sm">
              <span className="text-muted-foreground">Next EMI: </span>
              <span className="tabular font-semibold">{formatCurrency(loan.nextPayment.emiAmount)}</span>
              <span className="text-muted-foreground">
                {" "}due {new Date(loan.nextPayment.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-5">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="tabular mt-1 text-xl font-semibold">{s.value}</p>
          </Card>
        ))}
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Repayment schedule</h2>
        <RepaymentSchedule schedule={loan.schedule} />
      </section>
    </div>
  );
}
