# Expense Manager

> Understand your money. Plan your future. Stay in control.

Expense Manager is a premium personal finance command center that unifies
expenses, income, budgets, bills, the electricity calculator, investments, IPOs,
loans, goals, reports and insights — with a 3D dashboard, a `Ctrl+K` command
palette, and a mobile-first UI.

Live: **https://expensemanagerde.in**

## Stack

| Layer      | Choice                                             |
| ---------- | -------------------------------------------------- |
| Framework  | Next.js 15 (App Router) · React 19 · TypeScript    |
| Styling    | Tailwind CSS · shadcn-style components · CSS tokens |
| Motion     | Framer Motion (respects `prefers-reduced-motion`)  |
| Charts     | Recharts                                            |
| Database   | PostgreSQL · Prisma ORM                             |
| Auth       | NextAuth (credentials + email verification)        |
| Email      | Resend                                             |
| Validation | Zod · React Hook Form                               |

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Start PostgreSQL (Docker) — or point DATABASE_URL at your own
docker compose up -d

# 3. Configure environment
cp .env.example .env      # then edit values

# 4. Create the schema and seed demo data
npm run db:push
npm run db:seed

# 5. Run the app
npm run dev               # http://localhost:3000
```

Demo login (after seeding): **demo@expensemanagerde.in** / **demo1234**

> Using it from your phone? Open the **Network** URL that `npm run dev` prints
> (e.g. `http://192.168.1.42:3000`). LAN origins are auto-allowed for Server
> Actions in `next.config.mjs`.

## Deploy to Vercel

1. Provision a hosted Postgres (Neon, Supabase or Vercel Postgres) and copy its
   connection string.
2. Import the GitHub repo into Vercel (framework auto-detected: Next.js).
3. Set environment variables in Vercel → Settings → Environment Variables:
   `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL=https://expensemanagerde.in`,
   `NEXT_PUBLIC_APP_URL=https://expensemanagerde.in`, and optionally
   `RESEND_API_KEY` / `EMAIL_FROM`.
4. Push the schema to the production DB (from your machine, with `DATABASE_URL`
   set to the hosted DB): `npm run db:push` (and `npm run db:seed` for demo data).
5. Deploy. `npm run build` runs `prisma generate` automatically.
6. Add the domain `expensemanagerde.in` in Vercel → Domains and point Hostinger's
   DNS at Vercel (A record `76.76.21.21`, or the CNAME Vercel shows).

## Useful scripts

| Script              | Purpose                             |
| ------------------- | ----------------------------------- |
| `npm run dev`       | Start the dev server                |
| `npm run build`     | Generate Prisma client + build      |
| `npm run typecheck` | `tsc --noEmit`                      |
| `npm run db:push`   | Push Prisma schema to the database  |
| `npm run db:seed`   | Seed a demo user with realistic data |
| `npm run db:studio` | Open Prisma Studio                  |

## Architecture

```
src/
  app/
    (app)/            # authenticated shell: sidebar + topbar + mobile nav
      dashboard/      # the command center (§5–7, §41, §46)
      utilities/      # working electricity calculator (§13)
      …               # module routes (expenses, loans, goals, …)
    layout.tsx        # fonts, theme provider
    page.tsx          # marketing landing
  components/
    ui/               # shadcn-style primitives (button, card, input, …)
    layout/           # sidebar, topbar, mobile nav, theme toggle
    dashboard/        # summary cards, charts, health, insights, goals
    utilities/        # electricity calculator
    brand/            # Expense Manager logo
  lib/
    prisma.ts         # singleton Prisma client
    finance.ts        # EMI, amortization, affordability, electricity (pure)
    format.ts         # currency / number / percent formatting
    nav.ts            # navigation config
    demo-data.ts      # dashboard demo data (swap for DB reads in Phase 2)
prisma/
  schema.prisma       # full normalized schema (§34)
  seed.ts             # demo data (§39)
```

## Roadmap

- **Phase 1 (this build)** — project setup, database schema, design system,
  app shell, dashboard, and a working electricity calculator + finance engine.
- **Phase 2** — expenses, income, transactions, categories, budgets (DB-wired,
  server actions, quick-add drawer, email notifications).
- **Phase 3** — electricity history & analytics, bills, recurring transactions, calendar.
- **Phase 4** — investments, IPO tracker, loan planner + EMI + affordability.
- **Phase 5** — goals, net worth, reports (PDF/CSV/Excel), insights engine.
- **Phase 6** — email notification system, notification center, settings.
- **Phase 7** — 3D hero visualization, advanced motion, performance,
  accessibility and security hardening.

> The financial-health score and insights are **informational only**, based on
> user-entered data — not professional financial advice.
