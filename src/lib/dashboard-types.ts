export interface SummaryMetric {
  key: string;
  label: string;
  value: number;
  currency: string;
  changePct: number;
  hint: string;
}

export interface DashboardData {
  userName: string;
  monthLabel: string;
  currency: string;
  metrics: SummaryMetric[];
  healthScore: number;
  incomeVsExpenses: { label: string; income: number; expenses: number }[];
  categorySpend: { name: string; value: number; color: string }[];
  dailySpend: { day: string; amount: number }[];
  upcoming: { title: string; amount: number; date: string; type: string }[];
  goals: { name: string; current: number; target: number; color: string }[];
  insights: { tone: "positive" | "neutral" | "warning"; text: string }[];
}
