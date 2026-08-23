import "server-only";
import type { NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export interface NotificationRow {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  href: string | null;
  isRead: boolean;
  createdAt: string;
}

export async function listNotifications(userId: string, limit = 50): Promise<NotificationRow[]> {
  const rows = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    href: n.href,
    isRead: n.isRead,
    createdAt: n.createdAt.toISOString(),
  }));
}

export async function unreadCount(userId: string): Promise<number> {
  return prisma.notification.count({ where: { userId, isRead: false } });
}
