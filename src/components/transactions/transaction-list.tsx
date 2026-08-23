"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Pencil, Trash2, ArrowDownLeft, ArrowUpRight, Inbox } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { TransactionSheet } from "@/components/transactions/transaction-sheet";
import { deleteTransaction } from "@/server/actions/transactions";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { TransactionRow } from "@/server/queries/transactions";
import type { CategoryRef, PaymentMethodRef } from "@/server/queries/refs";

const OUTFLOW = new Set(["EXPENSE", "EMI", "BILL"]);

export function TransactionList({
  rows,
  refs,
  emptyLabel = "No transactions yet.",
  emptyHint = "Add your first entry to see it here.",
}: {
  rows: TransactionRow[];
  refs: { categories: CategoryRef[]; paymentMethods: PaymentMethodRef[] };
  emptyLabel?: string;
  emptyHint?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);

  async function onDelete(id: string) {
    if (!confirm("Delete this transaction? This cannot be undone.")) return;
    setPending(id);
    const res = await deleteTransaction(id);
    setPending(null);
    if (!res.ok) {
      toast.error(res.error ?? "Could not delete.");
      return;
    }
    toast.success("Transaction deleted");
    router.refresh();
  }

  if (rows.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center gap-2 py-16 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <Inbox className="size-6" />
        </span>
        <p className="font-medium">{emptyLabel}</p>
        <p className="max-w-xs text-sm text-muted-foreground">{emptyHint}</p>
      </Card>
    );
  }

  return (
    <Card className="divide-y overflow-hidden">
      {rows.map((t, i) => {
        const outflow = OUTFLOW.has(t.type);
        const date = new Date(t.date);
        return (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.025, 0.3), duration: 0.25 }}
            className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/40"
          >
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-lg",
                outflow ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success",
              )}
            >
              {outflow ? <ArrowUpRight className="size-4" /> : <ArrowDownLeft className="size-4" />}
            </span>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {t.description || t.merchant || t.source || t.category?.name || "Transaction"}
              </p>
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                <span>{date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                {t.category && (
                  <>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1">
                      <span className="size-1.5 rounded-full" style={{ background: t.category.color ?? "#64748b" }} />
                      {t.category.name}
                    </span>
                  </>
                )}
                {t.paymentMethod && <><span>·</span><span>{t.paymentMethod.name}</span></>}
              </div>
            </div>

            {t.type !== "EXPENSE" && t.type !== "INCOME" && (
              <Badge variant="secondary" className="hidden sm:inline-flex">{t.type}</Badge>
            )}

            <span className={cn("tabular text-sm font-semibold", outflow ? "text-foreground" : "text-success")}>
              {outflow ? "−" : "+"}
              {formatCurrency(t.amount)}
            </span>

            <div className="flex items-center">
              <TransactionSheet
                refs={refs}
                editId={t.id}
                defaultType={t.type}
                title="Edit transaction"
                initial={{
                  type: t.type,
                  amount: String(t.amount),
                  date: t.date.slice(0, 10),
                  categoryId: t.category?.id,
                  paymentMethodId: t.paymentMethod?.id,
                  merchant: t.merchant ?? "",
                  source: t.source ?? "",
                  description: t.description ?? "",
                  notes: t.notes ?? "",
                  tags: t.tags.join(", "),
                }}
                trigger={
                  <Button variant="ghost" size="icon" className="size-8" aria-label="Edit">
                    <Pencil className="size-4" />
                  </Button>
                }
              />
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-destructive"
                aria-label="Delete"
                disabled={pending === t.id}
                onClick={() => onDelete(t.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </motion.div>
        );
      })}
    </Card>
  );
}
