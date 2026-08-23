"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { ipoSchema, type IpoInput } from "@/lib/validations";
import type { ActionResult } from "@/server/types";

const blank = (v?: string | null) => (v && v.trim() !== "" ? v.trim() : null);

function toData(d: IpoInput) {
  return {
    companyName: d.companyName,
    ipoName: blank(d.ipoName),
    openDate: d.openDate ?? null,
    closeDate: d.closeDate ?? null,
    priceBandLow: d.priceBandLow ?? null,
    priceBandHigh: d.priceBandHigh ?? null,
    lotSize: d.lotSize ?? null,
    lots: d.lots,
    amountApplied: d.amountApplied ?? null,
    status: d.status,
    listingDate: d.listingDate ?? null,
    listingPrice: d.listingPrice ?? null,
    currentPrice: d.currentPrice ?? null,
    notes: blank(d.notes),
  };
}

export async function createIpo(input: IpoInput): Promise<ActionResult> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: "You must be signed in." };
  }
  const parsed = ipoSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  try {
    const ipo = await prisma.ipo.create({ data: { userId, ...toData(parsed.data) } });
    revalidatePath("/ipos");
    return { ok: true, id: ipo.id };
  } catch (error) {
    console.error("[createIpo]", error);
    return { ok: false, error: "Could not save the IPO." };
  }
}

export async function updateIpo(id: string, input: IpoInput): Promise<ActionResult> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: "You must be signed in." };
  }
  const parsed = ipoSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  try {
    const res = await prisma.ipo.updateMany({ where: { id, userId }, data: toData(parsed.data) });
    if (res.count === 0) return { ok: false, error: "IPO not found." };
    revalidatePath("/ipos");
    return { ok: true, id };
  } catch (error) {
    console.error("[updateIpo]", error);
    return { ok: false, error: "Could not update the IPO." };
  }
}

export async function deleteIpo(id: string): Promise<ActionResult> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: "You must be signed in." };
  }
  try {
    const res = await prisma.ipo.deleteMany({ where: { id, userId } });
    if (res.count === 0) return { ok: false, error: "IPO not found." };
    revalidatePath("/ipos");
    return { ok: true, id };
  } catch (error) {
    console.error("[deleteIpo]", error);
    return { ok: false, error: "Could not delete the IPO." };
  }
}
