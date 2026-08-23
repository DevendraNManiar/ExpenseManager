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
