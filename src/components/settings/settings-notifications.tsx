"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { updateNotificationPrefs } from "@/server/actions/settings";
import type { NotificationPrefInput } from "@/lib/validations";

export type PrefsData = NotificationPrefInput;

const TOGGLES: { key: keyof PrefsData; label: string; hint: string }[] = [
  { key: "emailEnabled", label: "Email alerts", hint: "Master switch for all emails." },
  { key: "expenseAdded", label: "Expense added", hint: "Email whenever you add an expense." },
  { key: "largeExpenseAlert", label: "Large expense alert", hint: "Email when an expense exceeds your threshold." },
  { key: "budgetExceeded", label: "Budget exceeded", hint: "Warn when a category goes over budget." },
  { key: "billReminder", label: "Bill reminders", hint: "Upcoming bill due-date reminders." },
  { key: "emiReminder", label: "EMI reminders", hint: "Upcoming loan EMI reminders." },
  { key: "investmentReminder", label: "Investment reminders", hint: "Prompts to review or add investments." },
  { key: "monthlySummary", label: "Monthly summary", hint: "A monthly recap of your finances." },
];

export function SettingsNotifications({ data }: { data: PrefsData }) {
  const router = useRouter();
  const [prefs, setPrefs] = useState<PrefsData>(data);
  const [saving, setSaving] = useState(false);

  const set = (key: keyof PrefsData, value: boolean | number) => setPrefs((p) => ({ ...p, [key]: value }));

  async function save() {
    setSaving(true);
    const res = await updateNotificationPrefs(prefs);
    setSaving(false);
    if (!res.ok) return toast.error(res.error ?? "Could not save.");
    toast.success("Notification preferences saved");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>Choose which alerts you receive. Emails only send when enabled.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {TOGGLES.map((t) => (
          <div key={t.key} className="flex items-center justify-between gap-4 border-b py-3 last:border-0">
            <div className="min-w-0">
              <p className="text-sm font-medium">{t.label}</p>
              <p className="text-xs text-muted-foreground">{t.hint}</p>
            </div>
            <Switch checked={Boolean(prefs[t.key])} onCheckedChange={(v) => set(t.key, v)} disabled={t.key !== "emailEnabled" && !prefs.emailEnabled} />
          </div>
        ))}

        <div className="flex items-center justify-between gap-4 py-3">
          <div>
            <p className="text-sm font-medium">Large expense threshold</p>
            <p className="text-xs text-muted-foreground">Amount that triggers a large-expense alert.</p>
          </div>
          <div className="relative w-32">
            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
            <Input inputMode="decimal" className="pl-6 text-right" value={prefs.largeExpenseThreshold} onChange={(e) => set("largeExpenseThreshold", Number(e.target.value) || 0)} />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save preferences"}</Button>
        </div>
      </CardContent>
    </Card>
  );
}
