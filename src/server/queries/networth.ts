import "server-only";
import { prisma } from "@/lib/prisma";
import { dec } from "@/lib/dates";
import { getPortfolioSummary } from "@/server/queries/investments";
import { listLoans } from "@/server/queries/loans";

export interface NetWorthLine {
  label: string;
  value: number;
}

export interface NetWorthData {
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  assets: NetWorthLine[];
  liabilities: NetWorthLine[];
}

export async function getNetWorth(userId: string): Promise<NetWorthData> {
  const [profile, portfolio, loans] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    getPortfolioSummary(userId),
    listLoans(userId),
  ]);

  const cash = dec(profile?.currentSavings);
  const investments = portfolio.totalCurrent;

  const assets: NetWorthLine[] = [
    { label: "Cash & savings", value: cash },
    { label: "Investments", value: investments },
  ].filter((a) => a.value > 0);

  const liabilities: NetWorthLine[] = loans
    .filter((l) => l.remainingBalance > 0)
    .map((l) => ({ label: l.name, value: l.remainingBalance }));

  const totalAssets = assets.reduce((s, a) => s + a.value, 0);
  const totalLiabilities = liabilities.reduce((s, l) => s + l.value, 0);

  return {
    netWorth: Math.round((totalAssets - totalLiabilities) * 100) / 100,
    totalAssets,
    totalLiabilities,
    assets,
    liabilities,
  };
}
