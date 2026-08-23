import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { CommandPalette } from "@/components/command-palette";
import { getCurrentUser } from "@/lib/auth";
import { getFormRefs } from "@/server/queries/refs";
import { unreadCount } from "@/server/queries/notifications";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [refs, unread] = await Promise.all([getFormRefs(user.id), unreadCount(user.id)]);

  return (
    <div className="flex min-h-screen bg-background app-aurora">
      <a
        href="#main-content"
        className="sr-only left-4 top-4 z-50 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus:not-sr-only focus:absolute"
      >
        Skip to content
      </a>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar refs={refs} userName={user.name ?? ""} userEmail={user.email} unread={unread} />
        <main id="main-content" className="flex-1 px-4 pb-28 pt-6 lg:px-8 lg:pb-10">{children}</main>
        <MobileNav refs={refs} />
      </div>
      <CommandPalette />
    </div>
  );
}
