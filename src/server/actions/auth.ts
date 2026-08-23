"use server";

import bcrypt from "bcryptjs";
import type { TransactionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { signupSchema, type SignupInput } from "@/lib/validations";
import type { ActionResult } from "@/server/types";

const DEFAULT_CATEGORIES: { name: string; type: TransactionType; color: string }[] = [
  { name: "Food", type: "EXPENSE", color: "#10b981" },
  { name: "Groceries", type: "EXPENSE", color: "#22c55e" },
  { name: "Transport", type: "EXPENSE", color: "#f59e0b" },
  { name: "Rent", type: "EXPENSE", color: "#0ea5e9" },
  { name: "Electricity", type: "EXPENSE", color: "#ef4444" },
  { name: "Shopping", type: "EXPENSE", color: "#a855f7" },
  { name: "Entertainment", type: "EXPENSE", color: "#ec4899" },
  { name: "Healthcare", type: "EXPENSE", color: "#14b8a6" },
  { name: "Education", type: "EXPENSE", color: "#6366f1" },
  { name: "EMI", type: "EMI", color: "#f97316" },
  { name: "Salary", type: "INCOME", color: "#16a34a" },
  { name: "Freelance", type: "INCOME", color: "#0891b2" },
  { name: "Other", type: "EXPENSE", color: "#64748b" },
];

export async function signup(input: SignupInput): Promise<ActionResult> {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const { name, email, password } = parsed.data;

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return { ok: false, error: "An account with this email already exists." };

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        emailVerified: new Date(), // simplified for now; email verification flow lands later
        profile: { create: { currency: "INR" } },
        notificationPref: { create: {} },
        dashboardPref: { create: {} },
        categories: { create: DEFAULT_CATEGORIES.map((c) => ({ ...c })) },
        paymentMethods: {
          create: [
            { name: "UPI", isDefault: true },
            { name: "Credit Card" },
            { name: "Debit Card" },
            { name: "Cash" },
            { name: "Net Banking" },
          ],
        },
      },
    });

    return { ok: true };
  } catch (error) {
    console.error("[signup]", error);
    return { ok: false, error: "Could not create your account. Please try again." };
  }
}
