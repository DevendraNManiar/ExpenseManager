"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import * as THREE from "three";
import { useReducedMotion } from "framer-motion";
import type { OrbitNode } from "@/lib/dashboard-types";

interface Positioned extends OrbitNode {
  pos: THREE.Vector3;
  size: number;
  phase: number;
}

function Node({ node, reduced }: { node: Positioned; reduced: boolean | null }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ref.current && !reduced) {
      ref.current.position.y = node.pos.y + Math.sin(state.clock.elapsedTime * 0.8 + node.phase) * 0.14;
    }
  });
  return (
    <mesh ref={ref} position={node.pos}>
      <sphereGeometry args={[node.size, 32, 32]} />
      <meshStandardMaterial color={node.color} emissive={node.color} emissiveIntensity={0.4} roughness={0.25} metalness={0.2} />
    </mesh>
  );
}

function Scene({ nodes }: { nodes: OrbitNode[] }) {
  const group = useRef<THREE.Group>(null);
  const reduced = useReducedMotion();

  useFrame((_, delta) => {
    if (group.current && !reduced) group.current.rotation.y += delta * 0.12;
  });

  const positioned = useMemo<Positioned[]>(() => {
    const max = Math.max(...nodes.map((n) => n.value), 1);
    return nodes.map((n, i) => {
      const angle = (i / nodes.length) * Math.PI * 2;
      const radius = 2.7;
      const y = i % 2 === 0 ? 0.5 : -0.5;
      return {
        ...n,
        pos: new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius),
        size: 0.3 + Math.sqrt(n.value / max) * 0.55,
        phase: (i / nodes.length) * Math.PI * 2,
      };
    });
  }, [nodes]);

  return (
    <group ref={group}>
      {/* Central core = you / net position */}
      <mesh>
        <icosahedronGeometry args={[1.05, 1]} />
        <meshStandardMaterial color="#0d9488" emissive="#0d9488" emissiveIntensity={0.5} wireframe transparent opacity={0.5} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.6, 48, 48]} />
        <meshStandardMaterial color="#10b981" emissive="#0d9488" emissiveIntensity={0.7} roughness={0.15} metalness={0.3} />
      </mesh>

      {positioned.map((n) => (
        <group key={n.key}>
          <Line points={[[0, 0, 0], [n.pos.x, n.pos.y, n.pos.z]]} color={n.color} lineWidth={1} transparent opacity={0.3} />
          <Node node={n} reduced={reduced} />
        </group>
      ))}
    </group>
  );
}

export default function FinancialOrbit({ nodes }: { nodes: OrbitNode[] }) {
  return (
    <Canvas
      camera={{ position: [0, 1.3, 7], fov: 45 }}
      dpr={[1, 1.8]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ pointerEvents: "none" }}
    >
      <ambientLight intensity={0.7} />
      <pointLight position={[5, 6, 5]} intensity={90} />
      <pointLight position={[-6, -3, -4]} intensity={35} color="#38bdf8" />
      <Scene nodes={nodes} />
    </Canvas>
  );
}
