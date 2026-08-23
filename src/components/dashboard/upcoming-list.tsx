import { CalendarClock, Zap, TrendingUp, HandCoins } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

const iconFor: Record<string, typeof Zap> = {
  EMI: HandCoins,
  BILL: Zap,
  INVESTMENT: TrendingUp,
};

export function UpcomingList({
  items,
}: {
  items: { title: string; amount: number; date: string; type: string }[];
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2 space-y-0">
        <CalendarClock className="size-4 text-muted-foreground" />
        <CardTitle>Upcoming</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {items.map((it, idx) => {
          const Icon = iconFor[it.type] ?? CalendarClock;
          return (
            <div
              key={`${it.title}-${it.date}-${idx}`}
              className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-accent/50"
            >
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{it.title}</p>
                <p className="text-xs text-muted-foreground">Due {it.date}</p>
              </div>
              <span className="tabular text-sm font-semibold">{formatCurrency(it.amount)}</span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
