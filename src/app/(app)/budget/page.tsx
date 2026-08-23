import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth";
import { getBudgetView } from "@/server/queries/budgets";
import { BudgetEditor } from "@/components/budget/budget-editor";

export const metadata: Metadata = { title: "Budget" };

export default async function BudgetPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const view = await getBudgetView(userId, month, year);
  const monthLabel = now.toLocaleString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Budget</h1>
        <p className="text-sm text-muted-foreground">
          Set monthly limits per category for {monthLabel}. Progress updates as you spend.
        </p>
      </header>
      <BudgetEditor month={view.month} year={view.year} lines={view.lines} />
    </div>
  );
}
