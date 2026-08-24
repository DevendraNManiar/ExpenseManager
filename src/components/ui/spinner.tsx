import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** A spinning loader icon. Inherits color from `currentColor`. */
export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("animate-spin", className)} aria-hidden="true" />;
}
