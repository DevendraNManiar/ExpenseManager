"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { TransactionForm, type TransactionFormValues } from "@/components/transactions/transaction-form";
import type { CategoryRef, PaymentMethodRef } from "@/server/queries/refs";
import type { transactionTypes } from "@/lib/validations";

interface Props {
  refs: { categories: CategoryRef[]; paymentMethods: PaymentMethodRef[] };
  defaultType?: (typeof transactionTypes)[number];
  editId?: string;
  initial?: Partial<TransactionFormValues>;
  trigger?: React.ReactNode;
  title?: string;
}

export function TransactionSheet({
  refs,
  defaultType = "EXPENSE",
  editId,
  initial,
  trigger,
  title,
}: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const heading =
    title ?? (editId ? "Edit transaction" : defaultType === "INCOME" ? "Add income" : "Add expense");

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus className="size-4" /> Add {defaultType === "INCOME" ? "income" : "expense"}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{heading}</SheetTitle>
          <SheetDescription>
            Saved instantly — your dashboard, budgets and charts update right away.
          </SheetDescription>
        </SheetHeader>
        <div className="px-6 pb-6">
          <TransactionForm
            refs={refs}
            defaultType={defaultType}
            editId={editId}
            initial={initial}
            onDone={() => {
              setOpen(false);
              router.refresh();
            }}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
