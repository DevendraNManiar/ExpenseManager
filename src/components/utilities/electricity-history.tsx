"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2, Copy, Inbox } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ElectricityReadingForm, type ReadingFormValues } from "@/components/utilities/electricity-reading-form";
import { deleteReading } from "@/server/actions/utility";
import { formatCurrency, formatNumber } from "@/lib/format";
import { MONTH_LABELS } from "@/lib/dates";
import type { ReadingRow } from "@/server/queries/utility";

export function ElectricityHistory({ rows }: { rows: ReadingRow[] }) {
  const router = useRouter();
  const [edit, setEdit] = useState<{ mode: "edit" | "duplicate"; row: ReadingRow } | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  async function onDelete(id: string) {
    if (!confirm("Delete this reading?")) return;
    setPending(id);
    const res = await deleteReading(id);
    setPending(null);
    if (!res.ok) return toast.error(res.error ?? "Could not delete.");
    toast.success("Reading deleted");
    router.refresh();
  }

  if (rows.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center gap-2 py-14 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground"><Inbox className="size-6" /></span>
        <p className="font-medium">No readings saved yet.</p>
        <p className="max-w-xs text-sm text-muted-foreground">Save a reading above to start building your electricity history.</p>
      </Card>
    );
  }

  const toFormValues = (r: ReadingRow, duplicate: boolean): Partial<ReadingFormValues> => ({
    label: r.label ?? "",
    month: String(duplicate ? (r.month % 12) + 1 : r.month),
    year: String(duplicate && r.month === 12 ? r.year + 1 : r.year),
    readingDate: r.readingDate.slice(0, 10),
    // Duplicate: previous = this reading's current (spec §45).
    previousReading: String(duplicate ? r.currentReading : r.previousReading),
    currentReading: duplicate ? "" : String(r.currentReading),
    unitRate: String(r.unitRate),
    fixedCharges: String(r.fixedCharges),
    taxes: String(r.taxes),
    notes: r.notes ?? "",
  });

  return (
    <>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">Month</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 text-right font-medium">Previous</th>
                <th className="px-4 py-3 text-right font-medium">Current</th>
                <th className="px-4 py-3 text-right font-medium">Units</th>
                <th className="px-4 py-3 text-right font-medium">Rate</th>
                <th className="px-4 py-3 text-right font-medium">Bill</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((r) => (
                <tr key={r.id} className="transition-colors hover:bg-accent/40">
                  <td className="whitespace-nowrap px-4 py-3 font-medium">
                    {r.label || `${MONTH_LABELS[r.month - 1]} ${r.year}`}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {new Date(r.readingDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </td>
                  <td className="tabular px-4 py-3 text-right">{formatNumber(r.previousReading)}</td>
                  <td className="tabular px-4 py-3 text-right">{formatNumber(r.currentReading)}</td>
                  <td className="tabular px-4 py-3 text-right font-medium">{formatNumber(r.unitsUsed)}</td>
                  <td className="tabular px-4 py-3 text-right text-muted-foreground">₹{r.unitRate}</td>
                  <td className="tabular px-4 py-3 text-right font-semibold">{formatCurrency(r.estimatedBill)}</td>
                  <td className="whitespace-nowrap px-2 py-3 text-right">
                    <Button variant="ghost" size="icon" className="size-8" aria-label="Duplicate" onClick={() => setEdit({ mode: "duplicate", row: r })}>
                      <Copy className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="size-8" aria-label="Edit" onClick={() => setEdit({ mode: "edit", row: r })}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive" aria-label="Delete" disabled={pending === r.id} onClick={() => onDelete(r.id)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Sheet open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <SheetContent className="overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{edit?.mode === "duplicate" ? "Duplicate reading" : "Edit reading"}</SheetTitle>
            <SheetDescription>
              {edit?.mode === "duplicate"
                ? "Previous reading is pre-filled from the selected month's current reading."
                : "Update the saved reading — the bill recalculates automatically."}
            </SheetDescription>
          </SheetHeader>
          <div className="px-6 pb-6">
            {edit && (
              <ElectricityReadingForm
                compact
                editId={edit.mode === "edit" ? edit.row.id : undefined}
                initial={toFormValues(edit.row, edit.mode === "duplicate")}
                onDone={() => setEdit(null)}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
