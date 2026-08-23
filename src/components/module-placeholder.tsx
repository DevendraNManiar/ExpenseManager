import { Construction } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/** Consistent empty state for modules scheduled in later phases. */
export function ModulePlaceholder({
  title,
  description,
  phase,
}: {
  title: string;
  description: string;
  phase: string;
}) {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Badge variant="secondary">{phase}</Badge>
      </header>
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Construction className="size-7" />
          </span>
          <p className="text-lg font-medium">This module is on the roadmap</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            The data model, design system and layout are already in place. {title} lands
            in {phase} — the schema and calculation engine backing it already ship in this build.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
