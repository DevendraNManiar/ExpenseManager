"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, TrendingUp, Inbox } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createInvestment, updateInvestment, deleteInvestment } from "@/server/actions/investments";
import { investmentTypes, type InvestmentInput } from "@/lib/validations";
import { formatCurrency, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { InvestmentRow } from "@/server/queries/investments";

const today = () => new Date().toISOString().slice(0, 10);
const typeLabel = (t: string) => t.replace("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

export function InvestmentsManager({ rows }: { rows: InvestmentRow[] }) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);

  async function onDelete(id: string) {
    if (!confirm("Delete this investment?")) return;
    setPending(id);
    const res = await deleteInvestment(id);
    setPending(null);
    if (!res.ok) return toast.error(res.error ?? "Could not delete.");
    toast.success("Investment deleted");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <InvestmentSheet trigger={<Button size="sm"><Plus className="size-4" /> Add investment</Button>} />
      </div>

      {rows.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-2 py-14 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground"><Inbox className="size-6" /></span>
          <p className="font-medium">No investments yet.</p>
          <p className="max-w-xs text-sm text-muted-foreground">Add your stocks, mutual funds, FDs, gold or crypto to track P/L and ROI.</p>
        </Card>
      ) : (
        <Card className="divide-y overflow-hidden">
          {rows.map((i) => {
            const up = i.pl >= 0;
            return (
              <div key={i.id} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/40">
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><TrendingUp className="size-4" /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{i.name}</p>
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    <Badge variant="secondary">{typeLabel(i.type)}</Badge>
                    <span>Invested {formatCurrency(i.amountInvested)}</span>
                    {i.platform && <><span>·</span><span>{i.platform}</span></>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="tabular text-sm font-semibold">{formatCurrency(i.currentValue)}</p>
                  <p className={cn("tabular text-xs font-medium", up ? "text-success" : "text-destructive")}>
                    {up ? "+" : ""}{formatCurrency(i.pl)} · {formatPercent(i.roiPct)}
                  </p>
                </div>
                <div className="flex items-center">
                  <InvestmentSheet
                    investment={i}
                    trigger={<Button variant="ghost" size="icon" className="size-8" aria-label="Edit"><Pencil className="size-4" /></Button>}
                  />
                  <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive" aria-label="Delete" disabled={pending === i.id} onClick={() => onDelete(i.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}

function InvestmentSheet({ investment, trigger }: { investment?: InvestmentRow; trigger: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [type, setType] = useState<InvestmentInput["type"]>(investment?.type ?? "STOCK");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const n = (k: string) => { const v = String(f.get(k) ?? "").trim(); return v === "" ? null : Number(v); };
    const payload: InvestmentInput = {
      name: String(f.get("name")),
      type,
      amountInvested: Number(f.get("amountInvested")),
      quantity: n("quantity"),
      purchasePrice: n("purchasePrice"),
      purchaseDate: new Date(String(f.get("purchaseDate"))),
      currentValue: n("currentValue"),
      expectedReturn: null,
      platform: String(f.get("platform") ?? ""),
      notes: "",
    };
    setSaving(true);
    const res = investment ? await updateInvestment(investment.id, payload) : await createInvestment(payload);
    setSaving(false);
    if (!res.ok) return toast.error(res.error ?? "Could not save.");
    toast.success(investment ? "Investment updated" : "Investment added");
    setOpen(false);
    router.refresh();
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader><SheetTitle>{investment ? "Edit investment" : "Add investment"}</SheetTitle></SheetHeader>
        <form onSubmit={onSubmit} className="space-y-4 px-6 pb-6">
          <div className="space-y-1.5">
            <Label htmlFor="in">Name</Label>
            <Input id="in" name="name" required defaultValue={investment?.name} placeholder="e.g. Nifty 50 Index Fund" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as InvestmentInput["type"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {investmentTypes.map((t) => <SelectItem key={t} value={t}>{typeLabel(t)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ipd">Purchase date</Label>
              <Input id="ipd" name="purchaseDate" type="date" required defaultValue={investment ? investment.purchaseDate.slice(0, 10) : today()} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="iai">Amount invested (₹)</Label>
              <Input id="iai" name="amountInvested" type="number" step="0.01" required defaultValue={investment?.amountInvested} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="icv">Current value (₹)</Label>
              <Input id="icv" name="currentValue" type="number" step="0.01" defaultValue={investment?.currentValue ?? ""} placeholder="optional" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="iq">Quantity</Label>
              <Input id="iq" name="quantity" type="number" step="any" defaultValue={investment?.quantity ?? ""} placeholder="optional" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ipp">Buy price (₹)</Label>
              <Input id="ipp" name="purchasePrice" type="number" step="0.01" defaultValue={investment?.purchasePrice ?? ""} placeholder="optional" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ipl">Platform / broker</Label>
            <Input id="ipl" name="platform" defaultValue={investment?.platform ?? ""} placeholder="Zerodha, Groww…" />
          </div>
          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : investment ? "Save changes" : "Add investment"}</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
