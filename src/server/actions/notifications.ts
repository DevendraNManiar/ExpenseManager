"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import type { ActionResult } from "@/server/types";

function revalidate() {
  revalidatePath("/notifications");
  revalidatePath("/dashboard");
}

export async function markNotificationRead(id: string, isRead = true): Promise<ActionResult> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: "You must be signed in." };
  }
  try {
    await prisma.notification.updateMany({ where: { id, userId }, data: { isRead } });
    revalidate();
    return { ok: true, id };
  } catch (error) {
    console.error("[markNotificationRead]", error);
    return { ok: false, error: "Could not update the notification." };
  }
}

export async function markAllNotificationsRead(): Promise<ActionResult> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: "You must be signed in." };
  }
  try {
    await prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
    revalidate();
    return { ok: true };
  } catch (error) {
    console.error("[markAllNotificationsRead]", error);
    return { ok: false, error: "Could not update notifications." };
  }
}

export async function deleteNotification(id: string): Promise<ActionResult> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: "You must be signed in." };
  }
  try {
    await prisma.notification.deleteMany({ where: { id, userId } });
    revalidate();
    return { ok: true, id };
  } catch (error) {
    console.error("[deleteNotification]", error);
    return { ok: false, error: "Could not delete the notification." };
  }
}

export async function clearAllNotifications(): Promise<ActionResult> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: "You must be signed in." };
  }
  try {
    await prisma.notification.deleteMany({ where: { userId } });
    revalidate();
    return { ok: true };
  } catch (error) {
    console.error("[clearAllNotifications]", error);
    return { ok: false, error: "Could not clear notifications." };
  }
}
