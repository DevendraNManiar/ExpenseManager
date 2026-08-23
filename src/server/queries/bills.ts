import "server-only";
import { prisma } from "@/lib/prisma";
import { dec } from "@/lib/dates";

export interface BillRow {
  id: string;
  name: string;
  category: string | null;
  amount: number;
  dueDate: string;
  isPaid: boolean;
  isRecurring: boolean;
  frequency: string | null;
  notes: string | null;
}

export async function listBills(userId: string): Promise<BillRow[]> {
  const rows = await prisma.bill.findMany({
    where: { userId },
    orderBy: [{ isPaid: "asc" }, { dueDate: "asc" }],
  });
  return rows.map((b) => ({
    id: b.id,
    name: b.name,
    category: b.category,
    amount: dec(b.amount),
    dueDate: b.dueDate.toISOString(),
    isPaid: b.isPaid,
    isRecurring: b.isRecurring,
    frequency: b.frequency,
    notes: b.notes,
  }));
}
