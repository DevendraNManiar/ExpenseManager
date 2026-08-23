"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Rocket, Inbox, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createIpo, updateIpo, deleteIpo } from "@/server/actions/ipos";
import { ipoStatuses, type IpoInput } from "@/lib/validations";
import { formatCurrency, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { IpoRow } from "@/server/queries/ipos";

const STEPS = ["Open", "Applied", "Allotment", "Listing", "Sold"];
const stepForStatus: Record<string, number> = {
  PLANNING: 0, APPLIED: 1, ALLOTTED: 2, NOT_ALLOTTED: 2, LISTED: 3, SOLD: 4,
};
const statusBadge: Record<string, BadgeProps["variant"]> = {
  PLANNING: "secondary", APPLIED: "default", ALLOTTED: "success",
  NOT_ALLOTTED: "destructive", LISTED: "default", SOLD: "success",
};
const label = (s: string) => s.replace("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
const iso = (s: string | null) => (s ? s.slice(0, 10) : "");

export function IpoManager({ rows }: { rows: IpoRow[] }) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);

  async function onDelete(id: string) {
    if (!confirm("Delete this IPO?")) return;
    setPending(id);
    const res = await deleteIpo(id);
    setPending(null);
    if (!res.ok) return toast.error(res.error ?? "Could not delete.");
    toast.success("IPO deleted");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <IpoSheet trigger={<Button size="sm"><Plus className="size-4" /> Add IPO</Button>} />
      </div>

      {rows.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-2 py-14 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground"><Inbox className="size-6" /></span>
          <p className="font-medium">No IPOs tracked yet.</p>
          <p className="max-w-xs text-sm text-muted-foreground">Track applications from planning through allotment to listing.</p>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {rows.map((i) => {
            const step = stepForStatus[i.status] ?? 0;
            const notAllotted = i.status === "NOT_ALLOTTED";
            return (
              <Card key={i.id} className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><Rocket className="size-4" /></span>
                    <div>
                      <p className="font-semibold leading-tight">{i.companyName}</p>
                      {i.ipoName && <p className="text-xs text-muted-foreground">{i.ipoName}</p>}
                    </div>
                  </div>
                  <Badge variant={statusBadge[i.status]}>{label(i.status)}</Badge>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                  <div><p className="text-xs text-muted-foreground">Price band</p><p className="tabular font-medium">{i.priceBandLow != null ? `₹${i.priceBandLow}–${i.priceBandHigh}` : "—"}</p></div>
                  <div><p className="text-xs text-muted-foreground">Lots × size</p><p className="tabular font-medium">{i.lots} × {i.lotSize ?? "—"}</p></div>
                  <div><p className="text-xs text-muted-foreground">Applied</p><p className="tabular font-medium">{formatCurrency(i.applicationAmount)}</p></div>
                </div>

                {i.pl != null && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg border p-2.5 text-sm">
                    <span className="text-muted-foreground">Gain/Loss</span>
                    <span className={cn("tabular ml-auto font-semibold", i.pl >= 0 ? "text-success" : "text-destructive")}>
                      {i.pl >= 0 ? "+" : ""}{formatCurrency(i.pl)}{i.roiPct != null ? ` · ${formatPercent(i.roiPct)}` : ""}
                    </span>
                  </div>
                )}

                {/* Timeline */}
                <div className="mt-4 flex items-center">
                  {STEPS.map((s, idx) => {
                    const done = idx <= step;
                    const missed = notAllotted && idx === 2;
                    return (
                      <div key={s} className="flex flex-1 flex-col items-center last:flex-none">
                        <div className="flex w-full items-center">
                          <span className={cn(
                            "flex size-5 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold",
                            missed ? "bg-destructive text-destructive-foreground" : done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                          )}>
                            {done && !missed ? <Check className="size-3" /> : idx + 1}
                          </span>
                          {idx < STEPS.length - 1 && <span className={cn("h-0.5 flex-1", idx < step ? "bg-primary" : "bg-muted")} />}
                        </div>
                        <span className="mt-1 text-[9px] text-muted-foreground">{s}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 flex justify-end border-t pt-3">
                  <IpoSheet ipo={i} trigger={<Button variant="ghost" size="icon" className="size-8" aria-label="Edit"><Pencil className="size-4" /></Button>} />
                  <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive" aria-label="Delete" disabled={pending === i.id} onClick={() => onDelete(i.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function IpoSheet({ ipo, trigger }: { ipo?: IpoRow; trigger: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<IpoInput["status"]>(ipo?.status ?? "PLANNING");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const s = (k: string) => { const v = String(f.get(k) ?? "").trim(); return v === "" ? null : v; };
    const n = (k: string) => { const v = s(k); return v == null ? null : Number(v); };
    const d = (k: string) => { const v = s(k); return v == null ? null : new Date(v); };
    const payload: IpoInput = {
      companyName: String(f.get("companyName")),
      ipoName: String(f.get("ipoName") ?? ""),
      openDate: d("openDate"),
      closeDate: d("closeDate"),
      priceBandLow: n("priceBandLow"),
      priceBandHigh: n("priceBandHigh"),
      lotSize: n("lotSize"),
      lots: Number(f.get("lots") || 0),
      amountApplied: n("amountApplied"),
      status,
      listingDate: d("listingDate"),
      listingPrice: n("listingPrice"),
      currentPrice: n("currentPrice"),
      notes: "",
    };
    setSaving(true);
    const res = ipo ? await updateIpo(ipo.id, payload) : await createIpo(payload);
    setSaving(false);
    if (!res.ok) return toast.error(res.error ?? "Could not save.");
    toast.success(ipo ? "IPO updated" : "IPO added");
    setOpen(false);
    router.refresh();
  }

  const G = ({ label: l, name, type = "text", def, step }: { label: string; name: string; type?: string; def?: string | number; step?: string }) => (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{l}</Label>
      <Input id={name} name={name} type={type} step={step} defaultValue={def ?? ""} />
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        <SheetHeader><SheetTitle>{ipo ? "Edit IPO" : "Add IPO"}</SheetTitle></SheetHeader>
        <form onSubmit={onSubmit} className="space-y-4 px-6 pb-6">
          <div className="grid grid-cols-2 gap-4">
            <G label="Company" name="companyName" def={ipo?.companyName} />
            <G label="IPO name" name="ipoName" def={ipo?.ipoName ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as IpoInput["status"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{ipoStatuses.map((st) => <SelectItem key={st} value={st}>{label(st)}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <G label="Open date" name="openDate" type="date" def={iso(ipo?.openDate ?? null)} />
            <G label="Close date" name="closeDate" type="date" def={iso(ipo?.closeDate ?? null)} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <G label="Band low (₹)" name="priceBandLow" type="number" step="0.01" def={ipo?.priceBandLow ?? ""} />
            <G label="Band high (₹)" name="priceBandHigh" type="number" step="0.01" def={ipo?.priceBandHigh ?? ""} />
            <G label="Lot size" name="lotSize" type="number" def={ipo?.lotSize ?? ""} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <G label="No. of lots" name="lots" type="number" def={ipo?.lots ?? 0} />
            <G label="Amount applied (₹)" name="amountApplied" type="number" step="0.01" def={ipo?.amountApplied ?? ""} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <G label="Listing date" name="listingDate" type="date" def={iso(ipo?.listingDate ?? null)} />
            <G label="Listing ₹" name="listingPrice" type="number" step="0.01" def={ipo?.listingPrice ?? ""} />
            <G label="Current ₹" name="currentPrice" type="number" step="0.01" def={ipo?.currentPrice ?? ""} />
          </div>
          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : ipo ? "Save changes" : "Add IPO"}</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
