import "server-only";
import { prisma } from "@/lib/prisma";

/** Categories + payment methods for form dropdowns. */
export async function getFormRefs(userId: string) {
  const [categories, paymentMethods] = await Promise.all([
    prisma.category.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, type: true, color: true },
    }),
    prisma.paymentMethod.findMany({
      where: { userId },
      orderBy: { isDefault: "desc" },
      select: { id: true, name: true, isDefault: true },
    }),
  ]);
  return { categories, paymentMethods };
}

export type CategoryRef = Awaited<ReturnType<typeof getFormRefs>>["categories"][number];
export type PaymentMethodRef = Awaited<ReturnType<typeof getFormRefs>>["paymentMethods"][number];
