"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, PiggyBank, TrendingUp, HandCoins, Zap, Target, Receipt, Loader2, CornerDownLeft,
} from "lucide-react";
import { navItems } from "@/lib/nav";
import { searchAll, type SearchGroup } from "@/server/actions/search";
import {
  CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem,
} from "@/components/ui/command";

const QUICK_ACTIONS = [
  { label: "Add expense", href: "/expenses", icon: Plus },
  { label: "Add income", href: "/income", icon: PiggyBank },
  { label: "Add investment", href: "/investments", icon: TrendingUp },
  { label: "Add loan", href: "/loans", icon: HandCoins },
  { label: "Add electricity reading", href: "/utilities", icon: Zap },
  { label: "Add goal", href: "/goals", icon: Target },
  { label: "View reports", href: "/reports", icon: Receipt },
];

export const OPEN_COMMAND_EVENT = "moneyos:command";

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const reqId = useRef(0);

  // Ctrl/Cmd+K toggles; custom event opens (from the top-bar search buttons).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onOpen = () => setOpen(true);
    document.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_COMMAND_EVENT, onOpen);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_COMMAND_EVENT, onOpen);
    };
  }, []);

  // Debounced server search.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const id = ++reqId.current;
    const t = setTimeout(async () => {
      const res = await searchAll(q);
      if (id === reqId.current) {
        setResults(res);
        setLoading(false);
      }
    }, 220);
    return () => clearTimeout(t);
  }, [query]);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      setQuery("");
      router.push(href);
    },
    [router],
  );

  const showResults = query.trim().length >= 2;

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search or jump to…" value={query} onValueChange={setQuery} />
      <CommandList>
        {showResults ? (
          <>
            {loading && (
              <div className="flex items-center gap-2 px-3 py-6 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Searching…
              </div>
            )}
            {!loading && results.length === 0 && <CommandEmpty>No results for “{query}”.</CommandEmpty>}
            {results.map((g) => (
              <CommandGroup key={g.group} heading={g.group}>
                {g.items.map((it) => (
                  <CommandItem key={it.id} value={`${g.group}-${it.id}`} onSelect={() => go(it.href)}>
                    <CornerDownLeft className="opacity-0" />
                    <span className="flex-1 truncate">{it.label}</span>
                    {it.sub && <span className="tabular text-xs text-muted-foreground">{it.sub}</span>}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </>
        ) : (
          <>
            <CommandGroup heading="Quick actions">
              {QUICK_ACTIONS.map((a) => {
                const Icon = a.icon;
                return (
                  <CommandItem key={a.href + a.label} value={a.label} onSelect={() => go(a.href)}>
                    <Icon />
                    <span>{a.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandGroup heading="Go to">
              {navItems.map((n) => {
                const Icon = n.icon;
                return (
                  <CommandItem key={n.href} value={`nav ${n.title}`} onSelect={() => go(n.href)}>
                    <Icon />
                    <span>{n.title}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
