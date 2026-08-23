"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { loanSchema, type LoanInput } from "@/lib/validations";
import { calculateEmi, amortizationSchedule } from "@/lib/finance";
import type { ActionResult } from "@/server/types";

export async function createLoan(input: LoanInput): Promise<ActionResult> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: "You must be signed in." };
  }
  const parsed = loanSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const d = parsed.data;

  try {
    const { emi, totalInterest, totalPayable } = calculateEmi(d.principal, d.interestRate, d.tenureMonths);
    const schedule = amortizationSchedule(d.principal, d.interestRate, d.tenureMonths, d.startDate);

    const loan = await prisma.loan.create({
      data: {
        userId,
        name: d.name,
        principal: d.principal,
        interestRate: d.interestRate,
        tenureMonths: d.tenureMonths,
        startDate: d.startDate,
        processingFee: d.processingFee,
        emiAmount: emi,
        totalInterest,
        totalPayable,
        status: "ACTIVE",
        notes: d.notes && d.notes.trim() !== "" ? d.notes.trim() : null,
        payments: {
          create: schedule.map((row) => ({
            installmentNo: row.installmentNo,
            dueDate: row.dueDate,
            principalPart: row.principalPart,
            interestPart: row.interestPart,
            emiAmount: row.emiAmount,
            balanceAfter: row.balanceAfter,
          })),
        },
      },
    });

    for (const p of ["/loans", "/dashboard", "/calendar"]) revalidatePath(p);
    return { ok: true, id: loan.id };
  } catch (error) {
    console.error("[createLoan]", error);
    return { ok: false, error: "Could not create the loan." };
  }
}

export async function setLoanPaymentPaid(paymentId: string, isPaid: boolean): Promise<ActionResult> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: "You must be signed in." };
  }
  try {
    // Ownership check via the parent loan.
    const payment = await prisma.loanPayment.findFirst({
      where: { id: paymentId, loan: { userId } },
      select: { id: true, loanId: true },
    });
    if (!payment) return { ok: false, error: "Payment not found." };

    await prisma.loanPayment.update({
      where: { id: paymentId },
      data: { isPaid, paidAt: isPaid ? new Date() : null },
    });

    // Close the loan when every installment is paid.
    const remaining = await prisma.loanPayment.count({ where: { loanId: payment.loanId, isPaid: false } });
    await prisma.loan.update({
      where: { id: payment.loanId },
      data: { status: remaining === 0 ? "CLOSED" : "ACTIVE" },
    });

    revalidatePath(`/loans/${payment.loanId}`);
    revalidatePath("/loans");
    revalidatePath("/dashboard");
    return { ok: true, id: paymentId };
  } catch (error) {
    console.error("[setLoanPaymentPaid]", error);
    return { ok: false, error: "Could not update the payment." };
  }
}

export async function deleteLoan(id: string): Promise<ActionResult> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: "You must be signed in." };
  }
  try {
    const res = await prisma.loan.deleteMany({ where: { id, userId } });
    if (res.count === 0) return { ok: false, error: "Loan not found." };
    revalidatePath("/loans");
    revalidatePath("/dashboard");
    return { ok: true, id };
  } catch (error) {
    console.error("[deleteLoan]", error);
    return { ok: false, error: "Could not delete the loan." };
  }
}
