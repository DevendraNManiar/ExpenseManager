import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth";
import { listNotifications } from "@/server/queries/notifications";
import { NotificationsList } from "@/components/notifications/notifications-list";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const rows = await listNotifications(userId);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
        <p className="text-sm text-muted-foreground">Budgets, bills, EMIs, goals and system alerts.</p>
      </header>
      <NotificationsList rows={rows} />
    </div>
  );
}
