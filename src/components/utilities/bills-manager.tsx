"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Check, RotateCcw, Inbox, CalendarClock } from "lucide-react";
import { Card } from "@/components/ui/card";
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
import { createBill, updateBill, deleteBill, toggleBillPaid } from "@/server/actions/bills";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { BillRow } from "@/server/queries/bills";
import type { BillInput } from "@/lib/validations";

const today = () => new Date().toISOString().slice(0, 10);

export function BillsManager({ rows }: { rows: BillRow[] }) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);

  async function onDelete(id: string) {
    if (!confirm("Delete this bill?")) return;
    setPending(id);
    const res = await deleteBill(id);
    setPending(null);
    if (!res.ok) return toast.error(res.error ?? "Could not delete.");
    toast.success("Bill deleted");
    router.refresh();
  }

  async function onToggle(id: string, next: boolean) {
    setPending(id);
    const res = await toggleBillPaid(id, next);
    setPending(null);
    if (!res.ok) return toast.error(res.error ?? "Could not update.");
    toast.success(next ? "Marked paid" : "Marked pending");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <BillSheet trigger={<Button size="sm"><Plus className="size-4" /> Add bill</Button>} />
      </div>

      {rows.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-2 py-14 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground"><Inbox className="size-6" /></span>
          <p className="font-medium">No bills tracked yet.</p>
          <p className="max-w-xs text-sm text-muted-foreground">Add recurring or one-off bills to see them in your calendar and upcoming widget.</p>
        </Card>
      ) : (
        <Card className="divide-y overflow-hidden">
          {rows.map((b) => {
            const due = new Date(b.dueDate);
            const overdue = !b.isPaid && due < new Date();
            return (
              <div key={b.id} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/40">
                <span className={cn("flex size-9 items-center justify-center rounded-lg", b.isPaid ? "bg-success/10 text-success" : "bg-primary/10 text-primary")}>
                  <CalendarClock className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className={cn("truncate text-sm font-medium", b.isPaid && "text-muted-foreground line-through")}>{b.name}</p>
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    <span>Due {due.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                    {b.isRecurring && <><span>·</span><Badge variant="secondary">{b.frequency}</Badge></>}
                    {overdue && <Badge variant="destructive">Overdue</Badge>}
                  </div>
                </div>
                <span className="tabular text-sm font-semibold">{formatCurrency(b.amount)}</span>
                <Button variant="ghost" size="icon" className="size-8" aria-label={b.isPaid ? "Mark pending" : "Mark paid"} disabled={pending === b.id} onClick={() => onToggle(b.id, !b.isPaid)}>
                  {b.isPaid ? <RotateCcw className="size-4" /> : <Check className="size-4 text-success" />}
                </Button>
                <BillSheet bill={b} trigger={<Button variant="ghost" size="icon" className="size-8" aria-label="Edit"><Pencil className="size-4" /></Button>} />
                <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive" aria-label="Delete" disabled={pending === b.id} onClick={() => onDelete(b.id)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}

function BillSheet({ bill, trigger }: { bill?: BillRow; trigger: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [recurring, setRecurring] = useState(bill?.isRecurring ?? false);
  const [frequency, setFrequency] = useState(bill?.frequency ?? "MONTHLY");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const payload: BillInput = {
      name: String(f.get("name")),
      category: String(f.get("category") ?? ""),
      amount: Number(f.get("amount")),
      dueDate: new Date(String(f.get("dueDate"))),
      isRecurring: recurring,
      frequency: recurring ? (frequency as BillInput["frequency"]) : undefined,
      notes: String(f.get("notes") ?? ""),
    };
    setSaving(true);
    const res = bill ? await updateBill(bill.id, payload) : await createBill(payload);
    setSaving(false);
    if (!res.ok) return toast.error(res.error ?? "Could not save.");
    toast.success(bill ? "Bill updated" : "Bill added");
    setOpen(false);
    router.refresh();
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader><SheetTitle>{bill ? "Edit bill" : "Add bill"}</SheetTitle></SheetHeader>
        <form onSubmit={onSubmit} className="space-y-4 px-6 pb-6">
          <div className="space-y-1.5">
            <Label htmlFor="bn">Name</Label>
            <Input id="bn" name="name" required defaultValue={bill?.name} placeholder="Internet, Insurance…" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="ba">Amount (₹)</Label>
              <Input id="ba" name="amount" type="number" step="0.01" required defaultValue={bill?.amount} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bd">Due date</Label>
              <Input id="bd" name="dueDate" type="date" required defaultValue={bill ? bill.dueDate.slice(0, 10) : today()} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bc">Category</Label>
            <Input id="bc" name="category" defaultValue={bill?.category ?? ""} placeholder="Utilities, Insurance…" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} className="size-4 accent-[hsl(var(--primary))]" />
            Recurring bill
          </label>
          {recurring && (
            <div className="space-y-1.5">
              <Label>Frequency</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                  <SelectItem value="YEARLY">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="bnotes">Notes</Label>
            <Input id="bnotes" name="notes" defaultValue={bill?.notes ?? ""} placeholder="Optional" />
          </div>
          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : bill ? "Save changes" : "Add bill"}</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
