"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { billSchema, type BillInput } from "@/lib/validations";
import type { ActionResult } from "@/server/types";

const blank = (v?: string | null) => (v && v.trim() !== "" ? v.trim() : null);

function toData(d: BillInput) {
  return {
    name: d.name,
    category: blank(d.category),
    amount: d.amount,
    dueDate: d.dueDate,
    isRecurring: d.isRecurring,
    frequency: d.isRecurring ? (d.frequency ?? "MONTHLY") : null,
    notes: blank(d.notes),
  };
}

export async function createBill(input: BillInput): Promise<ActionResult> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: "You must be signed in." };
  }
  const parsed = billSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  try {
    const bill = await prisma.bill.create({ data: { userId, ...toData(parsed.data) } });
    revalidatePath("/utilities");
    revalidatePath("/calendar");
    revalidatePath("/dashboard");
    return { ok: true, id: bill.id };
  } catch (error) {
    console.error("[createBill]", error);
    return { ok: false, error: "Could not create the bill." };
  }
}

export async function updateBill(id: string, input: BillInput): Promise<ActionResult> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: "You must be signed in." };
  }
  const parsed = billSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  try {
    const res = await prisma.bill.updateMany({ where: { id, userId }, data: toData(parsed.data) });
    if (res.count === 0) return { ok: false, error: "Bill not found." };
    revalidatePath("/utilities");
    revalidatePath("/calendar");
    return { ok: true, id };
  } catch (error) {
    console.error("[updateBill]", error);
    return { ok: false, error: "Could not update the bill." };
  }
}

export async function toggleBillPaid(id: string, isPaid: boolean): Promise<ActionResult> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: "You must be signed in." };
  }
  try {
    const res = await prisma.bill.updateMany({
      where: { id, userId },
      data: { isPaid, paidAt: isPaid ? new Date() : null },
    });
    if (res.count === 0) return { ok: false, error: "Bill not found." };
    revalidatePath("/utilities");
    revalidatePath("/calendar");
    revalidatePath("/dashboard");
    return { ok: true, id };
  } catch (error) {
    console.error("[toggleBillPaid]", error);
    return { ok: false, error: "Could not update the bill." };
  }
}

export async function deleteBill(id: string): Promise<ActionResult> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: "You must be signed in." };
  }
  try {
    const res = await prisma.bill.deleteMany({ where: { id, userId } });
    if (res.count === 0) return { ok: false, error: "Bill not found." };
    revalidatePath("/utilities");
    revalidatePath("/calendar");
    return { ok: true, id };
  } catch (error) {
    console.error("[deleteBill]", error);
    return { ok: false, error: "Could not delete the bill." };
  }
}
