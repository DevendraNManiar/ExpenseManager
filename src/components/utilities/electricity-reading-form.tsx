"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { calculateElectricity } from "@/lib/finance";
import { formatCurrency, formatNumber } from "@/lib/format";
import { createReading, updateReading } from "@/server/actions/utility";
import type { UtilityReadingInput } from "@/lib/validations";

export interface ReadingFormValues {
  label: string;
  month: string;
  year: string;
  readingDate: string;
  previousReading: string;
  currentReading: string;
  unitRate: string;
  fixedCharges: string;
  taxes: string;
  notes: string;
}

const num = (s: string) => (s.trim() === "" ? 0 : Number(s));
const today = () => new Date().toISOString().slice(0, 10);

export function ElectricityReadingForm({
  editId,
  initial,
  onDone,
  compact,
}: {
  editId?: string;
  initial?: Partial<ReadingFormValues>;
  onDone?: () => void;
  compact?: boolean;
}) {
  const router = useRouter();
  const now = new Date();
  const [v, setV] = useState<ReadingFormValues>({
    label: initial?.label ?? "",
    month: initial?.month ?? String(now.getMonth() + 1),
    year: initial?.year ?? String(now.getFullYear()),
    readingDate: initial?.readingDate ?? today(),
    previousReading: initial?.previousReading ?? "",
    currentReading: initial?.currentReading ?? "",
    unitRate: initial?.unitRate ?? "8.5",
    fixedCharges: initial?.fixedCharges ?? "0",
    taxes: initial?.taxes ?? "0",
    notes: initial?.notes ?? "",
  });
  const [saving, setSaving] = useState(false);

  const set = (k: keyof ReadingFormValues) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setV((p) => ({ ...p, [k]: e.target.value }));

  const invalid = num(v.currentReading) < num(v.previousReading);
  const result = useMemo(
    () =>
      calculateElectricity({
        previousReading: num(v.previousReading),
        currentReading: num(v.currentReading),
        unitRate: num(v.unitRate),
        fixedCharges: num(v.fixedCharges),
        taxes: num(v.taxes),
      }),
    [v],
  );

  async function onSave() {
    if (invalid) {
      toast.error("Current reading must be ≥ previous reading.");
      return;
    }
    const payload: UtilityReadingInput = {
      type: "electricity",
      label: v.label,
      month: Number(v.month),
      year: Number(v.year),
      readingDate: new Date(v.readingDate),
      previousReading: num(v.previousReading),
      currentReading: num(v.currentReading),
      unitRate: num(v.unitRate),
      fixedCharges: num(v.fixedCharges),
      taxes: num(v.taxes),
      notes: v.notes,
    };
    setSaving(true);
    const res = editId ? await updateReading(editId, payload) : await createReading(payload);
    setSaving(false);
    if (!res.ok) {
      toast.error(res.error ?? "Could not save.");
      return;
    }
    toast.success(editId ? "Reading updated" : "Reading saved to history");
    router.refresh();
    onDone?.();
  }

  return (
    <div className={compact ? "space-y-4" : "grid gap-6 lg:grid-cols-2"}>
      <Card>
        <CardHeader>
          <CardTitle>Electricity reading</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <F label="Reading date" id="rd"><Input id="rd" type="date" value={v.readingDate} onChange={set("readingDate")} /></F>
          <F label="Label (optional)" id="lb"><Input id="lb" placeholder="August 2026" value={v.label} onChange={set("label")} /></F>
          <F label="Previous reading" id="pr"><Input id="pr" inputMode="decimal" value={v.previousReading} onChange={set("previousReading")} /></F>
          <F label="Current reading" id="cr" error={invalid ? "Must be ≥ previous" : undefined}>
            <Input id="cr" inputMode="decimal" value={v.currentReading} onChange={set("currentReading")}
              aria-invalid={invalid} className={invalid ? "border-destructive focus-visible:ring-destructive" : ""} />
          </F>
          <F label="Unit rate (₹)" id="ur"><Input id="ur" inputMode="decimal" value={v.unitRate} onChange={set("unitRate")} /></F>
          <F label="Units used" id="uu"><Input id="uu" value={formatNumber(result.unitsUsed)} readOnly className="bg-muted/40" /></F>
          <F label="Fixed charges (₹)" id="fc"><Input id="fc" inputMode="decimal" value={v.fixedCharges} onChange={set("fixedCharges")} /></F>
          <F label="Taxes / other (₹)" id="tx"><Input id="tx" inputMode="decimal" value={v.taxes} onChange={set("taxes")} /></F>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-card to-card">
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary"><Zap className="size-4" /></span>
          <CardTitle>Estimated bill</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="tabular text-4xl font-semibold tracking-tight">{formatCurrency(result.estimatedBill)}</p>
          <dl className="mt-5 space-y-2 text-sm">
            <Row label="Units used" value={`${formatNumber(result.unitsUsed)} units`} />
            <Row label={`Energy (${formatNumber(result.unitsUsed)} × ₹${num(v.unitRate)})`} value={formatCurrency(result.electricityCost)} />
            <Row label="Fixed charges" value={formatCurrency(num(v.fixedCharges))} />
            <Row label="Taxes / other" value={formatCurrency(num(v.taxes))} />
            <div className="my-2 border-t" />
            <Row label="Total estimated bill" value={formatCurrency(result.estimatedBill)} strong />
          </dl>
          <Button className="mt-6 w-full" onClick={onSave} disabled={saving}>
            {saving ? "Saving…" : editId ? "Update reading" : "Save to history"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function F({ label, id, error, children }: { label: string; id: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
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
