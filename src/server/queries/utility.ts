import "server-only";
import { prisma } from "@/lib/prisma";
import { dec, MONTH_LABELS } from "@/lib/dates";

export interface ReadingRow {
  id: string;
  type: string;
  label: string | null;
  month: number;
  year: number;
  readingDate: string;
  previousReading: number;
  currentReading: number;
  unitsUsed: number;
  unitRate: number;
  fixedCharges: number;
  taxes: number;
  estimatedBill: number;
  notes: string | null;
}

function toRow(r: {
  id: string; type: string; label: string | null; month: number; year: number;
  readingDate: Date; previousReading: unknown; currentReading: unknown; unitsUsed: unknown;
  unitRate: unknown; fixedCharges: unknown; taxes: unknown; estimatedBill: unknown; notes: string | null;
}): ReadingRow {
  return {
    id: r.id, type: r.type, label: r.label, month: r.month, year: r.year,
    readingDate: r.readingDate.toISOString(),
    previousReading: dec(r.previousReading), currentReading: dec(r.currentReading),
    unitsUsed: dec(r.unitsUsed), unitRate: dec(r.unitRate),
    fixedCharges: dec(r.fixedCharges), taxes: dec(r.taxes),
    estimatedBill: dec(r.estimatedBill), notes: r.notes,
  };
}

export async function listReadings(userId: string, type = "electricity"): Promise<ReadingRow[]> {
  const rows = await prisma.utilityReading.findMany({
    where: { userId, type },
    orderBy: [{ year: "desc" }, { month: "desc" }, { readingDate: "desc" }],
  });
  return rows.map(toRow);
}

/** Latest reading — used to pre-fill "previous reading" next month (spec §45). */
export async function getLastReading(userId: string, type = "electricity"): Promise<ReadingRow | null> {
  const r = await prisma.utilityReading.findFirst({
    where: { userId, type },
    orderBy: [{ year: "desc" }, { month: "desc" }, { readingDate: "desc" }],
  });
  return r ? toRow(r) : null;
}

export interface ElectricityStats {
  series: { label: string; units: number; cost: number }[];
  avgUnits: number;
  avgBill: number;
  highest: { label: string; units: number } | null;
  lowest: { label: string; units: number } | null;
  estimatedNextBill: number | null;
  count: number;
}

export async function getElectricityStats(userId: string, type = "electricity"): Promise<ElectricityStats> {
  const rows = await listReadings(userId, type);
  if (rows.length === 0) {
    return { series: [], avgUnits: 0, avgBill: 0, highest: null, lowest: null, estimatedNextBill: null, count: 0 };
  }
  // Oldest → newest for the chart.
  const ordered = [...rows].reverse();
  const series = ordered.map((r) => ({
    label: `${MONTH_LABELS[r.month - 1]} ${String(r.year).slice(2)}`,
    units: r.unitsUsed,
    cost: r.estimatedBill,
  }));

  const avgUnits = Math.round(rows.reduce((s, r) => s + r.unitsUsed, 0) / rows.length);
  const avgBill = Math.round(rows.reduce((s, r) => s + r.estimatedBill, 0) / rows.length);

  const byUnits = [...rows].sort((a, b) => b.unitsUsed - a.unitsUsed);
  const highest = { label: `${MONTH_LABELS[byUnits[0].month - 1]} ${byUnits[0].year}`, units: byUnits[0].unitsUsed };
  const low = byUnits[byUnits.length - 1];
  const lowest = { label: `${MONTH_LABELS[low.month - 1]} ${low.year}`, units: low.unitsUsed };

  // Estimate next bill = avg consumption × latest rate + latest fixed + taxes.
  const latest = rows[0];
  const estimatedNextBill = Math.round(avgUnits * latest.unitRate + latest.fixedCharges + latest.taxes);

  return { series, avgUnits, avgBill, highest, lowest, estimatedNextBill, count: rows.length };
}
