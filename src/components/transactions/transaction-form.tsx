"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";
import { transactionSchema, type TransactionInput, transactionTypes } from "@/lib/validations";
import { createTransaction, updateTransaction } from "@/server/actions/transactions";
import type { CategoryRef, PaymentMethodRef } from "@/server/queries/refs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NONE = "__none__";
const typeLabels: Record<(typeof transactionTypes)[number], string> = {
  EXPENSE: "Expense",
  INCOME: "Income",
  INVESTMENT: "Investment",
  EMI: "EMI payment",
  BILL: "Bill",
  TRANSFER: "Transfer",
};

export interface TransactionFormValues {
  type: (typeof transactionTypes)[number];
  amount: string;
  date: string;
  categoryId: string;
  paymentMethodId: string;
  merchant: string;
  source: string;
  description: string;
  notes: string;
  tags: string;
}

interface Props {
  refs: { categories: CategoryRef[]; paymentMethods: PaymentMethodRef[] };
  defaultType?: (typeof transactionTypes)[number];
  editId?: string;
  initial?: Partial<TransactionFormValues>;
  onDone?: () => void;
}

const today = () => new Date().toISOString().slice(0, 10);

export function TransactionForm({ refs, defaultType = "EXPENSE", editId, initial, onDone }: Props) {
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setError,
    formState: { errors },
  } = useForm<TransactionFormValues>({
    defaultValues: {
      type: initial?.type ?? defaultType,
      amount: initial?.amount ?? "",
      date: initial?.date ?? today(),
      categoryId: initial?.categoryId ?? NONE,
      paymentMethodId: initial?.paymentMethodId ?? NONE,
      merchant: initial?.merchant ?? "",
      source: initial?.source ?? "",
      description: initial?.description ?? "",
      notes: initial?.notes ?? "",
      tags: initial?.tags ?? "",
    },
  });

  const type = watch("type");
  const isIncome = type === "INCOME";
  const categoryOptions = refs.categories.filter((c) => c.type === type);
  const cats = categoryOptions.length ? categoryOptions : refs.categories;

  async function onSubmit(values: TransactionFormValues) {
    const parsedInput = transactionSchema.safeParse({
      type: values.type,
      amount: values.amount,
      date: values.date,
      categoryId: values.categoryId === NONE ? undefined : values.categoryId,
      paymentMethodId: values.paymentMethodId === NONE ? undefined : values.paymentMethodId,
      merchant: values.merchant,
      source: values.source,
      description: values.description,
      notes: values.notes,
      tags: values.tags
        ? values.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [],
    });

    if (!parsedInput.success) {
      const fe = parsedInput.error.flatten().fieldErrors;
      for (const [k, v] of Object.entries(fe)) {
        setError(k as keyof TransactionFormValues, { message: v?.[0] });
      }
      toast.error("Please fix the highlighted fields.");
      return;
    }
    const payload: TransactionInput = parsedInput.data;

    setSubmitting(true);
    const res = editId
      ? await updateTransaction(editId, payload)
      : await createTransaction(payload);
    setSubmitting(false);

    if (!res.ok) {
      if (res.fieldErrors) {
        for (const [k, v] of Object.entries(res.fieldErrors)) {
          setError(k as keyof TransactionFormValues, { message: v?.[0] });
        }
      }
      toast.error(res.error ?? "Something went wrong.");
      return;
    }
    toast.success(editId ? "Transaction updated" : "Transaction added");
    onDone?.();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Type">
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {transactionTypes.map((t) => (
                    <SelectItem key={t} value={t}>{typeLabels[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        <Field label="Amount (₹)" error={errors.amount?.message}>
          <Input
            type="number"
            step="0.01"
            inputMode="decimal"
            placeholder="0"
            autoFocus
            {...register("amount")}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Date" error={errors.date?.message}>
          <Input type="date" {...register("date")} />
        </Field>
        <Field label="Category">
          <Controller
            control={control}
            name="categoryId"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Uncategorized</SelectItem>
                  {cats.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Payment method">
          <Controller
            control={control}
            name="paymentMethodId"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>—</SelectItem>
                  {refs.paymentMethods.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        {isIncome ? (
          <Field label="Source">
            <Input placeholder="Salary, Freelance…" {...register("source")} />
          </Field>
        ) : (
          <Field label="Merchant">
            <Input placeholder="Where?" {...register("merchant")} />
          </Field>
        )}
      </div>

      <Field label="Description">
        <Input placeholder="e.g. Lunch with team" {...register("description")} />
      </Field>

      <Field label="Tags (comma separated)">
        <Input placeholder="work, reimbursable" {...register("tags")} />
      </Field>

      <Field label="Notes">
        <Textarea placeholder="Optional notes" {...register("notes")} />
      </Field>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : editId ? "Save changes" : "Add transaction"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}
