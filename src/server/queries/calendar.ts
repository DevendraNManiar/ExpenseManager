import "server-only";
import { prisma } from "@/lib/prisma";
import { dec, monthRange, advanceDate, type Frequency } from "@/lib/dates";

export type EventType = "BILL" | "EMI" | "RECURRING" | "GOAL";

export interface CalendarEvent {
  date: string; // ISO
  day: number;
  title: string;
  amount: number | null;
  type: EventType;
}

export async function getCalendarEvents(
  userId: string,
  month: number, // 1-12
  year: number,
): Promise<CalendarEvent[]> {
  const { start, end } = monthRange(year, month - 1);

  const [bills, loanPayments, recurring, goals] = await Promise.all([
    prisma.bill.findMany({ where: { userId, dueDate: { gte: start, lt: end } } }),
    prisma.loanPayment.findMany({
      where: { loan: { userId }, dueDate: { gte: start, lt: end } },
      include: { loan: { select: { name: true } } },
    }),
    prisma.recurringTransaction.findMany({ where: { userId, isActive: true } }),
    prisma.financialGoal.findMany({ where: { userId, targetDate: { gte: start, lt: end } } }),
  ]);

  const events: CalendarEvent[] = [];

  for (const b of bills) {
    events.push({ date: b.dueDate.toISOString(), day: b.dueDate.getDate(), title: b.name, amount: dec(b.amount), type: "BILL" });
  }
  for (const p of loanPayments) {
    events.push({ date: p.dueDate.toISOString(), day: p.dueDate.getDate(), title: `${p.loan.name} EMI`, amount: dec(p.emiAmount), type: "EMI" });
  }
  for (const g of goals) {
    if (g.targetDate) events.push({ date: g.targetDate.toISOString(), day: g.targetDate.getDate(), title: `${g.name} target`, amount: dec(g.targetAmount), type: "GOAL" });
  }

  // Project recurring occurrences that fall inside the month.
  for (const r of recurring) {
    let next = new Date(r.startDate);
    let guard = 0;
    while (next < start && guard < 4000) {
      next = advanceDate(next, r.frequency as Frequency);
      guard++;
    }
    while (next < end && guard < 4400) {
      if ((!r.endDate || next <= r.endDate) && next >= start) {
        events.push({ date: next.toISOString(), day: next.getDate(), title: r.name, amount: dec(r.amount), type: "RECURRING" });
      }
      next = advanceDate(next, r.frequency as Frequency);
      guard++;
    }
  }

  return events.sort((a, b) => a.day - b.day);
}
