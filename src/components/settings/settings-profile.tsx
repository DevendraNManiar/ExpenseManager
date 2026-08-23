"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateProfileInfo, updateFinancials } from "@/server/actions/settings";
import type { ProfileInfoInput, FinancialsInput } from "@/lib/validations";

const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "AUD", "CAD", "SGD", "JPY"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export interface ProfileData {
  name: string;
  email: string;
  currency: string;
  defaultPaymentMethod: string;
  financialYearStart: number;
  monthlyIncome: number | null;
  monthlyFixedExpenses: number | null;
  currentSavings: number | null;
}

export function SettingsProfile({ data }: { data: ProfileData }) {
  const router = useRouter();
  const [currency, setCurrency] = useState(data.currency);
  const [fyStart, setFyStart] = useState(String(data.financialYearStart));
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingFin, setSavingFin] = useState(false);

  async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const payload: ProfileInfoInput = {
      name: String(f.get("name")),
      currency,
      defaultPaymentMethod: String(f.get("defaultPaymentMethod") ?? ""),
      financialYearStart: Number(fyStart),
    };
    setSavingProfile(true);
    const res = await updateProfileInfo(payload);
    setSavingProfile(false);
    if (!res.ok) return toast.error(res.error ?? "Could not save.");
    toast.success("Profile updated");
    router.refresh();
  }

  async function saveFin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const num = (k: string) => { const v = String(f.get(k) ?? "").trim(); return v === "" ? null : Number(v); };
    const payload: FinancialsInput = {
      monthlyIncome: num("monthlyIncome"),
      monthlyFixedExpenses: num("monthlyFixedExpenses"),
      currentSavings: num("currentSavings"),
    };
    setSavingFin(true);
    const res = await updateFinancials(payload);
    setSavingFin(false);
    if (!res.ok) return toast.error(res.error ?? "Could not save.");
    toast.success("Financial settings updated");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your name, currency and financial year.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveProfile} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" required defaultValue={data.name} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={data.email} readOnly className="bg-muted/40" />
              </div>
              <div className="space-y-1.5">
                <Label>Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dpm">Default payment method</Label>
                <Input id="dpm" name="defaultPaymentMethod" defaultValue={data.defaultPaymentMethod} placeholder="UPI, Credit Card…" />
              </div>
              <div className="space-y-1.5">
                <Label>Financial year starts</Label>
                <Select value={fyStart} onValueChange={setFyStart}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{MONTHS.map((m, i) => <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={savingProfile}>{savingProfile ? "Saving…" : "Save profile"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Financial settings</CardTitle>
          <CardDescription>Used across affordability, health score and net worth.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveFin} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="mi">Monthly income (₹)</Label>
                <Input id="mi" name="monthlyIncome" type="number" step="0.01" defaultValue={data.monthlyIncome ?? ""} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="me">Monthly fixed expenses (₹)</Label>
                <Input id="me" name="monthlyFixedExpenses" type="number" step="0.01" defaultValue={data.monthlyFixedExpenses ?? ""} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cs">Current savings (₹)</Label>
                <Input id="cs" name="currentSavings" type="number" step="0.01" defaultValue={data.currentSavings ?? ""} />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={savingFin}>{savingFin ? "Saving…" : "Save financials"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
