import "server-only";
import { prisma } from "@/lib/prisma";
import { dec } from "@/lib/dates";

export interface LoanSummary {
  id: string;
  name: string;
  principal: number;
  interestRate: number;
  tenureMonths: number;
  emiAmount: number;
  totalPayable: number;
  totalInterest: number;
  status: string;
  paidCount: number;
  remainingBalance: number;
  progressPct: number;
  nextPayment: { installmentNo: number; dueDate: string; emiAmount: number } | null;
}

export async function listLoans(userId: string): Promise<LoanSummary[]> {
  const loans = await prisma.loan.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { payments: { orderBy: { installmentNo: "asc" } } },
  });

  return loans.map((l) => {
    const principal = dec(l.principal);
    const paid = l.payments.filter((p) => p.isPaid);
    const paidPrincipal = paid.reduce((s, p) => s + dec(p.principalPart), 0);
    const remainingBalance = Math.max(0, Math.round((principal - paidPrincipal) * 100) / 100);
    const next = l.payments.find((p) => !p.isPaid) ?? null;

    return {
      id: l.id,
      name: l.name,
      principal,
      interestRate: dec(l.interestRate),
      tenureMonths: l.tenureMonths,
      emiAmount: dec(l.emiAmount),
      totalPayable: dec(l.totalPayable),
      totalInterest: dec(l.totalInterest),
      status: l.status,
      paidCount: paid.length,
      remainingBalance,
      progressPct: l.tenureMonths > 0 ? Math.round((paid.length / l.tenureMonths) * 100) : 0,
      nextPayment: next
        ? { installmentNo: next.installmentNo, dueDate: next.dueDate.toISOString(), emiAmount: dec(next.emiAmount) }
        : null,
    };
  });
}

export interface ScheduleRow {
  id: string;
  installmentNo: number;
  dueDate: string;
  principalPart: number;
  interestPart: number;
  emiAmount: number;
  balanceAfter: number;
  isPaid: boolean;
}

export async function getLoanDetail(userId: string, id: string) {
  const loan = await prisma.loan.findFirst({
    where: { id, userId },
    include: { payments: { orderBy: { installmentNo: "asc" } } },
  });
  if (!loan) return null;

  const schedule: ScheduleRow[] = loan.payments.map((p) => ({
    id: p.id,
    installmentNo: p.installmentNo,
    dueDate: p.dueDate.toISOString(),
    principalPart: dec(p.principalPart),
    interestPart: dec(p.interestPart),
    emiAmount: dec(p.emiAmount),
    balanceAfter: dec(p.balanceAfter),
    isPaid: p.isPaid,
  }));

  const paid = schedule.filter((s) => s.isPaid);
  const paidPrincipal = paid.reduce((s, p) => s + p.principalPart, 0);

  return {
    id: loan.id,
    name: loan.name,
    principal: dec(loan.principal),
    interestRate: dec(loan.interestRate),
    tenureMonths: loan.tenureMonths,
    emiAmount: dec(loan.emiAmount),
    totalPayable: dec(loan.totalPayable),
    totalInterest: dec(loan.totalInterest),
    processingFee: dec(loan.processingFee),
    startDate: loan.startDate.toISOString(),
    status: loan.status,
    notes: loan.notes,
    schedule,
    paidCount: paid.length,
    remainingBalance: Math.max(0, Math.round((dec(loan.principal) - paidPrincipal) * 100) / 100),
    nextPayment: schedule.find((s) => !s.isPaid) ?? null,
  };
}

/** Total monthly EMI across active loans — used for loan affordability. */
export async function existingMonthlyEmi(userId: string): Promise<number> {
  const agg = await prisma.loan.aggregate({
    where: { userId, status: "ACTIVE" },
    _sum: { emiAmount: true },
  });
  return dec(agg._sum.emiAmount);
}
