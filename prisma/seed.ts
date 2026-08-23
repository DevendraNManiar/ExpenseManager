/**
 * MoneyOS seed (spec §39). Creates a demo user with realistic data so the
 * app looks impressive immediately after setup.
 *
 * Run with: npm run db:seed
 * Demo login → email: demo@moneyos.app  password: demo1234
 */
import { PrismaClient, TransactionType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEFAULT_CATEGORIES: { name: string; type: TransactionType; color: string }[] = [
  { name: "Food", type: "EXPENSE", color: "#10b981" },
  { name: "Groceries", type: "EXPENSE", color: "#22c55e" },
  { name: "Transport", type: "EXPENSE", color: "#f59e0b" },
  { name: "Rent", type: "EXPENSE", color: "#0ea5e9" },
  { name: "Electricity", type: "EXPENSE", color: "#ef4444" },
  { name: "Shopping", type: "EXPENSE", color: "#a855f7" },
  { name: "Entertainment", type: "EXPENSE", color: "#ec4899" },
  { name: "Healthcare", type: "EXPENSE", color: "#14b8a6" },
  { name: "EMI", type: "EMI", color: "#f97316" },
  { name: "Salary", type: "INCOME", color: "#16a34a" },
  { name: "Freelance", type: "INCOME", color: "#0891b2" },
];

async function main() {
  const passwordHash = await bcrypt.hash("demo1234", 10);

  const user = await prisma.user.upsert({
    where: { email: "demo@moneyos.app" },
    update: {},
    create: {
      email: "demo@moneyos.app",
      name: "Jaimin",
      passwordHash,
      emailVerified: new Date(),
      onboardedAt: new Date(),
      profile: {
        create: {
          currency: "INR",
          monthlyIncome: 92000,
          monthlyFixedExpenses: 30000,
          currentSavings: 318450,
        },
      },
      notificationPref: { create: {} },
      dashboardPref: { create: {} },
    },
  });

  // Categories
  const categories = await Promise.all(
    DEFAULT_CATEGORIES.map((c) =>
      prisma.category.upsert({
        where: { userId_name_type: { userId: user.id, name: c.name, type: c.type } },
        update: {},
        create: { ...c, userId: user.id },
      }),
    ),
  );
  const catByName = Object.fromEntries(categories.map((c) => [c.name, c]));

  // Payment methods
  await Promise.all(
    ["UPI", "Credit Card", "Cash", "Net Banking"].map((name, i) =>
      prisma.paymentMethod.upsert({
        where: { userId_name: { userId: user.id, name } },
        update: {},
        create: { userId: user.id, name, isDefault: i === 0 },
      }),
    ),
  );

  // A month of demo transactions
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const sample: { amount: number; cat: string; day: number; type: TransactionType; desc: string }[] = [
    { amount: 92000, cat: "Salary", day: 1, type: "INCOME", desc: "Monthly salary" },
    { amount: 15000, cat: "Rent", day: 3, type: "EXPENSE", desc: "House rent" },
    { amount: 450, cat: "Food", day: 4, type: "EXPENSE", desc: "Lunch" },
    { amount: 1200, cat: "Groceries", day: 6, type: "EXPENSE", desc: "Weekly groceries" },
    { amount: 2000, cat: "Shopping", day: 8, type: "EXPENSE", desc: "Clothes" },
    { amount: 1955, cat: "Electricity", day: 10, type: "EXPENSE", desc: "August electricity" },
    { amount: 12450, cat: "EMI", day: 5, type: "EMI", desc: "Home loan EMI" },
    { amount: 800, cat: "Transport", day: 12, type: "EXPENSE", desc: "Fuel" },
    { amount: 1500, cat: "Entertainment", day: 15, type: "EXPENSE", desc: "Movie + dinner" },
  ];

  await prisma.transaction.deleteMany({ where: { userId: user.id } });
  await prisma.transaction.createMany({
    data: sample.map((s) => ({
      userId: user.id,
      type: s.type,
      amount: s.amount,
      date: new Date(y, m, s.day),
      description: s.desc,
      categoryId: catByName[s.cat]?.id ?? null,
    })),
  });

  // Goals
  await prisma.financialGoal.deleteMany({ where: { userId: user.id } });
  await prisma.financialGoal.createMany({
    data: [
      { userId: user.id, name: "Emergency Fund", targetAmount: 100000, currentAmount: 65000, color: "#10b981" },
      { userId: user.id, name: "New Laptop", targetAmount: 120000, currentAmount: 48000, color: "#0ea5e9" },
    ],
  });

  console.log(`✓ Seeded demo user ${user.email} (password: demo1234)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
