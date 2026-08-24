"use client";

import { Spinner } from "@/components/ui/spinner";
import { LogoMark } from "@/components/brand/logo";

/**
 * Full-screen loading overlay. Shown while an auth action is completing and the
 * app navigates to the dashboard, so the user always sees progress rather than a
 * frozen form. Rendered conditionally by the caller (mount = visible).
 */
export function LoadingOverlay({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-5 bg-background/80 backdrop-blur-sm"
    >
      <div className="relative flex items-center justify-center">
        <LogoMark className="h-11 w-11" />
      </div>
      <div className="flex items-center gap-2.5 text-sm font-medium text-muted-foreground">
        <Spinner className="h-4 w-4" />
        <span>{label}</span>
      </div>
    </div>
  );
}
