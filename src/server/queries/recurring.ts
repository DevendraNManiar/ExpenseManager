import "server-only";
import { prisma } from "@/lib/prisma";
import { dec } from "@/lib/dates";

export interface RecurringRow {
  id: string;
  type: string;
  name: string;
  amount: number;
  categoryName: string | null;
  frequency: string;
  startDate: string;
  endDate: string | null;
  nextRunDate: string;
  isActive: boolean;
  notes: string | null;
}

export async function listRecurring(userId: string): Promise<RecurringRow[]> {
  const rows = await prisma.recurringTransaction.findMany({
    where: { userId },
    orderBy: [{ isActive: "desc" }, { nextRunDate: "asc" }],
  });
  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    name: r.name,
    amount: dec(r.amount),
    categoryName: r.categoryName,
    frequency: r.frequency,
    startDate: r.startDate.toISOString(),
    endDate: r.endDate?.toISOString() ?? null,
    nextRunDate: r.nextRunDate.toISOString(),
    isActive: r.isActive,
    notes: r.notes,
  }));
}

export async function countDueRecurring(userId: string, now = new Date()): Promise<number> {
  return prisma.recurringTransaction.count({
    where: { userId, isActive: true, nextRunDate: { lte: now } },
  });
}
