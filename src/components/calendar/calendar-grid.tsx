import { Card } from "@/components/ui/card";
import { formatCompactCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CalendarEvent, EventType } from "@/server/queries/calendar";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const toneFor: Record<EventType, string> = {
  BILL: "bg-primary/12 text-primary",
  EMI: "bg-warning/15 text-warning-foreground",
  RECURRING: "bg-sky-500/12 text-sky-600 dark:text-sky-400",
  GOAL: "bg-purple-500/12 text-purple-600 dark:text-purple-400",
};

export function CalendarGrid({
  month,
  year,
  events,
}: {
  month: number; // 1-12
  year: number;
  events: CalendarEvent[];
}) {
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const todayStr = new Date().toDateString();

  const byDay = new Map<number, CalendarEvent[]>();
  for (const e of events) {
    byDay.set(e.day, [...(byDay.get(e.day) ?? []), e]);
  }

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <Card className="overflow-hidden">
      <div className="grid grid-cols-7 border-b bg-muted/40 text-center text-xs font-medium text-muted-foreground">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-2">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          const isToday = day != null && new Date(year, month - 1, day).toDateString() === todayStr;
          const dayEvents = day ? byDay.get(day) ?? [] : [];
          return (
            <div
              key={i}
              className={cn(
                "min-h-16 min-w-0 overflow-hidden border-b border-r p-1 last:border-r-0 sm:min-h-24 sm:p-1.5 [&:nth-child(7n)]:border-r-0",
                day == null && "bg-muted/20",
              )}
            >
              {day != null && (
                <>
                  <span
                    className={cn(
                      "inline-flex size-6 items-center justify-center rounded-full text-xs",
                      isToday ? "bg-primary font-semibold text-primary-foreground" : "text-muted-foreground",
                    )}
                  >
                    {day}
                  </span>
                  <div className="mt-1 space-y-1">
                    {dayEvents.slice(0, 3).map((e, idx) => (
                      <div key={idx} className={cn("truncate rounded px-1.5 py-0.5 text-[10px] font-medium", toneFor[e.type])} title={e.title}>
                        {e.amount != null ? `${formatCompactCurrency(e.amount)} · ` : ""}{e.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="px-1.5 text-[10px] text-muted-foreground">+{dayEvents.length - 3} more</div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
