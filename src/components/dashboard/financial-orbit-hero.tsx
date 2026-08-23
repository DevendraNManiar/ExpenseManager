"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useReducedMotion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { formatCompactCurrency } from "@/lib/format";
import type { OrbitNode } from "@/lib/dashboard-types";

/** Feature-detect WebGL so the 3D canvas never breaks the dashboard. */
function useWebGL(): boolean | null {
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => {
    try {
      const c = document.createElement("canvas");
      setOk(!!(c.getContext("webgl2") || c.getContext("webgl")));
    } catch {
      setOk(false);
    }
  }, []);
  return ok;
}

const FinancialOrbit = dynamic(() => import("./financial-orbit"), {
  ssr: false,
  loading: () => <OrbitSkeleton />,
});

function OrbitSkeleton() {
  return (
    <div className="flex h-full items-center justify-center" aria-hidden>
      <div className="size-24 animate-pulse rounded-full bg-primary/20 blur-md" />
    </div>
  );
}

/** Static, dependency-free fallback for reduced-motion users. */
function StaticOrbit({ nodes }: { nodes: OrbitNode[] }) {
  const cx = 150;
  const cy = 110;
  const r = 78;
  return (
    <svg viewBox="0 0 300 220" className="h-full w-full" aria-hidden>
      {nodes.map((n, i) => {
        const a = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r * 0.7;
        return (
          <g key={n.key}>
            <line x1={cx} y1={cy} x2={x} y2={y} stroke={n.color} strokeOpacity={0.3} strokeWidth={1} />
            <circle cx={x} cy={y} r={9} fill={n.color} />
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r={20} fill="hsl(var(--primary))" />
    </svg>
  );
}

export function FinancialOrbitHero({ nodes }: { nodes: OrbitNode[] }) {
  const reduced = useReducedMotion();
  const webgl = useWebGL();
  // Use live 3D only when motion is allowed and WebGL is available.
  const use3D = webgl === true && !reduced;

  return (
    <Card className="relative min-h-[16rem] overflow-hidden bg-gradient-to-br from-primary/10 via-card to-sky-500/5">
      <div className="pointer-events-none absolute inset-0">
        {webgl === null ? <OrbitSkeleton /> : use3D ? <FinancialOrbit nodes={nodes} /> : <StaticOrbit nodes={nodes} />}
      </div>

      <div className="relative flex h-full flex-col justify-between gap-6 p-6">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Your financial system</h2>
          <p className="max-w-xs text-sm text-muted-foreground">
            Income, spending, savings, investments and debt — in orbit around your net position.
          </p>
        </div>
        {/* Accessible legend (real text for screen readers) */}
        <ul className="flex flex-wrap gap-x-4 gap-y-2">
          {nodes.map((n) => (
            <li key={n.key} className="flex items-center gap-1.5 text-xs">
              <span className="size-2.5 rounded-full" style={{ background: n.color }} />
              <span className="text-muted-foreground">{n.label}</span>
              <span className="tabular font-semibold">{formatCompactCurrency(n.value)}</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
