import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { User, Bell, Shield, Palette } from "lucide-react";
import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dec } from "@/lib/dates";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SettingsProfile } from "@/components/settings/settings-profile";
import { SettingsNotifications, type PrefsData } from "@/components/settings/settings-notifications";
import { SettingsSecurity } from "@/components/settings/settings-security";
import { SettingsAppearance } from "@/components/settings/settings-appearance";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true, notificationPref: true },
  });
  if (!user) redirect("/login");

  const p = user.profile;
  const prefs = user.notificationPref;
  const prefsData: PrefsData = {
    emailEnabled: prefs?.emailEnabled ?? true,
    expenseAdded: prefs?.expenseAdded ?? false,
    largeExpenseAlert: prefs?.largeExpenseAlert ?? true,
    largeExpenseThreshold: dec(prefs?.largeExpenseThreshold) || 5000,
    budgetExceeded: prefs?.budgetExceeded ?? true,
    billReminder: prefs?.billReminder ?? true,
    emiReminder: prefs?.emiReminder ?? true,
    investmentReminder: prefs?.investmentReminder ?? false,
    monthlySummary: prefs?.monthlySummary ?? true,
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your profile, notifications, security and appearance.</p>
      </header>

      <Tabs defaultValue="profile">
        <TabsList className="flex-wrap">
          <TabsTrigger value="profile"><User className="size-4" /> Profile</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="size-4" /> Notifications</TabsTrigger>
          <TabsTrigger value="security"><Shield className="size-4" /> Security</TabsTrigger>
          <TabsTrigger value="appearance"><Palette className="size-4" /> Appearance</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <SettingsProfile
            data={{
              name: user.name ?? "",
              email: user.email,
              currency: p?.currency ?? "INR",
              defaultPaymentMethod: p?.defaultPaymentMethod ?? "",
              financialYearStart: p?.financialYearStart ?? 4,
              monthlyIncome: p?.monthlyIncome == null ? null : dec(p.monthlyIncome),
              monthlyFixedExpenses: p?.monthlyFixedExpenses == null ? null : dec(p.monthlyFixedExpenses),
              currentSavings: p?.currentSavings == null ? null : dec(p.currentSavings),
            }}
          />
        </TabsContent>
        <TabsContent value="notifications"><SettingsNotifications data={prefsData} /></TabsContent>
        <TabsContent value="security"><SettingsSecurity /></TabsContent>
        <TabsContent value="appearance"><SettingsAppearance /></TabsContent>
      </Tabs>
    </div>
  );
}
