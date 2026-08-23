/**
 * MoneyOS finance engine — pure functions, no I/O.
 * All money in major units (₹), rounded to 2 dp where returned.
 */

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

// ── EMI ────────────────────────────────────────────────────────

export interface EmiResult {
  emi: number;
  totalInterest: number;
  totalPayable: number;
  principal: number;
}

/**
 * Standard reducing-balance EMI.
 * EMI = P·r·(1+r)^n / ((1+r)^n − 1), where r = monthlyRate.
 */
export function calculateEmi(
  principal: number,
  annualRatePct: number,
  tenureMonths: number,
): EmiResult {
  if (principal <= 0 || tenureMonths <= 0) {
    return { emi: 0, totalInterest: 0, totalPayable: 0, principal: 0 };
  }
  const r = annualRatePct / 12 / 100;
  let emi: number;
  if (r === 0) {
    emi = principal / tenureMonths;
  } else {
    const pow = Math.pow(1 + r, tenureMonths);
    emi = (principal * r * pow) / (pow - 1);
  }
  const totalPayable = emi * tenureMonths;
  return {
    emi: round2(emi),
    totalPayable: round2(totalPayable),
    totalInterest: round2(totalPayable - principal),
    principal: round2(principal),
  };
}

export interface AmortRow {
  installmentNo: number;
  dueDate: Date;
  principalPart: number;
  interestPart: number;
  emiAmount: number;
  balanceAfter: number;
}

/** Full amortization schedule (reducing balance). */
export function amortizationSchedule(
  principal: number,
  annualRatePct: number,
  tenureMonths: number,
  startDate: Date,
): AmortRow[] {
  const { emi } = calculateEmi(principal, annualRatePct, tenureMonths);
  const r = annualRatePct / 12 / 100;
  const rows: AmortRow[] = [];
  let balance = principal;

  for (let i = 1; i <= tenureMonths; i++) {
    const interestPart = round2(balance * r);
    let principalPart = round2(emi - interestPart);
    // Absorb rounding drift into the final installment.
    if (i === tenureMonths || principalPart > balance) principalPart = round2(balance);
    balance = round2(balance - principalPart);

    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i);

    rows.push({
      installmentNo: i,
      dueDate,
      principalPart,
      interestPart,
      emiAmount: round2(principalPart + interestPart),
      balanceAfter: Math.max(0, balance),
    });
  }
  return rows;
}

// ── Loan affordability (spec §19) ──────────────────────────────

export type AffordabilityLevel = "healthy" | "caution" | "risk";

export interface AffordabilityResult {
  availableIncome: number; // income − expenses − existing EMIs
  afterNewEmi: number;
  emiToIncomeRatio: number; // (existing + new EMI) / income, %
  level: AffordabilityLevel;
  message: string;
}

/**
 * EMI-to-income based affordability. Widely-used thresholds:
 *   ≤ 40% healthy, 40–50% caution, > 50% risk.
 */
export function assessAffordability(input: {
  monthlyIncome: number;
  monthlyExpenses: number;
  existingEmi: number;
  newEmi: number;
}): AffordabilityResult {
  const { monthlyIncome, monthlyExpenses, existingEmi, newEmi } = input;
  const availableIncome = monthlyIncome - monthlyExpenses - existingEmi;
  const afterNewEmi = availableIncome - newEmi;
  const totalEmi = existingEmi + newEmi;
  const ratio = monthlyIncome > 0 ? (totalEmi / monthlyIncome) * 100 : 100;

  let level: AffordabilityLevel;
  let message: string;
  if (ratio <= 40) {
    level = "healthy";
    message = "You can comfortably afford this EMI.";
  } else if (ratio <= 50) {
    level = "caution";
    message = "This EMI will significantly reduce your monthly disposable income.";
  } else {
    level = "risk";
    message = "This EMI may put pressure on your monthly cash flow.";
  }

  return {
    availableIncome: round2(availableIncome),
    afterNewEmi: round2(afterNewEmi),
    emiToIncomeRatio: round2(ratio),
    level,
    message,
  };
}

// ── Electricity (spec §13) ─────────────────────────────────────

export interface ElectricityResult {
  unitsUsed: number;
  electricityCost: number;
  estimatedBill: number;
}

export function calculateElectricity(input: {
  previousReading: number;
  currentReading: number;
  unitRate: number;
  fixedCharges?: number;
  taxes?: number;
}): ElectricityResult {
  const unitsUsed = Math.max(0, input.currentReading - input.previousReading);
  const electricityCost = unitsUsed * input.unitRate;
  const estimatedBill =
    electricityCost + (input.fixedCharges ?? 0) + (input.taxes ?? 0);
  return {
    unitsUsed: round2(unitsUsed),
    electricityCost: round2(electricityCost),
    estimatedBill: round2(estimatedBill),
  };
}

// ── Savings rate & goals ───────────────────────────────────────

export function savingsRate(income: number, expenses: number): number {
  if (income <= 0) return 0;
  return round2(((income - expenses) / income) * 100);
}

// ── Financial health score (spec §41) ──────────────────────────
// Transparent, informational only — NOT financial advice.

export interface HealthInput {
  monthlyIncome: number;
  monthlyExpenses: number;
  existingEmi: number;
  currentSavings: number;
  overBudget: boolean;
}

/**
 * 0–100 score from four transparent components:
 *   savings rate (0–40), EMI-to-income (0–30), emergency buffer (0–20),
 *   budget adherence (0–10).
 */
export function computeHealthScore(input: HealthInput): number {
  const rate = savingsRate(input.monthlyIncome, input.monthlyExpenses);
  const savingsPts = Math.max(0, Math.min(40, rate * 0.8));

  const emiRatio =
    input.monthlyIncome > 0 ? (input.existingEmi / input.monthlyIncome) * 100 : 100;
  const emiPts = emiRatio <= 20 ? 30 : emiRatio <= 40 ? 22 : emiRatio <= 50 ? 12 : 4;

  const monthsBuffer =
    input.monthlyExpenses > 0 ? input.currentSavings / input.monthlyExpenses : 0;
  const bufferPts = Math.max(0, Math.min(20, (monthsBuffer / 3) * 20));

  const budgetPts = input.overBudget ? 0 : 10;

  return Math.round(
    Math.max(0, Math.min(100, savingsPts + emiPts + bufferPts + budgetPts)),
  );
}

export interface GoalProjection {
  progressPct: number;
  remaining: number;
  requiredMonthly: number | null; // null when no target date
  monthsToTarget: number | null;
}

export function projectGoal(input: {
  targetAmount: number;
  currentAmount: number;
  targetDate?: Date | null;
  now?: Date;
}): GoalProjection {
  const { targetAmount, currentAmount } = input;
  const now = input.now ?? new Date();
  const remaining = Math.max(0, targetAmount - currentAmount);
  const progressPct =
    targetAmount > 0 ? round2(Math.min(100, (currentAmount / targetAmount) * 100)) : 0;

  let requiredMonthly: number | null = null;
  let monthsToTarget: number | null = null;
  if (input.targetDate) {
    const months =
      (input.targetDate.getFullYear() - now.getFullYear()) * 12 +
      (input.targetDate.getMonth() - now.getMonth());
    monthsToTarget = Math.max(0, months);
    requiredMonthly = monthsToTarget > 0 ? round2(remaining / monthsToTarget) : remaining;
  }
  return { progressPct, remaining: round2(remaining), requiredMonthly, monthsToTarget };
}
