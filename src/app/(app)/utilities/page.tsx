import type { Metadata } from "next";
import { ElectricityCalculator } from "@/components/utilities/electricity-calculator";

export const metadata = { title: "Bills & Utilities" };

export default function UtilitiesPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Bills &amp; Utilities</h1>
        <p className="text-sm text-muted-foreground">
          Personalized electricity unit calculator — enter your meter readings to estimate the bill.
        </p>
      </header>
      <ElectricityCalculator />
    </div>
  );
}
