import { Resend } from "resend";
import { formatCurrency } from "@/lib/format";

/**
 * Transactional email. When RESEND_API_KEY is unset (dev), emails are logged
 * to the console instead of sent, so the app runs without a provider.
 */

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.EMAIL_FROM ?? "Expense Manager <onboarding@resend.dev>";
const resend = apiKey ? new Resend(apiKey) : null;

interface SendArgs {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendArgs): Promise<void> {
  if (!resend) {
    console.info(`[email:dev] → ${to} · ${subject}`);
    return;
  }
  try {
    await resend.emails.send({ from, to, subject, html });
  } catch (error) {
    // Never let email failures break the originating action.
    console.error("[email] send failed:", error);
  }
}

function shell(title: string, body: string): string {
  return `<div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#0f172a">
    <div style="font-size:18px;font-weight:600">Expense<span style="color:#0d9488">Manager</span></div>
    <h1 style="font-size:20px;margin:16px 0 4px">${title}</h1>
    ${body}
    <p style="color:#64748b;font-size:12px;margin-top:24px">
      You’re receiving this because email alerts are enabled in Expense Manager. Manage preferences in Settings.
    </p>
  </div>`;
}

export function expenseAddedEmail(input: {
  amount: number;
  category: string;
  date: Date;
  paymentMethod?: string;
  description?: string;
  monthlySpend: number;
  remainingBudget?: number | null;
  currency: string;
}): { subject: string; html: string } {
  const { currency } = input;
  const subject = `Expense Added — ${formatCurrency(input.amount, currency)} ${input.category}`;
  const rows = [
    ["Amount", formatCurrency(input.amount, currency)],
    ["Category", input.category],
    ["Date", input.date.toLocaleDateString("en-IN")],
    ["Payment method", input.paymentMethod ?? "—"],
    ["Description", input.description || "—"],
    ["Spent this month", formatCurrency(input.monthlySpend, currency)],
    input.remainingBudget != null
      ? ["Remaining budget", formatCurrency(input.remainingBudget, currency)]
      : null,
  ].filter(Boolean) as [string, string][];

  const table = rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 0;color:#64748b">${k}</td><td style="padding:6px 0;text-align:right;font-weight:600">${v}</td></tr>`,
    )
    .join("");

  return {
    subject,
    html: shell(
      subject,
      `<table style="width:100%;border-collapse:collapse;font-size:14px">${table}</table>`,
    ),
  };
}

export { shell as emailShell };
