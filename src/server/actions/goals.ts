"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { goalSchema, contributionSchema, type GoalInput } from "@/lib/validations";
import type { ActionResult } from "@/server/types";

function toData(d: GoalInput) {
  return {
    name: d.name,
    targetAmount: d.targetAmount,
    currentAmount: d.currentAmount,
    targetDate: d.targetDate ?? null,
    monthlyContribution: d.monthlyContribution ?? null,
    color: d.color && d.color.trim() !== "" ? d.color.trim() : null,
  };
}

function revalidate() {
  revalidatePath("/goals");
  revalidatePath("/dashboard");
}

export async function createGoal(input: GoalInput): Promise<ActionResult> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: "You must be signed in." };
  }
  const parsed = goalSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  try {
    const goal = await prisma.financialGoal.create({ data: { userId, ...toData(parsed.data) } });
    revalidate();
    return { ok: true, id: goal.id };
  } catch (error) {
    console.error("[createGoal]", error);
    return { ok: false, error: "Could not create the goal." };
  }
}

export async function updateGoal(id: string, input: GoalInput): Promise<ActionResult> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: "You must be signed in." };
  }
  const parsed = goalSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  try {
    const res = await prisma.financialGoal.updateMany({ where: { id, userId }, data: toData(parsed.data) });
    if (res.count === 0) return { ok: false, error: "Goal not found." };
    revalidate();
    return { ok: true, id };
  } catch (error) {
    console.error("[updateGoal]", error);
    return { ok: false, error: "Could not update the goal." };
  }
}

export async function addContribution(input: { goalId: string; amount: number }): Promise<ActionResult> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: "You must be signed in." };
  }
  const parsed = contributionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Enter a valid amount." };
  }
  try {
    // Ownership check + atomic increment.
    const goal = await prisma.financialGoal.findFirst({ where: { id: parsed.data.goalId, userId } });
    if (!goal) return { ok: false, error: "Goal not found." };

    const updated = await prisma.financialGoal.update({
      where: { id: goal.id },
      data: { currentAmount: { increment: parsed.data.amount } },
    });
    // Mark completed if reached.
    if (Number(updated.currentAmount) >= Number(updated.targetAmount) && updated.status !== "COMPLETED") {
      await prisma.financialGoal.update({ where: { id: goal.id }, data: { status: "COMPLETED" } });
    }
    revalidate();
    return { ok: true, id: goal.id };
  } catch (error) {
    console.error("[addContribution]", error);
    return { ok: false, error: "Could not add the contribution." };
  }
}

export async function deleteGoal(id: string): Promise<ActionResult> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: "You must be signed in." };
  }
  try {
    const res = await prisma.financialGoal.deleteMany({ where: { id, userId } });
    if (res.count === 0) return { ok: false, error: "Goal not found." };
    revalidate();
    return { ok: true, id };
  } catch (error) {
    console.error("[deleteGoal]", error);
    return { ok: false, error: "Could not delete the goal." };
  }
}
