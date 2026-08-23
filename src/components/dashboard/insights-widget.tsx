import { Sparkles, TrendingDown, AlertTriangle, Info } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const toneMeta = {
  positive: { icon: TrendingDown, cls: "bg-success/10 text-success" },
  warning: { icon: AlertTriangle, cls: "bg-warning/15 text-warning-foreground" },
  neutral: { icon: Info, cls: "bg-primary/10 text-primary" },
} as const;

export function InsightsWidget({
  insights,
}: {
  insights: { tone: "positive" | "neutral" | "warning"; text: string }[];
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2 space-y-0">
        <Sparkles className="size-4 text-primary" />
        <CardTitle>Smart Insights</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {insights.map((i, idx) => {
          const meta = toneMeta[i.tone];
          const Icon = meta.icon;
          return (
            <div key={idx} className="flex items-start gap-3 rounded-lg border p-3">
              <span className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md ${meta.cls}`}>
                <Icon className="size-4" />
              </span>
              <p className="text-sm leading-relaxed">{i.text}</p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
