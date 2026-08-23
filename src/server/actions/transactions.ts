"use server";

import { revalidatePath } from "next/cache";
import type { NotificationType, TransactionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { transactionSchema, type TransactionInput } from "@/lib/validations";
import { currentMonthRange, dec, monthRange } from "@/lib/dates";
import { sendEmail, expenseAddedEmail } from "@/lib/email";
import type { ActionResult } from "@/server/types";

const blank = (v?: string | null) => (v && v.trim() !== "" ? v.trim() : null);

function revalidateMoney() {
  for (const p of ["/dashboard", "/expenses", "/income", "/transactions", "/budget"]) {
    revalidatePath(p);
  }
}

function toNotificationType(t: TransactionType): NotificationType {
  switch (t) {
    case "EXPENSE":
      return "EXPENSE";
    case "BILL":
      return "BILL";
    case "EMI":
      return "EMI";
    case "INVESTMENT":
      return "INVESTMENT";
    default:
      return "SYSTEM";
  }
}

export async function createTransaction(input: TransactionInput): Promise<ActionResult> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: "You must be signed in." };
  }

  const parsed = transactionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const d = parsed.data;

  try {
    const tx = await prisma.transaction.create({
      data: {
        userId,
        type: d.type,
        amount: d.amount,
        date: d.date,
        description: blank(d.description),
        merchant: blank(d.merchant),
        source: blank(d.source),
        notes: blank(d.notes),
        tags: d.tags ?? [],
        categoryId: d.categoryId ?? null,
        paymentMethodId: d.paymentMethodId ?? null,
      },
    });

    // Post-create hook — resilient: never let notifications/email break the write.
    await afterTransactionCreated(userId, tx.id).catch((e) =>
      console.error("[afterTransactionCreated]", e),
    );

    revalidateMoney();
    return { ok: true, id: tx.id };
  } catch (error) {
    console.error("[createTransaction]", error);
    return { ok: false, error: "Could not save the transaction. Please try again." };
  }
}

async function afterTransactionCreated(userId: string, txId: string) {
  const tx = await prisma.transaction.findFirst({
    where: { id: txId, userId },
    include: { category: true, paymentMethod: true },
  });
  if (!tx) return;

  const [user, prefs] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, include: { profile: true } }),
    prisma.notificationPreference.findUnique({ where: { userId } }),
  ]);
  const currency = user?.profile?.currency ?? "INR";
  const amount = dec(tx.amount);
  const categoryName = tx.category?.name ?? "Uncategorized";

  // Monthly spend so far (outflow types).
  const { start, end } = currentMonthRange(tx.date);
  const spendAgg = await prisma.transaction.aggregate({
    where: { userId, type: { in: ["EXPENSE", "EMI", "BILL"] }, date: { gte: start, lt: end } },
    _sum: { amount: true },
  });
  const monthlySpend = dec(spendAgg._sum.amount);

  // Remaining budget for this category (if a budget exists this month).
  let remainingBudget: number | null = null;
  let overBudget = false;
  if (tx.categoryId) {
    const bc = await prisma.budgetCategory.findFirst({
      where: {
        categoryId: tx.categoryId,
        budget: { userId, month: tx.date.getMonth() + 1, year: tx.date.getFullYear() },
      },
    });
    if (bc) {
      const { start: bs, end: be } = monthRange(tx.date.getFullYear(), tx.date.getMonth());
      const catSpend = await prisma.transaction.aggregate({
        where: { userId, categoryId: tx.categoryId, type: { in: ["EXPENSE", "EMI", "BILL"] }, date: { gte: bs, lt: be } },
        _sum: { amount: true },
      });
      remainingBudget = dec(bc.limit) - dec(catSpend._sum.amount);
      overBudget = remainingBudget < 0;
    }
  }

  // In-app notification (always, for the notification center).
  const isOutflow = tx.type === "EXPENSE" || tx.type === "EMI" || tx.type === "BILL";
  await prisma.notification.create({
    data: {
      userId,
      type: toNotificationType(tx.type),
      title: `${isOutflow ? "Expense" : tx.type === "INCOME" ? "Income" : "Transaction"} added — ${formatINR(amount, currency)} ${categoryName}`,
      body: tx.description ?? undefined,
      href: "/transactions",
    },
  });

  if (overBudget && prefs?.budgetExceeded) {
    await prisma.notification.create({
      data: { userId, type: "BUDGET", title: `Budget exceeded for ${categoryName}`, href: "/budget" },
    });
  }

  // Email — only when enabled and only for expenses.
  if (!user?.email || !prefs?.emailEnabled || tx.type !== "EXPENSE") return;

  const large = prefs.largeExpenseAlert && amount >= dec(prefs.largeExpenseThreshold);
  if (prefs.expenseAdded || large || (overBudget && prefs.budgetExceeded)) {
    const { subject, html } = expenseAddedEmail({
      amount,
      category: categoryName,
      date: tx.date,
      paymentMethod: tx.paymentMethod?.name,
      description: tx.description ?? undefined,
      monthlySpend,
      remainingBudget,
      currency,
    });
    await sendEmail({ to: user.email, subject: large ? `⚠ Large expense — ${subject}` : subject, html });
  }
}

function formatINR(n: number, currency: string) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
}

export async function updateTransaction(id: string, input: TransactionInput): Promise<ActionResult> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: "You must be signed in." };
  }
  const parsed = transactionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const d = parsed.data;
  try {
    const result = await prisma.transaction.updateMany({
      where: { id, userId }, // ownership enforced
      data: {
        type: d.type,
        amount: d.amount,
        date: d.date,
        description: blank(d.description),
        merchant: blank(d.merchant),
        source: blank(d.source),
        notes: blank(d.notes),
        tags: d.tags ?? [],
        categoryId: d.categoryId ?? null,
        paymentMethodId: d.paymentMethodId ?? null,
      },
    });
    if (result.count === 0) return { ok: false, error: "Transaction not found." };
    revalidateMoney();
    return { ok: true, id };
  } catch (error) {
    console.error("[updateTransaction]", error);
    return { ok: false, error: "Could not update the transaction." };
  }
}

export async function deleteTransaction(id: string): Promise<ActionResult> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: "You must be signed in." };
  }
  try {
    const result = await prisma.transaction.deleteMany({ where: { id, userId } });
    if (result.count === 0) return { ok: false, error: "Transaction not found." };
    revalidateMoney();
    return { ok: true, id };
  } catch (error) {
    console.error("[deleteTransaction]", error);
    return { ok: false, error: "Could not delete the transaction." };
  }
}
