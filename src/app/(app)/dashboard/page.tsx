import type { Metadata } from "next";
import { getDashboardData } from "@/lib/demo-data";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { FinancialHealth } from "@/components/dashboard/financial-health";
import { IncomeExpenseChart } from "@/components/dashboard/income-expense-chart";
import { CategoryDonut } from "@/components/dashboard/category-donut";
import { UpcomingList } from "@/components/dashboard/upcoming-list";
import { GoalsWidget } from "@/components/dashboard/goals-widget";
import { InsightsWidget } from "@/components/dashboard/insights-widget";

export const metadata: Metadata = { title: "Dashboard" };

function greeting(d = new Date()) {
  const h = d.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const data = getDashboardData();

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          {greeting()}, {data.userName} <span aria-hidden>👋</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Your financial overview for {data.monthLabel}
        </p>
      </header>

      <SummaryCards metrics={data.metrics} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <IncomeExpenseChart data={data.incomeVsExpenses} />
          <CategoryDonut data={data.categorySpend} />
        </div>
        <div className="space-y-6">
          <FinancialHealth score={data.healthScore} />
          <UpcomingList items={data.upcoming} />
          <GoalsWidget goals={data.goals} />
        </div>
      </div>

      <InsightsWidget insights={data.insights} />
    </div>
  );
}
