/** Month/range helpers used across queries. */

export function monthRange(year: number, monthIndex0: number): { start: Date; end: Date } {
  // monthIndex0 is 0-based (0 = January).
  const start = new Date(year, monthIndex0, 1);
  const end = new Date(year, monthIndex0 + 1, 1);
  return { start, end };
}

export function currentMonthRange(now = new Date()) {
  return monthRange(now.getFullYear(), now.getMonth());
}

export function previousMonthRange(now = new Date()) {
  return monthRange(now.getFullYear(), now.getMonth() - 1);
}

/** Convert a Prisma Decimal (or null) to a plain JS number for the client. */
export function dec(value: unknown): number {
  if (value == null) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export type Frequency = "DAILY" | "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";

/** Advance a date by one period of the given frequency (immutably). */
export function advanceDate(date: Date, frequency: Frequency): Date {
  const d = new Date(date);
  switch (frequency) {
    case "DAILY":
      d.setDate(d.getDate() + 1);
      break;
    case "WEEKLY":
      d.setDate(d.getDate() + 7);
      break;
    case "MONTHLY":
      d.setMonth(d.getMonth() + 1);
      break;
    case "QUARTERLY":
      d.setMonth(d.getMonth() + 3);
      break;
    case "YEARLY":
      d.setFullYear(d.getFullYear() + 1);
      break;
  }
  return d;
}
