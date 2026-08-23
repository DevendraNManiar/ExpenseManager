"use client";

import { FileText, FileSpreadsheet, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReportData } from "@/server/queries/reports";

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function rows(r: ReportData): [string, string | number][] {
  return [
    ["Period", r.label],
    ["Income", r.income],
    ["Expenses", r.expenses],
    ["Bills", r.bills],
    ["EMI", r.emi],
    ["Investments", r.investments],
    ["Net cashflow", r.netCashflow],
    ["Savings rate (%)", r.savingsRatePct],
    ...r.categories.map((c) => [`Category: ${c.name}`, c.value] as [string, number]),
  ];
}

export function ReportExport({ report }: { report: ReportData }) {
  const base = `expense-manager-report-${report.label.replace(/\s+/g, "-").toLowerCase()}`;

  function exportCsv() {
    const csv = ["Metric,Value", ...rows(report).map(([k, v]) => `"${k}",${typeof v === "number" ? v : `"${v}"`}`)].join("\n");
    download(`${base}.csv`, csv, "text/csv;charset=utf-8");
  }

  function exportExcel() {
    // HTML-table workbook — opens natively in Excel / Sheets.
    const trs = rows(report).map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join("");
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body><table border="1"><tr><th>Metric</th><th>Value</th></tr>${trs}</table></body></html>`;
    download(`${base}.xls`, html, "application/vnd.ms-excel");
  }

  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="size-4" /> Print / PDF</Button>
      <Button variant="outline" size="sm" onClick={exportCsv}><FileText className="size-4" /> CSV</Button>
      <Button variant="outline" size="sm" onClick={exportExcel}><FileSpreadsheet className="size-4" /> Excel</Button>
    </div>
  );
}
