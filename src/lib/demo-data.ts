/**
 * Demo dashboard data (spec §39). Shaped to match the eventual Prisma query
 * results so the dashboard components stay unchanged when wired to the DB.
 * Replace `getDashboardData()` with a real DB read in Phase 2.
 */
import { savingsRate } from "@/lib/finance";
import { percentChange as pc } from "@/lib/format";
import type { DashboardData } from "@/lib/dashboard-types";

export function getDashboardData(): DashboardData {
  const currency = "INR";
  const income = 92000;
  const expenses = 42500;
  const prevExpenses = 46400;
  const balance = 318450;
  const upcomingBills = 16405;

  return {
    userName: "Jaimin",
    monthLabel: "August 2026",
    currency,
    healthScore: 82,
    metrics: [
      {
        key: "balance",
        label: "Total Balance",
        value: balance,
        currency,
        changePct: 3.2,
        hint: "across all accounts",
      },
      {
        key: "income",
        label: "Monthly Income",
        value: income,
        currency,
        changePct: 0,
        hint: "vs previous month",
      },
      {
        key: "expenses",
        label: "Monthly Expenses",
        value: expenses,
        currency,
        changePct: pc(expenses, prevExpenses),
        hint: "vs previous month",
      },
      {
        key: "remaining",
        label: "Remaining",
        value: income - expenses,
        currency,
        changePct: 8.4,
        hint: "safe to spend / save",
      },
      {
        key: "savings",
        label: "Savings Rate",
        value: savingsRate(income, expenses),
        currency,
        changePct: 4.1,
        hint: "of income saved",
      },
      {
        key: "bills",
        label: "Upcoming Bills",
        value: upcomingBills,
        currency,
        changePct: 0,
        hint: "due this month",
      },
    ],
    incomeVsExpenses: [
      { label: "Mar", income: 88000, expenses: 51000 },
      { label: "Apr", income: 88000, expenses: 47500 },
      { label: "May", income: 90000, expenses: 49200 },
      { label: "Jun", income: 90000, expenses: 44100 },
      { label: "Jul", income: 92000, expenses: 46400 },
      { label: "Aug", income: 92000, expenses: 42500 },
    ],
    categorySpend: [
      { name: "Food", value: 8450, color: "#10b981" },
      { name: "Rent", value: 15000, color: "#0ea5e9" },
      { name: "Transport", value: 3200, color: "#f59e0b" },
      { name: "Shopping", value: 5400, color: "#a855f7" },
      { name: "Utilities", value: 4050, color: "#ef4444" },
      { name: "Other", value: 6400, color: "#64748b" },
    ],
    dailySpend: Array.from({ length: 30 }, (_, i) => ({
      day: String(i + 1),
      amount: Math.round(600 + Math.sin(i / 2.4) * 500 + (i % 7 === 0 ? 1800 : 0) + Math.random() * 400),
    })),
    upcoming: [
      { title: "Home Loan EMI", amount: 12450, date: "5 Sep", type: "EMI" },
      { title: "Electricity Bill", amount: 1955, date: "10 Sep", type: "BILL" },
      { title: "SIP — Index Fund", amount: 2000, date: "7 Sep", type: "INVESTMENT" },
    ],
    goals: [
      { name: "Emergency Fund", current: 65000, target: 100000, color: "#10b981" },
      { name: "New Laptop", current: 48000, target: 120000, color: "#0ea5e9" },
      { name: "Goa Trip", current: 22000, target: 40000, color: "#a855f7" },
    ],
    insights: [
      { tone: "positive", text: "You spent 8.4% less this month than in July." },
      { tone: "warning", text: "Your electricity consumption is 8% above your 3-month average." },
      { tone: "neutral", text: "You have ₹18,500 available after recurring commitments." },
    ],
  };
}
