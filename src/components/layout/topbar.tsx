"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { Bell, Search, LogOut, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Logo } from "@/components/brand/logo";
import { TransactionSheet } from "@/components/transactions/transaction-sheet";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { OPEN_COMMAND_EVENT } from "@/components/command-palette";

function openCommand() {
  window.dispatchEvent(new Event(OPEN_COMMAND_EVENT));
}
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CategoryRef, PaymentMethodRef } from "@/server/queries/refs";

interface Props {
  refs: { categories: CategoryRef[]; paymentMethods: PaymentMethodRef[] };
  userName: string;
  userEmail: string;
  unread: number;
}

export function Topbar({ refs, userName, userEmail, unread }: Props) {
  const initial = (userName || userEmail || "?").charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur lg:px-8">
      <MobileMenu />
      <Link href="/dashboard" className="lg:hidden" aria-label="MoneyOS home">
        <Logo showWord={false} />
      </Link>

      <button
        type="button"
        onClick={openCommand}
        className="hidden flex-1 items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted sm:flex sm:max-w-md"
        aria-label="Search (Ctrl+K)"
      >
        <Search className="size-4" />
        <span>Search transactions, bills, goals…</span>
        <kbd className="ml-auto rounded border bg-background px-1.5 py-0.5 text-[10px] font-medium">Ctrl K</kbd>
      </button>

      <div className="ml-auto flex items-center gap-1.5">
        <Button variant="ghost" size="icon" className="sm:hidden" aria-label="Search" onClick={openCommand}>
          <Search className="size-5" />
        </Button>
        <span className="hidden sm:inline-flex">
          <TransactionSheet refs={refs} />
        </span>
        <Button asChild variant="ghost" size="icon" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} className="relative">
          <Link href="/notifications">
            <Bell className="size-5" />
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-4 text-primary-foreground">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Link>
        </Button>
        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex size-9 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary transition-colors hover:bg-primary/25"
              aria-label="Account menu"
            >
              {initial}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <p className="truncate">{userName || "Account"}</p>
              <p className="truncate text-xs font-normal text-muted-foreground">{userEmail}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings"><User className="size-4" /> Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings"><Settings className="size-4" /> Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
              <LogOut className="size-4" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
