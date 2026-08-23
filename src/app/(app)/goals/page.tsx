import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth";
import { listGoals } from "@/server/queries/goals";
import { GoalsManager } from "@/components/goals/goals-manager";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

export const metadata: Metadata = { title: "Goals" };

export default async function GoalsPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const goals = await listGoals(userId);
  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);
  const active = goals.filter((g) => g.status !== "COMPLETED").length;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Financial Goals</h1>
        <p className="text-sm text-muted-foreground">Save toward what matters, with progress and projected completion.</p>
      </header>

      {goals.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Tile label="Total saved" value={formatCurrency(totalSaved)} />
          <Tile label="Total target" value={formatCurrency(totalTarget)} />
          <Tile label="Active goals" value={String(active)} />
        </div>
      )}

      <GoalsManager goals={goals} />
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="tabular mt-1 text-xl font-semibold">{value}</p>
    </Card>
  );
}
