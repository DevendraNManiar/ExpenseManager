import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { getCurrentUser } from "@/lib/auth";
import { getFormRefs } from "@/server/queries/refs";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const refs = await getFormRefs(user.id);

  return (
    <div className="flex min-h-screen bg-background app-aurora">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar refs={refs} userName={user.name ?? ""} userEmail={user.email} />
        <main className="flex-1 px-4 pb-28 pt-6 lg:px-8 lg:pb-10">{children}</main>
        <MobileNav refs={refs} />
      </div>
    </div>
  );
}
