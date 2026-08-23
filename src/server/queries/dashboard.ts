import "server-only";
import type { TransactionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { dec, currentMonthRange, previousMonthRange, MONTH_LABELS, monthRange } from "@/lib/dates";
import { savingsRate, computeHealthScore } from "@/lib/finance";
import { percentChange } from "@/lib/format";
import { generateInsights } from "@/server/queries/insights";
import { getPortfolioSummary } from "@/server/queries/investments";
import { listLoans } from "@/server/queries/loans";
import type { DashboardData } from "@/lib/dashboard-types";

const OUTFLOW: TransactionType[] = ["EXPENSE", "EMI", "BILL"];
const PALETTE = ["#10b981", "#0ea5e9", "#f59e0b", "#a855f7", "#ef4444", "#14b8a6", "#64748b"];

async function sumByType(userId: string, types: TransactionType[], from: Date, to: Date) {
  const agg = await prisma.transaction.aggregate({
    where: { userId, type: { in: types }, date: { gte: from, lt: to } },
    _sum: { amount: true },
  });
  return dec(agg._sum.amount);
}

export async function getDashboardData(userId: string, now = new Date()): Promise<DashboardData> {
  const cur = currentMonthRange(now);
  const prev = previousMonthRange(now);

  const [
    user,
    income,
    expenses,
    prevExpenses,
    lifetimeIn,
    lifetimeOut,
    sixMonthsTx,
    catGroups,
    monthExpenses,
    goals,
    bills,
    loanPayments,
  ] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, include: { profile: true } }),
    sumByType(userId, ["INCOME"], cur.start, cur.end),
    sumByType(userId, OUTFLOW, cur.start, cur.end),
    sumByType(userId, OUTFLOW, prev.start, prev.end),
    sumByType(userId, ["INCOME"], new Date(2000, 0, 1), cur.end),
    sumByType(userId, OUTFLOW, new Date(2000, 0, 1), cur.end),
    prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: monthRange(now.getFullYear(), now.getMonth() - 5).start, lt: cur.end },
        type: { in: [...OUTFLOW, "INCOME"] },
      },
      select: { amount: true, date: true, type: true },
    }),
    prisma.transaction.groupBy({
      by: ["categoryId"],
      where: { userId, type: { in: OUTFLOW }, date: { gte: cur.start, lt: cur.end } },
      _sum: { amount: true },
    }),
    prisma.transaction.findMany({
      where: { userId, type: { in: OUTFLOW }, date: { gte: cur.start, lt: cur.end } },
      select: { amount: true, date: true },
    }),
    prisma.financialGoal.findMany({
      where: { userId, status: "ACTIVE" },
      orderBy: { createdAt: "asc" },
      take: 4,
    }),
    prisma.bill.findMany({
      where: { userId, isPaid: false, dueDate: { gte: now } },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
    prisma.loanPayment.findMany({
      where: { loan: { userId }, isPaid: false, dueDate: { gte: now } },
      orderBy: [{ loanId: "asc" }, { dueDate: "asc" }],
      distinct: ["loanId"], // only the next EMI per loan
      take: 5,
      include: { loan: { select: { name: true } } },
    }),
  ]);

  const profile = user?.profile;
  const currency = profile?.currency ?? "INR";
  const currentSavings = dec(profile?.currentSavings);
  const balance = currentSavings + (lifetimeIn - lifetimeOut);

  // Upcoming bills total (this month) = unpaid bills + unpaid EMIs due before month end.
  const upcomingBillsTotal =
    bills.filter((b) => b.dueDate < cur.end).reduce((s, b) => s + dec(b.amount), 0) +
    loanPayments.filter((p) => p.dueDate < cur.end).reduce((s, p) => s + dec(p.emiAmount), 0);

  const [existingEmi, insights, portfolio, loanSummaries] = await Promise.all([
    sumByType(userId, ["EMI"], cur.start, cur.end),
    generateInsights(userId, now),
    getPortfolioSummary(userId),
    listLoans(userId),
  ]);
  const investmentsTotal = portfolio.totalCurrent;
  const debtTotal = loanSummaries.reduce((s, l) => s + l.remainingBalance, 0);
  const orbit = [
    { key: "income", label: "Income", value: income, color: "#10b981" },
    { key: "expenses", label: "Expenses", value: expenses, color: "#ef4444" },
    { key: "savings", label: "Savings", value: Math.max(0, income - expenses), color: "#14b8a6" },
    { key: "investments", label: "Investments", value: investmentsTotal, color: "#0ea5e9" },
    { key: "debt", label: "Debt", value: debtTotal, color: "#f59e0b" },
  ].filter((n) => n.value > 0);

  const healthScore = computeHealthScore({
    monthlyIncome: income,
    monthlyExpenses: expenses,
    existingEmi,
    currentSavings,
    overBudget: false,
  });

  // 6-month income vs expenses buckets.
  const buckets = new Map<string, { income: number; expenses: number }>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.set(`${d.getFullYear()}-${d.getMonth()}`, { income: 0, expenses: 0 });
  }
  for (const t of sixMonthsTx) {
    const key = `${t.date.getFullYear()}-${t.date.getMonth()}`;
    const b = buckets.get(key);
    if (!b) continue;
    if (t.type === "INCOME") b.income += dec(t.amount);
    else b.expenses += dec(t.amount);
  }
  const incomeVsExpenses = [...buckets.entries()].map(([key, v]) => {
    const m = Number(key.split("-")[1]);
    return { label: MONTH_LABELS[m], income: Math.round(v.income), expenses: Math.round(v.expenses) };
  });

  // Category spend (top 6 + Other).
  const catIds = catGroups.map((g) => g.categoryId).filter(Boolean) as string[];
  const catMeta = await prisma.category.findMany({
    where: { id: { in: catIds } },
    select: { id: true, name: true, color: true },
  });
  const catMap = new Map(catMeta.map((c) => [c.id, c]));
  const catSorted = catGroups
    .map((g) => ({
      name: g.categoryId ? (catMap.get(g.categoryId)?.name ?? "Other") : "Uncategorized",
      value: dec(g._sum.amount),
      color: g.categoryId ? catMap.get(g.categoryId)?.color ?? null : null,
    }))
    .sort((a, b) => b.value - a.value);
  const top = catSorted.slice(0, 6);
  const rest = catSorted.slice(6).reduce((s, c) => s + c.value, 0);
  const categorySpend = [
    ...top.map((c, i) => ({ name: c.name, value: c.value, color: c.color ?? PALETTE[i % PALETTE.length] })),
    ...(rest > 0 ? [{ name: "Other", value: rest, color: PALETTE[6] }] : []),
  ];

  // Daily spend for the current month.
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daily = Array.from({ length: daysInMonth }, (_, i) => ({ day: String(i + 1), amount: 0 }));
  for (const t of monthExpenses) daily[t.date.getDate() - 1].amount += dec(t.amount);
  const dailySpend = daily.map((d) => ({ day: d.day, amount: Math.round(d.amount) }));

  // Upcoming list (bills + EMIs), merged and sorted.
  const fmt = (d: Date) => `${d.getDate()} ${MONTH_LABELS[d.getMonth()]}`;
  const upcoming = [
    ...loanPayments.map((p) => ({ title: `${p.loan.name} EMI`, amount: dec(p.emiAmount), date: fmt(p.dueDate), type: "EMI", raw: p.dueDate })),
    ...bills.map((b) => ({ title: b.name, amount: dec(b.amount), date: fmt(b.dueDate), type: "BILL", raw: b.dueDate })),
  ]
    .sort((a, b) => a.raw.getTime() - b.raw.getTime())
    .slice(0, 5)
    .map(({ raw, ...rest }) => rest);

  return {
    userName: user?.name?.split(" ")[0] ?? "there",
    monthLabel: `${now.toLocaleString("en-US", { month: "long" })} ${now.getFullYear()}`,
    currency,
    healthScore,
    orbit,
    metrics: [
      { key: "balance", label: "Total Balance", value: balance, currency, changePct: 0, hint: "savings + net cashflow" },
      { key: "income", label: "Monthly Income", value: income, currency, changePct: 0, hint: "this month" },
      { key: "expenses", label: "Monthly Expenses", value: expenses, currency, changePct: percentChange(expenses, prevExpenses), hint: "vs previous month" },
      { key: "remaining", label: "Remaining", value: income - expenses, currency, changePct: 0, hint: "safe to spend / save" },
      { key: "savings", label: "Savings Rate", value: savingsRate(income, expenses), currency, changePct: 0, hint: "of income saved" },
      { key: "bills", label: "Upcoming Bills", value: upcomingBillsTotal, currency, changePct: 0, hint: "due this month" },
    ],
    incomeVsExpenses,
    categorySpend,
    dailySpend,
    upcoming,
    goals: goals.map((g) => ({
      name: g.name,
      current: dec(g.currentAmount),
      target: dec(g.targetAmount),
      color: g.color ?? "#10b981",
    })),
    insights,
  };
}
