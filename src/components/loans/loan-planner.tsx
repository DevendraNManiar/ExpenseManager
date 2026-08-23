"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { HandCoins, ShieldCheck, AlertTriangle, TriangleAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { calculateEmi, assessAffordability, type AffordabilityLevel } from "@/lib/finance";
import { formatCurrency, formatPercent } from "@/lib/format";
import { createLoan } from "@/server/actions/loans";
import type { LoanInput } from "@/lib/validations";
import { cn } from "@/lib/utils";

const num = (s: string) => (s.trim() === "" ? 0 : Number(s));
const today = () => new Date().toISOString().slice(0, 10);

const levelMeta: Record<AffordabilityLevel, { label: string; cls: string; icon: typeof ShieldCheck }> = {
  healthy: { label: "Healthy", cls: "text-success bg-success/10 border-success/30", icon: ShieldCheck },
  caution: { label: "Caution", cls: "text-warning-foreground bg-warning/15 border-warning/40", icon: AlertTriangle },
  risk: { label: "At risk", cls: "text-destructive bg-destructive/10 border-destructive/30", icon: TriangleAlert },
};

export function LoanPlanner({
  monthlyIncome,
  monthlyExpenses,
  existingEmi,
}: {
  monthlyIncome: number;
  monthlyExpenses: number;
  existingEmi: number;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({
    name: "",
    principal: "500000",
    interestRate: "9.5",
    tenureMonths: "60",
    startDate: today(),
    processingFee: "0",
    income: String(monthlyIncome || ""),
    expenses: String(monthlyExpenses || ""),
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  const emi = useMemo(
    () => calculateEmi(num(f.principal), num(f.interestRate), Math.round(num(f.tenureMonths))),
    [f.principal, f.interestRate, f.tenureMonths],
  );

  const afford = useMemo(
    () =>
      assessAffordability({
        monthlyIncome: num(f.income),
        monthlyExpenses: num(f.expenses),
        existingEmi,
        newEmi: emi.emi,
      }),
    [f.income, f.expenses, existingEmi, emi.emi],
  );

  const meta = levelMeta[afford.level];
  const Icon = meta.icon;

  async function onSave() {
    if (!f.name.trim()) return toast.error("Give the loan a name first.");
    const payload: LoanInput = {
      name: f.name,
      principal: num(f.principal),
      interestRate: num(f.interestRate),
      tenureMonths: Math.round(num(f.tenureMonths)),
      startDate: new Date(f.startDate),
      processingFee: num(f.processingFee),
    };
    setSaving(true);
    const res = await createLoan(payload);
    setSaving(false);
    if (!res.ok) return toast.error(res.error ?? "Could not save.");
    toast.success("Loan saved with repayment schedule");
    router.refresh();
    if (res.id) router.push(`/loans/${res.id}`);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>Plan a loan</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <F label="Loan name" id="ln"><Input id="ln" placeholder="Home loan, Car loan…" value={f.name} onChange={set("name")} /></F>
          <div className="grid grid-cols-2 gap-4">
            <F label="Loan amount (₹)" id="lp"><Input id="lp" inputMode="decimal" value={f.principal} onChange={set("principal")} /></F>
            <F label="Interest rate (% p.a.)" id="lr"><Input id="lr" inputMode="decimal" value={f.interestRate} onChange={set("interestRate")} /></F>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <F label="Tenure (months)" id="lt"><Input id="lt" inputMode="numeric" value={f.tenureMonths} onChange={set("tenureMonths")} /></F>
            <F label="Start date" id="ls"><Input id="ls" type="date" value={f.startDate} onChange={set("startDate")} /></F>
          </div>
          <F label="Processing fee (₹)" id="lf"><Input id="lf" inputMode="decimal" value={f.processingFee} onChange={set("processingFee")} /></F>
          <div className="grid grid-cols-2 gap-4 border-t pt-4">
            <F label="Monthly income (₹)" id="li"><Input id="li" inputMode="decimal" value={f.income} onChange={set("income")} /></F>
            <F label="Monthly expenses (₹)" id="le"><Input id="le" inputMode="decimal" value={f.expenses} onChange={set("expenses")} /></F>
          </div>
          <p className="text-xs text-muted-foreground">
            Existing EMIs from your active loans (auto-included): {formatCurrency(existingEmi)}
          </p>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="bg-gradient-to-br from-primary/10 via-card to-card">
          <CardHeader className="flex-row items-center gap-2 space-y-0">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary"><HandCoins className="size-4" /></span>
            <CardTitle>Monthly EMI</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="tabular text-4xl font-semibold tracking-tight">{formatCurrency(emi.emi)}</p>
            <dl className="mt-5 space-y-2 text-sm">
              <Row label="Principal" value={formatCurrency(emi.principal)} />
              <Row label="Total interest" value={formatCurrency(emi.totalInterest)} />
              <Row label="Total payable" value={formatCurrency(emi.totalPayable)} strong />
            </dl>
          </CardContent>
        </Card>

        <Card className={cn("border", meta.cls)}>
          <CardContent className="space-y-3 p-5">
            <div className="flex items-center gap-2">
              <Icon className="size-5" />
              <span className="font-semibold">Affordability — {meta.label}</span>
              <span className="tabular ml-auto text-sm">EMI/income {formatPercent(afford.emiToIncomeRatio)}</span>
            </div>
            <p className="text-sm">{afford.message}</p>
            <div className="grid grid-cols-2 gap-3 pt-1 text-sm">
              <div>
                <p className="text-muted-foreground">Available now</p>
                <p className="tabular font-semibold">{formatCurrency(afford.availableIncome)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">After this EMI</p>
                <p className={cn("tabular font-semibold", afford.afterNewEmi < 0 && "text-destructive")}>{formatCurrency(afford.afterNewEmi)}</p>
              </div>
            </div>
            <p className="pt-1 text-xs text-muted-foreground">Informational only — not financial advice.</p>
          </CardContent>
        </Card>

        <Button className="w-full" onClick={onSave} disabled={saving}>
          {saving ? "Saving…" : "Save loan & generate schedule"}
        </Button>
      </div>
    </div>
  );
}

function F({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}
function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={strong ? "tabular text-base font-semibold" : "tabular font-medium"}>{value}</dd>
    </div>
  );
}
