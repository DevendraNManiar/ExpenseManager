"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { dec } from "@/lib/dates";
import { formatCurrency } from "@/lib/format";

export interface SearchItem {
  id: string;
  label: string;
  sub?: string;
  href: string;
}
export interface SearchGroup {
  group: string;
  items: SearchItem[];
}

const contains = (q: string) => ({ contains: q, mode: "insensitive" as const });

/** Search across every module, scoped to the signed-in user (spec §42). */
export async function searchAll(query: string): Promise<SearchGroup[]> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return [];
  }
  const q = query.trim();
  if (q.length < 2) return [];

  const [txns, investments, loans, bills, goals, ipos] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId, OR: [{ description: contains(q) }, { merchant: contains(q) }, { source: contains(q) }] },
      orderBy: { date: "desc" },
      take: 6,
      include: { category: { select: { name: true } } },
    }),
    prisma.investment.findMany({ where: { userId, name: contains(q) }, take: 4 }),
    prisma.loan.findMany({ where: { userId, name: contains(q) }, take: 4 }),
    prisma.bill.findMany({ where: { userId, name: contains(q) }, take: 4 }),
    prisma.financialGoal.findMany({ where: { userId, name: contains(q) }, take: 4 }),
    prisma.ipo.findMany({ where: { userId, OR: [{ companyName: contains(q) }, { ipoName: contains(q) }] }, take: 4 }),
  ]);

  const groups: SearchGroup[] = [];

  if (txns.length)
    groups.push({
      group: "Transactions",
      items: txns.map((t) => ({
        id: t.id,
        label: t.description || t.merchant || t.source || t.category?.name || "Transaction",
        sub: `${formatCurrency(dec(t.amount))} · ${new Date(t.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`,
        href: "/transactions",
      })),
    });
  if (investments.length)
    groups.push({ group: "Investments", items: investments.map((i) => ({ id: i.id, label: i.name, sub: formatCurrency(dec(i.amountInvested)), href: "/investments" })) });
  if (loans.length)
    groups.push({ group: "Loans", items: loans.map((l) => ({ id: l.id, label: l.name, sub: `EMI ${formatCurrency(dec(l.emiAmount))}`, href: `/loans/${l.id}` })) });
  if (bills.length)
    groups.push({ group: "Bills", items: bills.map((b) => ({ id: b.id, label: b.name, sub: formatCurrency(dec(b.amount)), href: "/utilities" })) });
  if (goals.length)
    groups.push({ group: "Goals", items: goals.map((g) => ({ id: g.id, label: g.name, sub: `${formatCurrency(dec(g.currentAmount))} / ${formatCurrency(dec(g.targetAmount))}`, href: "/goals" })) });
  if (ipos.length)
    groups.push({ group: "IPOs", items: ipos.map((i) => ({ id: i.id, label: i.ipoName || i.companyName, sub: i.status, href: "/ipos" })) });

  return groups;
}
