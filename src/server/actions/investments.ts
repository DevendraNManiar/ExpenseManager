"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { investmentSchema, type InvestmentInput } from "@/lib/validations";
import type { ActionResult } from "@/server/types";

const blank = (v?: string | null) => (v && v.trim() !== "" ? v.trim() : null);

function toData(d: InvestmentInput) {
  return {
    name: d.name,
    type: d.type,
    amountInvested: d.amountInvested,
    quantity: d.quantity ?? null,
    purchasePrice: d.purchasePrice ?? null,
    purchaseDate: d.purchaseDate,
    currentValue: d.currentValue ?? null,
    expectedReturn: d.expectedReturn ?? null,
    platform: blank(d.platform),
    notes: blank(d.notes),
  };
}

export async function createInvestment(input: InvestmentInput): Promise<ActionResult> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: "You must be signed in." };
  }
  const parsed = investmentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  try {
    const inv = await prisma.investment.create({ data: { userId, ...toData(parsed.data) } });
    revalidatePath("/investments");
    revalidatePath("/dashboard");
    return { ok: true, id: inv.id };
  } catch (error) {
    console.error("[createInvestment]", error);
    return { ok: false, error: "Could not save the investment." };
  }
}

export async function updateInvestment(id: string, input: InvestmentInput): Promise<ActionResult> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: "You must be signed in." };
  }
  const parsed = investmentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  try {
    const res = await prisma.investment.updateMany({ where: { id, userId }, data: toData(parsed.data) });
    if (res.count === 0) return { ok: false, error: "Investment not found." };
    revalidatePath("/investments");
    return { ok: true, id };
  } catch (error) {
    console.error("[updateInvestment]", error);
    return { ok: false, error: "Could not update the investment." };
  }
}

export async function deleteInvestment(id: string): Promise<ActionResult> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: "You must be signed in." };
  }
  try {
    const res = await prisma.investment.deleteMany({ where: { id, userId } });
    if (res.count === 0) return { ok: false, error: "Investment not found." };
    revalidatePath("/investments");
    return { ok: true, id };
  } catch (error) {
    console.error("[deleteInvestment]", error);
    return { ok: false, error: "Could not delete the investment." };
  }
}
