import { z } from "zod";

/** Shared Zod schemas — the single source of truth for input validation. */

export const transactionTypes = [
  "EXPENSE",
  "INCOME",
  "INVESTMENT",
  "EMI",
  "BILL",
  "TRANSFER",
] as const;

export const transactionSchema = z.object({
  type: z.enum(transactionTypes).default("EXPENSE"),
  // Amount must be positive (spec §35). Coerce from string form inputs.
  amount: z.coerce
    .number({ invalid_type_error: "Enter a valid amount" })
    .positive("Amount must be greater than zero")
    .max(1_000_000_000, "Amount is too large"),
  date: z.coerce.date({ invalid_type_error: "Pick a valid date" }),
  categoryId: z.string().cuid().optional().nullable(),
  paymentMethodId: z.string().cuid().optional().nullable(),
  description: z.string().trim().max(200).optional().or(z.literal("")),
  merchant: z.string().trim().max(120).optional().or(z.literal("")),
  source: z.string().trim().max(120).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  tags: z.array(z.string().trim().max(40)).max(20).optional().default([]),
});

export type TransactionInput = z.infer<typeof transactionSchema>;

export const budgetItemSchema = z.object({
  categoryId: z.string().cuid(),
  limit: z.coerce.number().nonnegative("Limit cannot be negative"),
});

export const budgetSchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
  items: z.array(budgetItemSchema).max(50),
});

export type BudgetInput = z.infer<typeof budgetSchema>;

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(40),
  type: z.enum(transactionTypes).default("EXPENSE"),
  color: z.string().max(20).optional(),
  icon: z.string().max(40).optional(),
});

export const signupSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "Use at least 8 characters").max(100),
});

export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

// ── Utilities: electricity reading (spec §13–15, §35) ──────────

export const utilityReadingSchema = z
  .object({
    type: z.string().trim().min(1).max(30).default("electricity"),
    label: z.string().trim().max(60).optional().or(z.literal("")),
    month: z.coerce.number().int().min(1).max(12),
    year: z.coerce.number().int().min(2000).max(2100),
    readingDate: z.coerce.date(),
    previousReading: z.coerce.number().nonnegative("Cannot be negative"),
    currentReading: z.coerce.number().nonnegative("Cannot be negative"),
    unitRate: z.coerce.number().nonnegative("Rate cannot be negative"),
    fixedCharges: z.coerce.number().nonnegative().default(0),
    taxes: z.coerce.number().nonnegative().default(0),
    notes: z.string().trim().max(500).optional().or(z.literal("")),
  })
  // Current reading cannot be less than previous (spec §35).
  .refine((d) => d.currentReading >= d.previousReading, {
    message: "Current reading must be ≥ previous reading",
    path: ["currentReading"],
  });

export type UtilityReadingInput = z.infer<typeof utilityReadingSchema>;

// ── Bills (spec §24) ───────────────────────────────────────────

export const billSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  category: z.string().trim().max(40).optional().or(z.literal("")),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  dueDate: z.coerce.date(),
  isRecurring: z.coerce.boolean().default(false),
  frequency: z.enum(["MONTHLY", "QUARTERLY", "YEARLY"]).optional(),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export type BillInput = z.infer<typeof billSchema>;

// ── Recurring transactions (spec §23) ──────────────────────────

export const recurringFrequencies = ["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"] as const;

export const recurringSchema = z.object({
  type: z.enum(transactionTypes).default("EXPENSE"),
  name: z.string().trim().min(1, "Name is required").max(80),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  categoryName: z.string().trim().max(40).optional().or(z.literal("")),
  frequency: z.enum(recurringFrequencies).default("MONTHLY"),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional().nullable(),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export type RecurringInput = z.infer<typeof recurringSchema>;
