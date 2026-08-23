import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listLoans, existingMonthlyEmi } from "@/server/queries/loans";
import { dec, currentMonthRange } from "@/lib/dates";
import { LoanPlanner } from "@/components/loans/loan-planner";
import { LoanList } from "@/components/loans/loan-list";

export const metadata: Metadata = { title: "Loans" };

export default async function LoansPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const { start, end } = currentMonthRange();
  const [profile, existingEmi, loans, expenseAgg] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    existingMonthlyEmi(userId),
    listLoans(userId),
    prisma.transaction.aggregate({
      where: { userId, type: { in: ["EXPENSE", "BILL"] }, date: { gte: start, lt: end } },
      _sum: { amount: true },
    }),
  ]);

  // Prefer the profile's fixed expenses; fall back to this month's actual spend.
  const monthlyExpenses = dec(profile?.monthlyFixedExpenses) || dec(expenseAgg._sum.amount);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Loan Planner</h1>
        <p className="text-sm text-muted-foreground">
          Model an EMI, check affordability against your income, then track repayment.
        </p>
      </header>

      <LoanPlanner
        monthlyIncome={dec(profile?.monthlyIncome)}
        monthlyExpenses={monthlyExpenses}
        existingEmi={existingEmi}
      />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Your loans</h2>
        <LoanList loans={loans} />
      </section>
    </div>
  );
}
