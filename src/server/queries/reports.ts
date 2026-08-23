import "server-only";
import type { TransactionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { dec, monthRange, MONTH_LABELS } from "@/lib/dates";
import { savingsRate } from "@/lib/finance";

export interface ReportData {
  period: "month" | "year";
  label: string;
  income: number;
  expenses: number;
  bills: number;
  emi: number;
  investments: number;
  netCashflow: number;
  savingsRatePct: number;
  categories: { name: string; value: number; pct: number }[];
  byMonth: { label: string; income: number; spending: number }[];
}

const CONSUMPTION: TransactionType[] = ["EXPENSE", "BILL", "EMI"];

export async function getReport(
  userId: string,
  period: "month" | "year",
  month: number,
  year: number,
): Promise<ReportData> {
  const start = period === "year" ? new Date(year, 0, 1) : monthRange(year, month - 1).start;
  const end = period === "year" ? new Date(year + 1, 0, 1) : monthRange(year, month - 1).end;

  const [sums, catGroups, monthly] = await Promise.all([
    prisma.transaction.groupBy({
      by: ["type"],
      where: { userId, date: { gte: start, lt: end } },
      _sum: { amount: true },
    }),
    prisma.transaction.groupBy({
      by: ["categoryId"],
      where: { userId, type: { in: CONSUMPTION }, date: { gte: start, lt: end } },
      _sum: { amount: true },
    }),
    period === "year"
      ? prisma.transaction.findMany({
          where: { userId, date: { gte: start, lt: end }, type: { in: ["INCOME", ...CONSUMPTION] } },
          select: { amount: true, date: true, type: true },
        })
      : Promise.resolve([]),
  ]);

  const byType = new Map(sums.map((s) => [s.type, dec(s._sum.amount)]));
  const income = byType.get("INCOME") ?? 0;
  const expenses = byType.get("EXPENSE") ?? 0;
  const bills = byType.get("BILL") ?? 0;
  const emi = byType.get("EMI") ?? 0;
  const investments = byType.get("INVESTMENT") ?? 0;
  const consumption = expenses + bills + emi;

  // Categories
  const ids = catGroups.map((g) => g.categoryId).filter(Boolean) as string[];
  const cats = await prisma.category.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } });
  const nameById = new Map(cats.map((c) => [c.id, c.name]));
  const totalCat = catGroups.reduce((s, g) => s + dec(g._sum.amount), 0) || 1;
  const categories = catGroups
    .map((g) => ({ name: g.categoryId ? nameById.get(g.categoryId) ?? "Uncategorized" : "Uncategorized", value: dec(g._sum.amount) }))
    .sort((a, b) => b.value - a.value)
    .map((c) => ({ ...c, pct: Math.round((c.value / totalCat) * 100) }));

  // Monthly breakdown (annual only)
  const buckets = Array.from({ length: 12 }, (_, i) => ({ label: MONTH_LABELS[i], income: 0, spending: 0 }));
  for (const t of monthly) {
    const m = t.date.getMonth();
    if (t.type === "INCOME") buckets[m].income += dec(t.amount);
    else buckets[m].spending += dec(t.amount);
  }
  const byMonth = period === "year" ? buckets.map((b) => ({ label: b.label, income: Math.round(b.income), spending: Math.round(b.spending) })) : [];

  return {
    period,
    label: period === "year" ? String(year) : `${new Date(year, month - 1).toLocaleString("en-US", { month: "long" })} ${year}`,
    income,
    expenses,
    bills,
    emi,
    investments,
    netCashflow: Math.round((income - consumption - investments) * 100) / 100,
    savingsRatePct: savingsRate(income, consumption),
    categories,
    byMonth,
  };
}
