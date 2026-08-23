import "server-only";
import type { Prisma, TransactionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { dec } from "@/lib/dates";

export interface TransactionRow {
  id: string;
  type: TransactionType;
  amount: number;
  date: string; // ISO
  description: string | null;
  merchant: string | null;
  source: string | null;
  notes: string | null;
  tags: string[];
  category: { id: string; name: string; color: string | null } | null;
  paymentMethod: { id: string; name: string } | null;
}

export interface ListParams {
  type?: TransactionType | "ALL";
  search?: string;
  categoryId?: string;
  from?: Date;
  to?: Date;
  sort?: "date_desc" | "date_asc" | "amount_desc" | "amount_asc";
  page?: number;
  pageSize?: number;
}

export async function listTransactions(userId: string, params: ListParams = {}) {
  const {
    type = "ALL",
    search,
    categoryId,
    from,
    to,
    sort = "date_desc",
    page = 1,
    pageSize = 20,
  } = params;

  const where: Prisma.TransactionWhereInput = { userId };
  if (type && type !== "ALL") where.type = type;
  if (categoryId) where.categoryId = categoryId;
  if (from || to) where.date = { ...(from && { gte: from }), ...(to && { lt: to }) };
  if (search?.trim()) {
    where.OR = [
      { description: { contains: search, mode: "insensitive" } },
      { merchant: { contains: search, mode: "insensitive" } },
      { source: { contains: search, mode: "insensitive" } },
    ];
  }

  const orderBy: Prisma.TransactionOrderByWithRelationInput =
    sort === "date_asc"
      ? { date: "asc" }
      : sort === "amount_desc"
        ? { amount: "desc" }
        : sort === "amount_asc"
          ? { amount: "asc" }
          : { date: "desc" };

  const [total, rows] = await Promise.all([
    prisma.transaction.count({ where }),
    prisma.transaction.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        category: { select: { id: true, name: true, color: true } },
        paymentMethod: { select: { id: true, name: true } },
      },
    }),
  ]);

  const data: TransactionRow[] = rows.map((t) => ({
    id: t.id,
    type: t.type,
    amount: dec(t.amount),
    date: t.date.toISOString(),
    description: t.description,
    merchant: t.merchant,
    source: t.source,
    notes: t.notes,
    tags: t.tags,
    category: t.category,
    paymentMethod: t.paymentMethod,
  }));

  return { data, total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

/** Summary totals for the expenses/income landing headers. */
export async function typeTotals(userId: string, type: TransactionType, from: Date, to: Date) {
  const agg = await prisma.transaction.aggregate({
    where: { userId, type, date: { gte: from, lt: to } },
    _sum: { amount: true },
    _count: true,
  });
  return { total: dec(agg._sum.amount), count: agg._count };
}
