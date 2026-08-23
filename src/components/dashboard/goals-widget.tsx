import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

export function GoalsWidget({
  goals,
}: {
  goals: { name: string; current: number; target: number; color: string }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Financial Goals</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {goals.map((g) => {
          const pct = Math.min(100, Math.round((g.current / g.target) * 100));
          return (
            <div key={g.name}>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-medium">{g.name}</span>
                <span className="tabular text-xs text-muted-foreground">
                  {formatCurrency(g.current)} / {formatCurrency(g.target)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, background: g.color }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
