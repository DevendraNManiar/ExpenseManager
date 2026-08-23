import "server-only";
import { prisma } from "@/lib/prisma";
import { dec, monthRange } from "@/lib/dates";

export interface BudgetLine {
  categoryId: string;
  name: string;
  color: string | null;
  limit: number;
  spent: number;
  remaining: number;
  pct: number;
}

export interface BudgetView {
  month: number;
  year: number;
  lines: BudgetLine[]; // every expense-ish category, budgeted or not
  totalLimit: number;
  totalSpent: number;
  hasBudget: boolean;
}

const BUDGETABLE = ["EXPENSE", "EMI", "BILL"] as const;

export async function getBudgetView(
  userId: string,
  month: number, // 1-12
  year: number,
): Promise<BudgetView> {
  const { start, end } = monthRange(year, month - 1);

  const [categories, budget, spendGroups] = await Promise.all([
    prisma.category.findMany({
      where: { userId, type: { in: [...BUDGETABLE] } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, color: true },
    }),
    prisma.budget.findUnique({
      where: { userId_month_year: { userId, month, year } },
      include: { categories: true },
    }),
    prisma.transaction.groupBy({
      by: ["categoryId"],
      where: { userId, type: { in: [...BUDGETABLE] }, date: { gte: start, lt: end } },
      _sum: { amount: true },
    }),
  ]);

  const limitByCat = new Map((budget?.categories ?? []).map((bc) => [bc.categoryId, dec(bc.limit)]));
  const spentByCat = new Map(spendGroups.map((g) => [g.categoryId, dec(g._sum.amount)]));

  const lines: BudgetLine[] = categories.map((c) => {
    const limit = limitByCat.get(c.id) ?? 0;
    const spent = spentByCat.get(c.id) ?? 0;
    return {
      categoryId: c.id,
      name: c.name,
      color: c.color,
      limit,
      spent,
      remaining: limit - spent,
      pct: limit > 0 ? Math.round((spent / limit) * 100) : 0,
    };
  });

  return {
    month,
    year,
    lines,
    totalLimit: lines.reduce((s, l) => s + l.limit, 0),
    totalSpent: lines.reduce((s, l) => s + l.spent, 0),
    hasBudget: Boolean(budget),
  };
}
