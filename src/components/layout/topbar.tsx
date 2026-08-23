"use client";

import { Bell, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Logo } from "@/components/brand/logo";
import Link from "next/link";

export function Topbar() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur lg:px-8">
      {/* Mobile logo */}
      <Link href="/dashboard" className="lg:hidden" aria-label="MoneyOS home">
        <Logo showWord={false} />
      </Link>

      <button
        type="button"
        className="hidden flex-1 items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted sm:flex sm:max-w-md"
        aria-label="Search (Ctrl+K)"
      >
        <Search className="size-4" />
        <span>Search transactions, bills, goals…</span>
        <kbd className="ml-auto rounded border bg-background px-1.5 py-0.5 text-[10px] font-medium">
          Ctrl K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-1.5">
        <Button className="hidden sm:inline-flex" size="sm">
          <Plus className="size-4" /> Add Expense
        </Button>
        <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
          <Bell className="size-5" />
          <span className="absolute right-2 top-2 size-2 rounded-full bg-primary" />
        </Button>
        <ThemeToggle />
      </div>
    </header>
  );
}
