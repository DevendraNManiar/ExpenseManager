import {
  LayoutDashboard,
  Wallet,
  TrendingUp,
  PiggyBank,
  ArrowLeftRight,
  Receipt,
  Landmark,
  Rocket,
  HandCoins,
  Target,
  CalendarDays,
  BarChart3,
  Bell,
  Settings,
  Zap,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  group: "overview" | "money" | "planning" | "system";
}

export const navItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, group: "overview" },
  { title: "Expenses", href: "/expenses", icon: Wallet, group: "money" },
  { title: "Income", href: "/income", icon: PiggyBank, group: "money" },
  { title: "Budget", href: "/budget", icon: BarChart3, group: "money" },
  { title: "Transactions", href: "/transactions", icon: ArrowLeftRight, group: "money" },
  { title: "Bills & Utilities", href: "/utilities", icon: Zap, group: "money" },
  { title: "Investments", href: "/investments", icon: TrendingUp, group: "planning" },
  { title: "IPO Tracker", href: "/ipos", icon: Rocket, group: "planning" },
  { title: "Loans", href: "/loans", icon: HandCoins, group: "planning" },
  { title: "Goals", href: "/goals", icon: Target, group: "planning" },
  { title: "Calendar", href: "/calendar", icon: CalendarDays, group: "planning" },
  { title: "Reports", href: "/reports", icon: Receipt, group: "system" },
  { title: "Net Worth", href: "/net-worth", icon: Landmark, group: "system" },
  { title: "Notifications", href: "/notifications", icon: Bell, group: "system" },
  { title: "Settings", href: "/settings", icon: Settings, group: "system" },
];

export const navGroups: { id: NavItem["group"]; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "money", label: "Money" },
  { id: "planning", label: "Plan & Grow" },
  { id: "system", label: "Insights & System" },
];

/** Items surfaced in the mobile bottom bar. */
export const mobileNav: NavItem[] = navItems.filter((i) =>
  ["/dashboard", "/expenses", "/transactions", "/utilities", "/reports"].includes(i.href),
);
