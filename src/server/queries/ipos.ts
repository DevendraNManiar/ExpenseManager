import "server-only";
import type { IpoStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { dec } from "@/lib/dates";

export interface IpoRow {
  id: string;
  companyName: string;
  ipoName: string | null;
  openDate: string | null;
  closeDate: string | null;
  listingDate: string | null;
  priceBandLow: number | null;
  priceBandHigh: number | null;
  lotSize: number | null;
  lots: number;
  amountApplied: number | null;
  status: IpoStatus;
  listingPrice: number | null;
  currentPrice: number | null;
  notes: string | null;
  shares: number;
  applicationAmount: number;
  pl: number | null;
  roiPct: number | null;
}

const GAIN_STATUSES: IpoStatus[] = ["ALLOTTED", "LISTED", "SOLD"];

export async function listIpos(userId: string): Promise<IpoRow[]> {
  const rows = await prisma.ipo.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });

  return rows.map((i) => {
    const lotSize = i.lotSize ?? 0;
    const shares = i.lots * lotSize;
    const bandHigh = i.priceBandHigh == null ? null : dec(i.priceBandHigh);
    const applicationAmount = i.amountApplied != null ? dec(i.amountApplied) : bandHigh ? shares * bandHigh : 0;
    const ref = i.currentPrice != null ? dec(i.currentPrice) : i.listingPrice != null ? dec(i.listingPrice) : null;

    let pl: number | null = null;
    let roiPct: number | null = null;
    if (ref != null && bandHigh != null && shares > 0 && GAIN_STATUSES.includes(i.status)) {
      pl = Math.round((ref - bandHigh) * shares * 100) / 100;
      const cost = bandHigh * shares;
      roiPct = cost > 0 ? Math.round((pl / cost) * 1000) / 10 : null;
    }

    return {
      id: i.id,
      companyName: i.companyName,
      ipoName: i.ipoName,
      openDate: i.openDate?.toISOString() ?? null,
      closeDate: i.closeDate?.toISOString() ?? null,
      listingDate: i.listingDate?.toISOString() ?? null,
      priceBandLow: i.priceBandLow == null ? null : dec(i.priceBandLow),
      priceBandHigh: bandHigh,
      lotSize: i.lotSize,
      lots: i.lots,
      amountApplied: i.amountApplied == null ? null : dec(i.amountApplied),
      status: i.status,
      listingPrice: i.listingPrice == null ? null : dec(i.listingPrice),
      currentPrice: i.currentPrice == null ? null : dec(i.currentPrice),
      notes: i.notes,
      shares,
      applicationAmount: Math.round(applicationAmount * 100) / 100,
      pl,
      roiPct,
    };
  });
}

export interface IpoSummary {
  total: number;
  applied: number;
  totalApplied: number;
  realizedPL: number;
}

export async function getIpoSummary(userId: string): Promise<IpoSummary> {
  const rows = await listIpos(userId);
  return {
    total: rows.length,
    applied: rows.filter((r) => r.status !== "PLANNING").length,
    totalApplied: rows.reduce((s, r) => s + r.applicationAmount, 0),
    realizedPL: rows.reduce((s, r) => s + (r.pl ?? 0), 0),
  };
}
