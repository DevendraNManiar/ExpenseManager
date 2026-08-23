"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Target, Check, Inbox } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { createGoal, updateGoal, deleteGoal, addContribution } from "@/server/actions/goals";
import type { GoalInput } from "@/lib/validations";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { GoalRow } from "@/server/queries/goals";

const iso = (s: string | null) => (s ? s.slice(0, 10) : "");
const monthYear = (s: string | null) =>
  s ? new Date(s).toLocaleString("en-US", { month: "short", year: "numeric" }) : null;

export function GoalsManager({ goals }: { goals: GoalRow[] }) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);

  async function onDelete(id: string) {
    if (!confirm("Delete this goal?")) return;
    setPending(id);
    const res = await deleteGoal(id);
    setPending(null);
    if (!res.ok) return toast.error(res.error ?? "Could not delete.");
    toast.success("Goal deleted");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <GoalSheet trigger={<Button size="sm"><Plus className="size-4" /> Add goal</Button>} />
      </div>

      {goals.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground"><Inbox className="size-6" /></span>
          <p className="font-medium">No goals yet.</p>
          <p className="max-w-xs text-sm text-muted-foreground">Set a target — an emergency fund, a trip, a new laptop — and track your progress.</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((g) => {
            const color = g.color ?? "#10b981";
            const done = g.status === "COMPLETED" || g.progressPct >= 100;
            return (
              <Card key={g.id} className="flex flex-col p-5">
                <div className="flex items-start justify-between">
                  <span className="flex size-10 items-center justify-center rounded-xl" style={{ background: `${color}20`, color }}>
                    <Target className="size-5" />
                  </span>
                  {done ? <Badge variant="success"><Check className="mr-1 size-3" /> Reached</Badge> : <Badge variant="secondary">{g.progressPct}%</Badge>}
                </div>

                <p className="mt-3 font-semibold">{g.name}</p>
                <p className="tabular text-sm text-muted-foreground">
                  {formatCurrency(g.currentAmount)} <span className="opacity-60">of</span> {formatCurrency(g.targetAmount)}
                </p>

                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(2, g.progressPct))}%`, background: color }} />
                </div>

                <dl className="mt-4 space-y-1.5 text-xs">
                  <Row label="Remaining" value={formatCurrency(g.remaining)} />
                  {g.requiredMonthly != null && <Row label="Needed / month" value={formatCurrency(g.requiredMonthly)} />}
                  {g.targetDate && <Row label="Target date" value={monthYear(g.targetDate)!} />}
                  {!g.targetDate && g.estimatedCompletion && !done && <Row label="Est. completion" value={monthYear(g.estimatedCompletion)!} />}
                </dl>

                <div className="mt-4 flex items-center gap-1 border-t pt-3">
                  {!done && <ContributeSheet goal={g} />}
                  <div className="ml-auto flex">
                    <GoalSheet goal={g} trigger={<Button variant="ghost" size="icon" className="size-8" aria-label="Edit"><Pencil className="size-4" /></Button>} />
                    <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive" aria-label="Delete" disabled={pending === g.id} onClick={() => onDelete(g.id)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="tabular font-medium">{value}</dd>
    </div>
  );
}

function ContributeSheet({ goal }: { goal: GoalRow }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    const amt = Number(amount);
    if (!amt || amt <= 0) return toast.error("Enter a valid amount.");
    setSaving(true);
    const res = await addContribution({ goalId: goal.id, amount: amt });
    setSaving(false);
    if (!res.ok) return toast.error(res.error ?? "Could not add.");
    toast.success(`Added ${formatCurrency(amt)} to ${goal.name}`);
    setOpen(false);
    setAmount("");
    router.refresh();
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="h-8"><Plus className="size-3.5" /> Contribute</Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-sm">
        <SheetHeader><SheetTitle>Contribute to {goal.name}</SheetTitle></SheetHeader>
        <div className="space-y-4 px-6 pb-6">
          <p className="text-sm text-muted-foreground">
            {formatCurrency(goal.currentAmount)} saved · {formatCurrency(goal.remaining)} to go.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="camt">Amount (₹)</Label>
            <Input id="camt" inputMode="decimal" autoFocus value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
          </div>
          <Button className="w-full" onClick={submit} disabled={saving}>{saving ? "Adding…" : "Add contribution"}</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function GoalSheet({ goal, trigger }: { goal?: GoalRow; trigger: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const td = String(f.get("targetDate") ?? "").trim();
    const mc = String(f.get("monthlyContribution") ?? "").trim();
    const payload: GoalInput = {
      name: String(f.get("name")),
      targetAmount: Number(f.get("targetAmount")),
      currentAmount: Number(f.get("currentAmount") || 0),
      targetDate: td ? new Date(td) : null,
      monthlyContribution: mc ? Number(mc) : null,
      color: String(f.get("color") ?? ""),
    };
    setSaving(true);
    const res = goal ? await updateGoal(goal.id, payload) : await createGoal(payload);
    setSaving(false);
    if (!res.ok) return toast.error(res.error ?? "Could not save.");
    toast.success(goal ? "Goal updated" : "Goal created");
    setOpen(false);
    router.refresh();
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader><SheetTitle>{goal ? "Edit goal" : "New goal"}</SheetTitle></SheetHeader>
        <form onSubmit={onSubmit} className="space-y-4 px-6 pb-6">
          <div className="space-y-1.5">
            <Label htmlFor="gn">Goal name</Label>
            <Input id="gn" name="name" required defaultValue={goal?.name} placeholder="Emergency fund, Goa trip…" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="gt">Target (₹)</Label>
              <Input id="gt" name="targetAmount" type="number" step="0.01" required defaultValue={goal?.targetAmount} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gc">Saved so far (₹)</Label>
              <Input id="gc" name="currentAmount" type="number" step="0.01" defaultValue={goal?.currentAmount ?? 0} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="gd">Target date</Label>
              <Input id="gd" name="targetDate" type="date" defaultValue={iso(goal?.targetDate ?? null)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gm">Monthly (₹)</Label>
              <Input id="gm" name="monthlyContribution" type="number" step="0.01" defaultValue={goal?.monthlyContribution ?? ""} placeholder="optional" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gcol">Colour</Label>
            <input id="gcol" name="color" type="color" defaultValue={goal?.color ?? "#10b981"} className="h-10 w-full cursor-pointer rounded-md border bg-background" />
          </div>
          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : goal ? "Save changes" : "Create goal"}</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
