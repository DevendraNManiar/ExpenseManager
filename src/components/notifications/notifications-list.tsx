"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import {
  Wallet, BarChart3, Zap, HandCoins, TrendingUp, Target, Bell, Check, Trash2, CheckCheck, Inbox,
} from "lucide-react";
import type { NotificationType } from "@prisma/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  markNotificationRead, markAllNotificationsRead, deleteNotification, clearAllNotifications,
} from "@/server/actions/notifications";
import { cn } from "@/lib/utils";
import type { NotificationRow } from "@/server/queries/notifications";

const ICONS: Record<NotificationType, typeof Bell> = {
  EXPENSE: Wallet, BUDGET: BarChart3, BILL: Zap, EMI: HandCoins, INVESTMENT: TrendingUp, GOAL: Target, SYSTEM: Bell,
};

export function NotificationsList({ rows }: { rows: NotificationRow[] }) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const unread = rows.filter((r) => !r.isRead).length;

  async function run(fn: () => Promise<{ ok: boolean; error?: string }>, key: string, ok?: string) {
    setPending(key);
    const res = await fn();
    setPending(null);
    if (!res.ok) return toast.error(res.error ?? "Something went wrong.");
    if (ok) toast.success(ok);
    router.refresh();
  }

  if (rows.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center gap-2 py-20 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground"><Inbox className="size-7" /></span>
        <p className="text-lg font-medium">You're all caught up</p>
        <p className="max-w-xs text-sm text-muted-foreground">Notifications about expenses, budgets, bills and goals will show up here.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{unread} unread</p>
        <div className="flex gap-2">
          {unread > 0 && (
            <Button variant="outline" size="sm" disabled={pending === "all"} onClick={() => run(markAllNotificationsRead, "all", "All marked read")}>
              <CheckCheck className="size-4" /> Mark all read
            </Button>
          )}
          <Button variant="outline" size="sm" disabled={pending === "clear"} onClick={() => run(clearAllNotifications, "clear", "Notifications cleared")}>
            <Trash2 className="size-4" /> Clear all
          </Button>
        </div>
      </div>

      <Card className="divide-y overflow-hidden">
        {rows.map((n) => {
          const Icon = ICONS[n.type] ?? Bell;
          return (
            <div key={n.id} className={cn("flex items-start gap-3 px-4 py-3.5 transition-colors", !n.isRead && "bg-primary/[0.04]")}>
              <span className={cn("mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg", n.isRead ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary")}>
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {!n.isRead && <span className="size-2 shrink-0 rounded-full bg-primary" />}
                  {n.href ? (
                    <Link href={n.href} className="truncate text-sm font-medium hover:underline">{n.title}</Link>
                  ) : (
                    <p className="truncate text-sm font-medium">{n.title}</p>
                  )}
                </div>
                {n.body && <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{n.body}</p>}
                <p className="mt-0.5 text-xs text-muted-foreground">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
              </div>
              <div className="flex items-center">
                {!n.isRead && (
                  <Button variant="ghost" size="icon" className="size-8" aria-label="Mark read" disabled={pending === n.id} onClick={() => run(() => markNotificationRead(n.id, true), n.id)}>
                    <Check className="size-4" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive" aria-label="Delete" disabled={pending === n.id} onClick={() => run(() => deleteNotification(n.id), n.id)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}
