"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { budgetSchema, type BudgetInput } from "@/lib/validations";
import type { ActionResult } from "@/server/types";

export async function upsertBudget(input: BudgetInput): Promise<ActionResult> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: "You must be signed in." };
  }

  const parsed = budgetSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid budget.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const { month, year, items } = parsed.data;

  try {
    // Verify all categories belong to the user (data isolation).
    const owned = await prisma.category.findMany({
      where: { userId, id: { in: items.map((i) => i.categoryId) } },
      select: { id: true },
    });
    const ownedIds = new Set(owned.map((c) => c.id));
    const validItems = items.filter((i) => ownedIds.has(i.categoryId));

    await prisma.$transaction(async (tx) => {
      const budget = await tx.budget.upsert({
        where: { userId_month_year: { userId, month, year } },
        update: {},
        create: { userId, month, year },
      });
      await tx.budgetCategory.deleteMany({ where: { budgetId: budget.id } });
      if (validItems.length) {
        await tx.budgetCategory.createMany({
          data: validItems.map((i) => ({ budgetId: budget.id, categoryId: i.categoryId, limit: i.limit })),
        });
      }
    });

    revalidatePath("/budget");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (error) {
    console.error("[upsertBudget]", error);
    return { ok: false, error: "Could not save the budget." };
  }
}
