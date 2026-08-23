"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ArrowLeftRight, Zap, BarChart3, Plus } from "lucide-react";
import { TransactionSheet } from "@/components/transactions/transaction-sheet";
import type { CategoryRef, PaymentMethodRef } from "@/server/queries/refs";
import { cn } from "@/lib/utils";

const links = [
  { title: "Home", href: "/dashboard", icon: LayoutDashboard },
  { title: "Ledger", href: "/transactions", icon: ArrowLeftRight },
  { title: "Bills", href: "/utilities", icon: Zap },
  { title: "Budget", href: "/budget", icon: BarChart3 },
];

export function MobileNav({
  refs,
}: {
  refs: { categories: CategoryRef[]; paymentMethods: PaymentMethodRef[] };
}) {
  const pathname = usePathname();

  const Item = ({ item }: { item: (typeof links)[number] }) => {
    const active = pathname === item.href || pathname.startsWith(item.href + "/");
    const Icon = item.icon;
    return (
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
          active ? "text-primary" : "text-muted-foreground",
        )}
      >
        <Icon className="size-[22px]" />
        {item.title}
      </Link>
    );
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      <Item item={links[0]} />
      <Item item={links[1]} />

      {/* Raised quick-add button */}
      <div className="relative flex w-16 shrink-0 items-start justify-center">
        <TransactionSheet
          refs={refs}
          trigger={
            <button
              aria-label="Add transaction"
              className="-mt-5 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 ring-4 ring-background transition-transform active:scale-95"
            >
              <Plus className="size-6" />
            </button>
          }
        />
      </div>

      <Item item={links[2]} />
      <Item item={links[3]} />
    </nav>
  );
}
