"use client";

import { useEffect, useRef } from "react";
import {
  animate,
  useInView,
  useReducedMotion,
} from "framer-motion";
import { formatCurrency } from "@/lib/format";

interface AnimatedCounterProps {
  value: number;
  currency?: string;
  className?: string;
  durationMs?: number;
}

/**
 * Counts up to `value` when scrolled into view. Respects reduced-motion by
 * rendering the final value immediately.
 */
export function AnimatedCounter({
  value,
  currency = "INR",
  className,
  durationMs = 900,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduced = useReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (reduced || !inView) {
      node.textContent = formatCurrency(value, currency);
      return;
    }
    const controls = animate(0, value, {
      duration: durationMs / 1000,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => {
        node.textContent = formatCurrency(latest, currency);
      },
    });
    return () => controls.stop();
  }, [value, currency, inView, reduced, durationMs]);

  return (
    <span ref={ref} className={className}>
      {formatCurrency(0, currency)}
    </span>
  );
}
