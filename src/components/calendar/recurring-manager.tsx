"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Play, Repeat, Pause, Inbox } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { createRecurring, deleteRecurring, toggleRecurring, runDueRecurring } from "@/server/actions/recurring";
import { transactionTypes, recurringFrequencies, type RecurringInput } from "@/lib/validations";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { RecurringRow } from "@/server/queries/recurring";

const today = () => new Date().toISOString().slice(0, 10);

export function RecurringManager({ rows, dueCount }: { rows: RecurringRow[]; dueCount: number }) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  async function onRun() {
    setRunning(true);
    const res = await runDueRecurring();
    setRunning(false);
    if (!res.ok) return toast.error(res.error ?? "Could not run.");
    toast.success(res.generated ? `Generated ${res.generated} transaction${res.generated === 1 ? "" : "s"}` : "Nothing due right now");
    router.refresh();
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this recurring rule?")) return;
    setPending(id);
    const res = await deleteRecurring(id);
    setPending(null);
    if (!res.ok) return toast.error(res.error ?? "Could not delete.");
    toast.success("Rule deleted");
    router.refresh();
  }

  async function onToggle(id: string, next: boolean) {
    setPending(id);
    const res = await toggleRecurring(id, next);
    setPending(null);
    if (!res.ok) return toast.error(res.error ?? "Could not update.");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2"><Repeat className="size-4" /> Recurring transactions</CardTitle>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onRun} disabled={running}>
            <Play className="size-4" /> {running ? "Running…" : `Run due${dueCount ? ` (${dueCount})` : ""}`}
          </Button>
          <RecurringSheet trigger={<Button size="sm"><Plus className="size-4" /> Add</Button>} />
        </div>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-muted text-muted-foreground"><Inbox className="size-5" /></span>
            <p className="text-sm font-medium">No recurring rules yet.</p>
            <p className="max-w-xs text-xs text-muted-foreground">Add rent, salary, SIPs or subscriptions and generate them automatically.</p>
          </div>
        ) : (
          <div className="divide-y">
            {rows.map((r) => {
              const next = new Date(r.nextRunDate);
              const due = r.isActive && next <= new Date();
              return (
                <div key={r.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className={cn("truncate text-sm font-medium", !r.isActive && "text-muted-foreground")}>{r.name}</p>
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      <Badge variant="secondary">{r.frequency}</Badge>
                      <span>·</span>
                      <span>Next {next.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                      {due && <Badge variant="warning">Due</Badge>}
                      {!r.isActive && <Badge variant="outline">Paused</Badge>}
                    </div>
                  </div>
                  <span className="tabular text-sm font-semibold">{formatCurrency(r.amount)}</span>
                  <Button variant="ghost" size="icon" className="size-8" aria-label={r.isActive ? "Pause" : "Resume"} disabled={pending === r.id} onClick={() => onToggle(r.id, !r.isActive)}>
                    {r.isActive ? <Pause className="size-4" /> : <Play className="size-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive" aria-label="Delete" disabled={pending === r.id} onClick={() => onDelete(r.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RecurringSheet({ trigger }: { trigger: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [type, setType] = useState<RecurringInput["type"]>("EXPENSE");
  const [frequency, setFrequency] = useState<RecurringInput["frequency"]>("MONTHLY");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const endRaw = String(f.get("endDate") ?? "");
    const payload: RecurringInput = {
      type,
      name: String(f.get("name")),
      amount: Number(f.get("amount")),
      categoryName: String(f.get("categoryName") ?? ""),
      frequency,
      startDate: new Date(String(f.get("startDate"))),
      endDate: endRaw ? new Date(endRaw) : null,
      notes: String(f.get("notes") ?? ""),
    };
    setSaving(true);
    const res = await createRecurring(payload);
    setSaving(false);
    if (!res.ok) return toast.error(res.error ?? "Could not save.");
    toast.success("Recurring rule added");
    setOpen(false);
    router.refresh();
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader><SheetTitle>Add recurring transaction</SheetTitle></SheetHeader>
        <form onSubmit={onSubmit} className="space-y-4 px-6 pb-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as RecurringInput["type"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {transactionTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Frequency</Label>
              <Select value={frequency} onValueChange={(v) => setFrequency(v as RecurringInput["frequency"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {recurringFrequencies.map((fq) => <SelectItem key={fq} value={fq}>{fq}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rn">Name</Label>
            <Input id="rn" name="name" required placeholder="Rent, Salary, Netflix…" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="ra">Amount (₹)</Label>
              <Input id="ra" name="amount" type="number" step="0.01" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rcat">Category</Label>
              <Input id="rcat" name="categoryName" placeholder="Rent, Salary…" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="rs">Start date</Label>
              <Input id="rs" name="startDate" type="date" required defaultValue={today()} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="re">End date (optional)</Label>
              <Input id="re" name="endDate" type="date" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rnotes">Notes</Label>
            <Input id="rnotes" name="notes" placeholder="Optional" />
          </div>
          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Add rule"}</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
