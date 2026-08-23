import "server-only";
import type { TransactionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { dec, currentMonthRange, previousMonthRange } from "@/lib/dates";
import { savingsRate } from "@/lib/finance";
import { formatCurrency, formatPercent, percentChange as pc } from "@/lib/format";
import { existingMonthlyEmi } from "@/server/queries/loans";

export interface Insight {
  tone: "positive" | "neutral" | "warning";
  text: string;
}

const OUTFLOW: TransactionType[] = ["EXPENSE", "EMI", "BILL"];

/**
 * Factual, transparent observations from the user's own data (spec §27).
 * Not financial advice.
 */
export async function generateInsights(userId: string, now = new Date()): Promise<Insight[]> {
  const cur = currentMonthRange(now);
  const prev = previousMonthRange(now);
  const insights: Insight[] = [];

  const [income, expenses, prevExpenses, curCats, prevCats, emi, profile, readings] = await Promise.all([
    sum(userId, ["INCOME"], cur.start, cur.end),
    sum(userId, OUTFLOW, cur.start, cur.end),
    sum(userId, OUTFLOW, prev.start, prev.end),
    catTotals(userId, cur.start, cur.end),
    catTotals(userId, prev.start, prev.end),
    existingMonthlyEmi(userId),
    prisma.profile.findUnique({ where: { userId } }),
    prisma.utilityReading.findMany({ where: { userId, type: "electricity" }, orderBy: [{ year: "desc" }, { month: "desc" }], take: 4 }),
  ]);

  // Month-over-month spending.
  if (prevExpenses > 0) {
    const change = pc(expenses, prevExpenses);
    if (change <= -2) insights.push({ tone: "positive", text: `You spent ${formatPercent(Math.abs(change))} less this month than last month.` });
    else if (change >= 2) insights.push({ tone: "warning", text: `Your spending is up ${formatPercent(change)} versus last month.` });
  }

  // Biggest category mover.
  let mover: { name: string; change: number } | null = null;
  for (const [name, cur1] of curCats) {
    const prev1 = prevCats.get(name) ?? 0;
    if (prev1 <= 0) continue;
    const ch = pc(cur1, prev1);
    if (!mover || Math.abs(ch) > Math.abs(mover.change)) mover = { name, change: ch };
  }
  if (mover && Math.abs(mover.change) >= 10) {
    insights.push({
      tone: mover.change > 0 ? "warning" : "positive",
      text: `Your ${mover.name.toLowerCase()} spending ${mover.change > 0 ? "increased" : "decreased"} by ${formatPercent(Math.abs(mover.change))} this month.`,
    });
  }

  // Electricity vs recent average.
  if (readings.length >= 2) {
    const latest = dec(readings[0].unitsUsed);
    const rest = readings.slice(1);
    const avg = rest.reduce((s, r) => s + dec(r.unitsUsed), 0) / rest.length;
    if (avg > 0) {
      const ch = pc(latest, avg);
      if (Math.abs(ch) >= 8) {
        insights.push({
          tone: ch > 0 ? "warning" : "positive",
          text: `Your electricity consumption is ${formatPercent(Math.abs(ch))} ${ch > 0 ? "higher" : "lower"} than your recent average.`,
        });
      }
    }
  }

  // EMI-to-income ratio.
  if (income > 0 && emi > 0) {
    const ratio = (emi / income) * 100;
    insights.push({
      tone: ratio > 40 ? "warning" : "neutral",
      text: `Your current EMI-to-income ratio is ${formatPercent(ratio)}.`,
    });
  }

  // Savings rate + available.
  if (income > 0) {
    const rate = savingsRate(income, expenses);
    insights.push({ tone: rate >= 20 ? "positive" : "neutral", text: `Your savings rate this month is ${formatPercent(rate)}.` });
    const available = income - expenses;
    insights.push({ tone: "neutral", text: `You have ${formatCurrency(Math.max(0, available))} left after this month's spending.` });
  }

  if (insights.length === 0) {
    insights.push({ tone: "neutral", text: "Add income and expenses to unlock personalized insights." });
  }
  void profile;
  return insights.slice(0, 6);
}

async function sum(userId: string, types: TransactionType[], from: Date, to: Date) {
  const agg = await prisma.transaction.aggregate({ where: { userId, type: { in: types }, date: { gte: from, lt: to } }, _sum: { amount: true } });
  return dec(agg._sum.amount);
}

async function catTotals(userId: string, from: Date, to: Date): Promise<Map<string, number>> {
  const groups = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: { userId, type: { in: OUTFLOW }, date: { gte: from, lt: to } },
    _sum: { amount: true },
  });
  const ids = groups.map((g) => g.categoryId).filter(Boolean) as string[];
  const cats = await prisma.category.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } });
  const nameById = new Map(cats.map((c) => [c.id, c.name]));
  const out = new Map<string, number>();
  for (const g of groups) {
    if (!g.categoryId) continue;
    const name = nameById.get(g.categoryId);
    if (name) out.set(name, dec(g._sum.amount));
  }
  return out;
}
