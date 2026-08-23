"use server";

import { revalidatePath } from "next/cache";
import type { TransactionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { recurringSchema, type RecurringInput } from "@/lib/validations";
import { advanceDate, type Frequency } from "@/lib/dates";
import type { ActionResult } from "@/server/types";

const blank = (v?: string | null) => (v && v.trim() !== "" ? v.trim() : null);

function revalidate() {
  for (const p of ["/calendar", "/dashboard", "/transactions"]) revalidatePath(p);
}

export async function createRecurring(input: RecurringInput): Promise<ActionResult> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: "You must be signed in." };
  }
  const parsed = recurringSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const d = parsed.data;
  try {
    const rec = await prisma.recurringTransaction.create({
      data: {
        userId,
        type: d.type,
        name: d.name,
        amount: d.amount,
        categoryName: blank(d.categoryName),
        frequency: d.frequency,
        startDate: d.startDate,
        endDate: d.endDate ?? null,
        nextRunDate: d.startDate, // first run is the start date
        notes: blank(d.notes),
      },
    });
    revalidate();
    return { ok: true, id: rec.id };
  } catch (error) {
    console.error("[createRecurring]", error);
    return { ok: false, error: "Could not create the recurring rule." };
  }
}

export async function toggleRecurring(id: string, isActive: boolean): Promise<ActionResult> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: "You must be signed in." };
  }
  try {
    const res = await prisma.recurringTransaction.updateMany({ where: { id, userId }, data: { isActive } });
    if (res.count === 0) return { ok: false, error: "Rule not found." };
    revalidate();
    return { ok: true, id };
  } catch (error) {
    console.error("[toggleRecurring]", error);
    return { ok: false, error: "Could not update the rule." };
  }
}

export async function deleteRecurring(id: string): Promise<ActionResult> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: "You must be signed in." };
  }
  try {
    const res = await prisma.recurringTransaction.deleteMany({ where: { id, userId } });
    if (res.count === 0) return { ok: false, error: "Rule not found." };
    revalidate();
    return { ok: true, id };
  } catch (error) {
    console.error("[deleteRecurring]", error);
    return { ok: false, error: "Could not delete the rule." };
  }
}

/**
 * Materialize all due occurrences into real transactions and advance each
 * rule's nextRunDate. Idempotent per day — safe to click repeatedly.
 */
export async function runDueRecurring(): Promise<ActionResult & { generated?: number }> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: "You must be signed in." };
  }
  const now = new Date();
  try {
    const due = await prisma.recurringTransaction.findMany({
      where: { userId, isActive: true, nextRunDate: { lte: now } },
    });

    // Resolve category names to ids once.
    const categories = await prisma.category.findMany({ where: { userId }, select: { id: true, name: true } });
    const catByName = new Map(categories.map((c) => [c.name.toLowerCase(), c.id]));

    let generated = 0;
    for (const rule of due) {
      let next = rule.nextRunDate;
      const guardEnd = rule.endDate ?? null;
      const toCreate: { date: Date }[] = [];
      // Catch up all missed periods up to today.
      while (next <= now && (!guardEnd || next <= guardEnd)) {
        toCreate.push({ date: new Date(next) });
        next = advanceDate(next, rule.frequency as Frequency);
      }
      if (toCreate.length === 0) continue;

      await prisma.$transaction(async (tx) => {
        await tx.transaction.createMany({
          data: toCreate.map((o) => ({
            userId,
            type: rule.type as TransactionType,
            amount: rule.amount,
            date: o.date,
            description: rule.name,
            source: rule.type === "INCOME" ? rule.name : null,
            categoryId: rule.categoryName ? (catByName.get(rule.categoryName.toLowerCase()) ?? null) : null,
            recurringId: rule.id,
          })),
        });
        const stillActive = !guardEnd || next <= guardEnd;
        await tx.recurringTransaction.update({
          where: { id: rule.id },
          data: { nextRunDate: next, isActive: stillActive },
        });
      });
      generated += toCreate.length;
    }

    for (const p of ["/calendar", "/dashboard", "/transactions", "/expenses", "/income"]) revalidatePath(p);
    return { ok: true, generated };
  } catch (error) {
    console.error("[runDueRecurring]", error);
    return { ok: false, error: "Could not generate due transactions." };
  }
}
