import "server-only";
import type { InvestmentType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { dec } from "@/lib/dates";

export interface InvestmentRow {
  id: string;
  name: string;
  type: InvestmentType;
  amountInvested: number;
  quantity: number | null;
  purchasePrice: number | null;
  purchaseDate: string;
  currentValue: number; // falls back to amountInvested when unset
  platform: string | null;
  notes: string | null;
  pl: number;
  roiPct: number;
}

export interface PortfolioSummary {
  totalInvested: number;
  totalCurrent: number;
  totalPL: number;
  roiPct: number;
  allocation: { name: string; value: number; color: string }[];
}

const TYPE_LABEL: Record<InvestmentType, string> = {
  STOCK: "Stocks",
  MUTUAL_FUND: "Mutual Funds",
  ETF: "ETFs",
  IPO: "IPOs",
  FIXED_DEPOSIT: "Fixed Deposits",
  GOLD: "Gold",
  CRYPTO: "Crypto",
  OTHER: "Other",
};
const TYPE_COLOR: Record<InvestmentType, string> = {
  STOCK: "#10b981", MUTUAL_FUND: "#0ea5e9", ETF: "#6366f1", IPO: "#a855f7",
  FIXED_DEPOSIT: "#f59e0b", GOLD: "#eab308", CRYPTO: "#ec4899", OTHER: "#64748b",
};

export async function listInvestments(userId: string): Promise<InvestmentRow[]> {
  const rows = await prisma.investment.findMany({ where: { userId }, orderBy: { purchaseDate: "desc" } });
  return rows.map((i) => {
    const invested = dec(i.amountInvested);
    const current = i.currentValue == null ? invested : dec(i.currentValue);
    const pl = Math.round((current - invested) * 100) / 100;
    return {
      id: i.id,
      name: i.name,
      type: i.type,
      amountInvested: invested,
      quantity: i.quantity == null ? null : dec(i.quantity),
      purchasePrice: i.purchasePrice == null ? null : dec(i.purchasePrice),
      purchaseDate: i.purchaseDate.toISOString(),
      currentValue: current,
      platform: i.platform,
      notes: i.notes,
      pl,
      roiPct: invested > 0 ? Math.round((pl / invested) * 1000) / 10 : 0,
    };
  });
}

export async function getPortfolioSummary(userId: string): Promise<PortfolioSummary> {
  const rows = await listInvestments(userId);
  const totalInvested = rows.reduce((s, r) => s + r.amountInvested, 0);
  const totalCurrent = rows.reduce((s, r) => s + r.currentValue, 0);
  const totalPL = Math.round((totalCurrent - totalInvested) * 100) / 100;

  const byType = new Map<InvestmentType, number>();
  for (const r of rows) byType.set(r.type, (byType.get(r.type) ?? 0) + r.currentValue);
  const allocation = [...byType.entries()]
    .map(([type, value]) => ({ name: TYPE_LABEL[type], value, color: TYPE_COLOR[type] }))
    .sort((a, b) => b.value - a.value);

  return {
    totalInvested,
    totalCurrent,
    totalPL,
    roiPct: totalInvested > 0 ? Math.round((totalPL / totalInvested) * 1000) / 10 : 0,
    allocation,
  };
}
