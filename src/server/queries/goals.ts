import "server-only";
import { prisma } from "@/lib/prisma";
import { dec } from "@/lib/dates";
import { projectGoal } from "@/lib/finance";

export interface GoalRow {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string | null;
  monthlyContribution: number | null;
  color: string | null;
  status: string;
  progressPct: number;
  remaining: number;
  requiredMonthly: number | null;
  monthsToTarget: number | null;
  estimatedCompletion: string | null;
}

export async function listGoals(userId: string): Promise<GoalRow[]> {
  const rows = await prisma.financialGoal.findMany({
    where: { userId },
    orderBy: [{ status: "asc" }, { createdAt: "asc" }],
  });

  const now = new Date();
  return rows.map((g) => {
    const targetAmount = dec(g.targetAmount);
    const currentAmount = dec(g.currentAmount);
    const targetDate = g.targetDate ?? null;
    const proj = projectGoal({ targetAmount, currentAmount, targetDate, now });

    // Estimated completion from monthly contribution (if no target date).
    let estimatedCompletion: string | null = null;
    const monthly = g.monthlyContribution ? dec(g.monthlyContribution) : null;
    if (proj.remaining > 0 && monthly && monthly > 0) {
      const months = Math.ceil(proj.remaining / monthly);
      const d = new Date(now.getFullYear(), now.getMonth() + months, 1);
      estimatedCompletion = d.toISOString();
    } else if (proj.remaining <= 0) {
      estimatedCompletion = now.toISOString();
    }

    return {
      id: g.id,
      name: g.name,
      targetAmount,
      currentAmount,
      targetDate: targetDate?.toISOString() ?? null,
      monthlyContribution: monthly,
      color: g.color,
      status: currentAmount >= targetAmount ? "COMPLETED" : g.status,
      progressPct: proj.progressPct,
      remaining: proj.remaining,
      requiredMonthly: proj.requiredMonthly,
      monthsToTarget: proj.monthsToTarget,
      estimatedCompletion,
    };
  });
}
