"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const types = ["ALL", "EXPENSE", "INCOME", "INVESTMENT", "EMI", "BILL", "TRANSFER"];
const sorts = [
  { v: "date_desc", label: "Newest first" },
  { v: "date_asc", label: "Oldest first" },
  { v: "amount_desc", label: "Amount ↓" },
  { v: "amount_asc", label: "Amount ↑" },
];

export function FilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params.toString());
      if (value && value !== "ALL") next.set(key, value);
      else next.delete(key);
      next.delete("page");
      router.push(`${pathname}?${next.toString()}`);
    },
    [params, pathname, router],
  );

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          defaultValue={params.get("q") ?? ""}
          placeholder="Search description, merchant, source…"
          className="pl-9"
          onKeyDown={(e) => {
            if (e.key === "Enter") setParam("q", (e.target as HTMLInputElement).value);
          }}
        />
      </div>
      <Select defaultValue={params.get("type") ?? "ALL"} onValueChange={(v) => setParam("type", v)}>
        <SelectTrigger className="sm:w-40"><SelectValue /></SelectTrigger>
        <SelectContent>
          {types.map((t) => (
            <SelectItem key={t} value={t}>{t === "ALL" ? "All types" : t}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select defaultValue={params.get("sort") ?? "date_desc"} onValueChange={(v) => setParam("sort", v)}>
        <SelectTrigger className="sm:w-44"><SelectValue /></SelectTrigger>
        <SelectContent>
          {sorts.map((s) => (
            <SelectItem key={s.v} value={s.v}>{s.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
