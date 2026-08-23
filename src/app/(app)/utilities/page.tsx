import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Zap, ReceiptText } from "lucide-react";
import { getCurrentUserId } from "@/lib/auth";
import { listReadings, getLastReading, getElectricityStats } from "@/server/queries/utility";
import { listBills } from "@/server/queries/bills";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ElectricityReadingForm } from "@/components/utilities/electricity-reading-form";
import { ElectricityHistory } from "@/components/utilities/electricity-history";
import { ElectricityAnalytics } from "@/components/utilities/electricity-analytics";
import { BillsManager } from "@/components/utilities/bills-manager";

export const metadata: Metadata = { title: "Bills & Utilities" };

export default async function UtilitiesPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const [readings, last, stats, bills] = await Promise.all([
    listReadings(userId),
    getLastReading(userId),
    getElectricityStats(userId),
    listBills(userId),
  ]);

  // Pre-fill the next reading's "previous" from the last saved reading (spec §45).
  const suggestion = last
    ? {
        previousReading: String(last.currentReading),
        unitRate: String(last.unitRate),
        fixedCharges: String(last.fixedCharges),
        taxes: String(last.taxes),
      }
    : undefined;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Bills &amp; Utilities</h1>
        <p className="text-sm text-muted-foreground">
          Calculate and track your electricity bills, and stay on top of recurring bills.
        </p>
      </header>

      <Tabs defaultValue="electricity">
        <TabsList>
          <TabsTrigger value="electricity"><Zap className="size-4" /> Electricity</TabsTrigger>
          <TabsTrigger value="bills"><ReceiptText className="size-4" /> Bills</TabsTrigger>
        </TabsList>

        <TabsContent value="electricity" className="space-y-8">
          <ElectricityReadingForm initial={suggestion} />
          <ElectricityAnalytics stats={stats} />
          <div>
            <h2 className="mb-3 text-lg font-semibold">History</h2>
            <ElectricityHistory rows={readings} />
          </div>
        </TabsContent>

        <TabsContent value="bills">
          <BillsManager rows={bills} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
