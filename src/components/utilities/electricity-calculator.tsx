"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calculateElectricity } from "@/lib/finance";
import { formatCurrency, formatNumber } from "@/lib/format";

type Fields = {
  previousReading: string;
  currentReading: string;
  unitRate: string;
  fixedCharges: string;
  taxes: string;
};

const num = (s: string) => (s.trim() === "" ? 0 : Number(s));

export function ElectricityCalculator() {
  const [f, setF] = useState<Fields>({
    previousReading: "12450",
    currentReading: "12680",
    unitRate: "8.5",
    fixedCharges: "100",
    taxes: "80",
  });

  const set = (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF((prev) => ({ ...prev, [k]: e.target.value }));

  // Live validation (spec §35): current reading cannot be below previous.
  const invalidReading = num(f.currentReading) < num(f.previousReading);

  const result = useMemo(
    () =>
      calculateElectricity({
        previousReading: num(f.previousReading),
        currentReading: num(f.currentReading),
        unitRate: num(f.unitRate),
        fixedCharges: num(f.fixedCharges),
        taxes: num(f.taxes),
      }),
    [f],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Electricity reading</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <Field label="Previous reading" htmlFor="prev">
            <Input id="prev" inputMode="decimal" value={f.previousReading} onChange={set("previousReading")} />
          </Field>
          <Field label="Current reading" htmlFor="curr" error={invalidReading ? "Must be ≥ previous" : undefined}>
            <Input
              id="curr"
              inputMode="decimal"
              value={f.currentReading}
              onChange={set("currentReading")}
              aria-invalid={invalidReading}
              className={invalidReading ? "border-destructive focus-visible:ring-destructive" : ""}
            />
          </Field>
          <Field label="Unit rate (₹/unit)" htmlFor="rate">
            <Input id="rate" inputMode="decimal" value={f.unitRate} onChange={set("unitRate")} />
          </Field>
          <Field label="Units used" htmlFor="units">
            <Input id="units" value={formatNumber(result.unitsUsed)} readOnly className="bg-muted/40" />
          </Field>
          <Field label="Fixed charges (₹)" htmlFor="fixed">
            <Input id="fixed" inputMode="decimal" value={f.fixedCharges} onChange={set("fixedCharges")} />
          </Field>
          <Field label="Taxes / other (₹)" htmlFor="tax">
            <Input id="tax" inputMode="decimal" value={f.taxes} onChange={set("taxes")} />
          </Field>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-card to-card">
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Zap className="size-4" />
          </span>
          <CardTitle>Estimated electricity bill</CardTitle>
        </CardHeader>
        <CardContent>
          <motion.p
            key={result.estimatedBill}
            initial={{ opacity: 0.4, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="tabular text-4xl font-semibold tracking-tight sm:text-5xl"
          >
            {formatCurrency(result.estimatedBill)}
          </motion.p>
          <dl className="mt-6 space-y-2.5 text-sm">
            <Row label="Units used" value={`${formatNumber(result.unitsUsed)} units`} />
            <Row
              label={`Energy cost (${formatNumber(result.unitsUsed)} × ₹${num(f.unitRate)})`}
              value={formatCurrency(result.electricityCost)}
            />
            <Row label="Fixed charges" value={formatCurrency(num(f.fixedCharges))} />
            <Row label="Taxes / other" value={formatCurrency(num(f.taxes))} />
            <div className="my-2 border-t" />
            <Row label="Total estimated bill" value={formatCurrency(result.estimatedBill)} strong />
          </dl>
          <p className="mt-6 text-xs text-muted-foreground">
            Saving readings to history and unit-consumption analytics arrive in Phase 3.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
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
