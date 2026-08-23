"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { navGroups, navItems } from "@/lib/nav";
import { cn } from "@/lib/utils";

/** Hamburger → full navigation drawer. Mobile/tablet only. */
export function MobileMenu() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0">
        <div className="flex h-16 items-center justify-between px-5">
          <SheetTitle asChild>
            <Link href="/dashboard" onClick={() => setOpen(false)} aria-label="Expense Manager home">
              <Logo />
            </Link>
          </SheetTitle>
          <ThemeToggle />
        </div>
        <nav className="flex-1 overflow-y-auto px-3 pb-8">
          {navGroups.map((group) => (
            <div key={group.id} className="mb-4">
              <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {navItems
                  .filter((i) => i.group === group.id)
                  .map((item) => {
                    const active = pathname === item.href || pathname.startsWith(item.href + "/");
                    const Icon = item.icon;
                    return (
                      <li key={item.href}>
                        <SheetClose asChild>
                          <Link
                            href={item.href}
                            aria-current={active ? "page" : undefined}
                            className={cn(
                              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                              active
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                            )}
                          >
                            <Icon className={cn("size-[18px]", active ? "text-primary" : "text-muted-foreground")} />
                            {item.title}
                          </Link>
                        </SheetClose>
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
