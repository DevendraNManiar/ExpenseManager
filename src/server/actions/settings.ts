"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import {
  profileInfoSchema, financialsSchema, notificationPrefSchema, changePasswordSchema,
  type ProfileInfoInput, type FinancialsInput, type NotificationPrefInput, type ChangePasswordInput,
} from "@/lib/validations";
import type { ActionResult } from "@/server/types";

const blank = (v?: string | null) => (v && v.trim() !== "" ? v.trim() : null);

export async function updateProfileInfo(input: ProfileInfoInput): Promise<ActionResult> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: "You must be signed in." };
  }
  const parsed = profileInfoSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const d = parsed.data;
  try {
    await prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data: { name: d.name } }),
      prisma.profile.upsert({
        where: { userId },
        update: { currency: d.currency, defaultPaymentMethod: blank(d.defaultPaymentMethod), financialYearStart: d.financialYearStart },
        create: { userId, currency: d.currency, defaultPaymentMethod: blank(d.defaultPaymentMethod), financialYearStart: d.financialYearStart },
      }),
    ]);
    revalidatePath("/settings");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (error) {
    console.error("[updateProfileInfo]", error);
    return { ok: false, error: "Could not save your profile." };
  }
}

export async function updateFinancials(input: FinancialsInput): Promise<ActionResult> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: "You must be signed in." };
  }
  const parsed = financialsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const d = parsed.data;
  try {
    await prisma.profile.upsert({
      where: { userId },
      update: { monthlyIncome: d.monthlyIncome ?? null, monthlyFixedExpenses: d.monthlyFixedExpenses ?? null, currentSavings: d.currentSavings ?? null },
      create: { userId, monthlyIncome: d.monthlyIncome ?? null, monthlyFixedExpenses: d.monthlyFixedExpenses ?? null, currentSavings: d.currentSavings ?? null },
    });
    revalidatePath("/settings");
    revalidatePath("/dashboard");
    revalidatePath("/net-worth");
    revalidatePath("/loans");
    return { ok: true };
  } catch (error) {
    console.error("[updateFinancials]", error);
    return { ok: false, error: "Could not save your financial settings." };
  }
}

export async function updateNotificationPrefs(input: NotificationPrefInput): Promise<ActionResult> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: "You must be signed in." };
  }
  const parsed = notificationPrefSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid preferences." };
  }
  const d = parsed.data;
  try {
    await prisma.notificationPreference.upsert({
      where: { userId },
      update: d,
      create: { userId, ...d },
    });
    revalidatePath("/settings");
    return { ok: true };
  } catch (error) {
    console.error("[updateNotificationPrefs]", error);
    return { ok: false, error: "Could not save preferences." };
  }
}

export async function changePassword(input: ChangePasswordInput): Promise<ActionResult> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: "You must be signed in." };
  }
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.passwordHash) return { ok: false, error: "Password login is not enabled for this account." };

    const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
    if (!valid) return { ok: false, error: "Current password is incorrect.", fieldErrors: { currentPassword: ["Incorrect password"] } };

    const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    return { ok: true };
  } catch (error) {
    console.error("[changePassword]", error);
    return { ok: false, error: "Could not change your password." };
  }
}
