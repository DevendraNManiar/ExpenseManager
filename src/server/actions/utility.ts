"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { utilityReadingSchema, type UtilityReadingInput } from "@/lib/validations";
import { calculateElectricity } from "@/lib/finance";
import type { ActionResult } from "@/server/types";

function computeFields(d: UtilityReadingInput) {
  const calc = calculateElectricity({
    previousReading: d.previousReading,
    currentReading: d.currentReading,
    unitRate: d.unitRate,
    fixedCharges: d.fixedCharges,
    taxes: d.taxes,
  });
  return {
    type: d.type,
    label: d.label && d.label.trim() !== "" ? d.label.trim() : null,
    month: d.month,
    year: d.year,
    readingDate: d.readingDate,
    previousReading: d.previousReading,
    currentReading: d.currentReading,
    unitsUsed: calc.unitsUsed,
    unitRate: d.unitRate,
    fixedCharges: d.fixedCharges,
    taxes: d.taxes,
    estimatedBill: calc.estimatedBill,
    notes: d.notes && d.notes.trim() !== "" ? d.notes.trim() : null,
  };
}

export async function createReading(input: UtilityReadingInput): Promise<ActionResult> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: "You must be signed in." };
  }
  const parsed = utilityReadingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  try {
    const reading = await prisma.utilityReading.create({
      data: { userId, ...computeFields(parsed.data) },
    });
    revalidatePath("/utilities");
    revalidatePath("/dashboard");
    return { ok: true, id: reading.id };
  } catch (error) {
    console.error("[createReading]", error);
    return { ok: false, error: "Could not save the reading." };
  }
}

export async function updateReading(id: string, input: UtilityReadingInput): Promise<ActionResult> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: "You must be signed in." };
  }
  const parsed = utilityReadingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  try {
    const result = await prisma.utilityReading.updateMany({
      where: { id, userId },
      data: computeFields(parsed.data),
    });
    if (result.count === 0) return { ok: false, error: "Reading not found." };
    revalidatePath("/utilities");
    return { ok: true, id };
  } catch (error) {
    console.error("[updateReading]", error);
    return { ok: false, error: "Could not update the reading." };
  }
}

export async function deleteReading(id: string): Promise<ActionResult> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: "You must be signed in." };
  }
  try {
    const result = await prisma.utilityReading.deleteMany({ where: { id, userId } });
    if (result.count === 0) return { ok: false, error: "Reading not found." };
    revalidatePath("/utilities");
    return { ok: true, id };
  } catch (error) {
    console.error("[deleteReading]", error);
    return { ok: false, error: "Could not delete the reading." };
  }
}
