import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getCurrentUserId } from "@/lib/auth";
import { getCalendarEvents } from "@/server/queries/calendar";
import { listRecurring, countDueRecurring } from "@/server/queries/recurring";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import { RecurringManager } from "@/components/calendar/recurring-manager";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Calendar" };

const LEGEND = [
  { label: "Bills", cls: "bg-primary" },
  { label: "EMIs", cls: "bg-warning" },
  { label: "Recurring", cls: "bg-sky-500" },
  { label: "Goals", cls: "bg-purple-500" },
];

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const sp = await searchParams;
  const now = new Date();
  const month = Math.min(12, Math.max(1, Number(sp.month) || now.getMonth() + 1));
  const year = Math.min(2100, Math.max(2000, Number(sp.year) || now.getFullYear()));

  const [events, recurring, dueCount] = await Promise.all([
    getCalendarEvents(userId, month, year),
    listRecurring(userId),
    countDueRecurring(userId),
  ]);

  const prev = { m: month === 1 ? 12 : month - 1, y: month === 1 ? year - 1 : year };
  const next = { m: month === 12 ? 1 : month + 1, y: month === 12 ? year + 1 : year };
  const label = new Date(year, month - 1, 1).toLocaleString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Financial Calendar</h1>
          <p className="text-sm text-muted-foreground">Upcoming bills, EMIs, recurring items and goal dates.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild aria-label="Previous month">
            <Link href={`?month=${prev.m}&year=${prev.y}`}><ChevronLeft className="size-4" /></Link>
          </Button>
          <span className="min-w-36 text-center text-sm font-medium">{label}</span>
          <Button variant="outline" size="icon" asChild aria-label="Next month">
            <Link href={`?month=${next.m}&year=${next.y}`}><ChevronRight className="size-4" /></Link>
          </Button>
        </div>
      </header>

      <div className="flex flex-wrap gap-4">
        {LEGEND.map((l) => (
          <span key={l.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={`size-2.5 rounded-full ${l.cls}`} /> {l.label}
          </span>
        ))}
      </div>

      <CalendarGrid month={month} year={year} events={events} />
      <RecurringManager rows={recurring} dueCount={dueCount} />
    </div>
  );
}
