import { cn } from "@/lib/utils";

/**
 * Expense Manager mark — a rounded tile holding a rising bar chart with an
 * upward trend arrow, in the brand emerald→teal gradient.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={cn("h-8 w-8", className)}
      role="img"
      aria-label="Expense Manager"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="em-logo-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(156 72% 52%)" />
          <stop offset="100%" stopColor="hsl(163 88% 30%)" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="13" fill="url(#em-logo-g)" />
      {/* Rising bars */}
      <rect x="12" y="27" width="6" height="9" rx="2" fill="white" fillOpacity="0.9" />
      <rect x="21" y="22" width="6" height="14" rx="2" fill="white" fillOpacity="0.9" />
      <rect x="30" y="16" width="6" height="20" rx="2" fill="white" fillOpacity="0.9" />
      {/* Upward trend arrow across the bar tops */}
      <path
        d="M13 26 L24 20 L33 14"
        fill="none"
        stroke="white"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M29 13.5 L34 13 L33.5 18" fill="none" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({
  className,
  showWord = true,
}: {
  className?: string;
  showWord?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      {showWord && (
        <span className="text-lg font-semibold tracking-tight">
          Expense{" "}
          <span className="text-primary">Manager</span>
        </span>
      )}
    </span>
  );
}
