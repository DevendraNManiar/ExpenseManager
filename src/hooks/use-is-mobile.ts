"use client";

import { useEffect, useState } from "react";

/**
 * True when the viewport is below `breakpoint` (default 640px = Tailwind `sm`).
 * SSR-safe: returns false until mounted, so it never causes hydration issues
 * for closed overlays.
 */
export function useIsMobile(breakpoint = 640): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const update = () => setIsMobile(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, [breakpoint]);

  return isMobile;
}
