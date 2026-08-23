import { cn } from "@/lib/utils";

/**
 * MoneyOS mark — a rounded "operating-system" tile holding an upward
 * money trend line that doubles as an "M". Uses brand gradient.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={cn("h-8 w-8", className)}
      role="img"
      aria-label="MoneyOS"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="moneyos-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(156 72% 52%)" />
          <stop offset="100%" stopColor="hsl(163 88% 30%)" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="13" fill="url(#moneyos-g)" />
      <path
        d="M12 32 L12 18 L19 27 L24 20 L29 27 L36 16 L36 32"
        fill="none"
        stroke="white"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="36" cy="16" r="2.6" fill="white" />
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
          Money<span className="text-primary">OS</span>
        </span>
      )}
    </span>
  );
}
