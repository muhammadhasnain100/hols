"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Float } from "@react-three/drei";
import type { Mesh } from "three";
import { prefersReducedMotion } from "@/lib/motion";

type Phase = "idle" | "approach" | "draw" | "transfer" | "inject" | "done";

const PHASE_ORDER: Phase[] = ["approach", "draw", "transfer", "inject", "done"];
const PHASE_MS: Record<Phase, number> = {
  idle: 0,
  approach: 900,
  draw: 1400,
  transfer: 1000,
  inject: 1500,
  done: 500,
};

type ReconScene3DProps = {
  onComplete?: () => void;
  autoPlay?: boolean;
  className?: string;
};

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function VialMesh({
  position,
  fill,
  color,
  powder,
  active,
  capColor = "#6B9A93",
}: {
  position: [number, number, number];
  fill: number;
  color: string;
  powder?: boolean;
  active?: boolean;
  capColor?: string;
}) {
  const glassRef = useRef<Mesh>(null);
  const fillHeight = 0.15 + fill * 1.15;

  useFrame((_, delta) => {
    if (!glassRef.current || !active) return;
    glassRef.current.rotation.y += delta * 0.28;
  });

  return (
    <group position={position} scale={active ? 1.06 : 1}>
      <mesh position={[0, 1.55, 0]}>
        <cylinderGeometry args={[0.28, 0.28, 0.18, 24]} />
        <meshStandardMaterial color={capColor} metalness={0.55} roughness={0.28} />
      </mesh>
      <mesh position={[0, 1.4, 0]}>
        <cylinderGeometry args={[0.34, 0.34, 0.14, 24]} />
        <meshStandardMaterial color="#E8F0EF" metalness={0.15} roughness={0.4} />
      </mesh>

      <mesh ref={glassRef} position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.55, 0.48, 1.7, 32]} />
        <meshPhysicalMaterial
          color="#F8FBFC"
          transparent
          opacity={0.22}
          roughness={0.05}
          metalness={0.02}
          transmission={0.92}
          thickness={0.55}
          ior={1.45}
        />
      </mesh>

      {!powder ? (
        <mesh position={[0, -0.28 + fillHeight / 2, 0]}>
          <cylinderGeometry args={[0.46, 0.4, fillHeight, 32]} />
          <meshPhysicalMaterial
            color={color}
            transparent
            opacity={0.78}
            roughness={0.15}
            metalness={0.05}
            transmission={0.4}
          />
        </mesh>
      ) : (
        <mesh position={[0, -0.7, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.38, 24]} />
          <meshStandardMaterial color="#CBD5E1" roughness={0.9} />
        </mesh>
      )}

      <mesh position={[0, -0.95, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.55, 24]} />
        <meshStandardMaterial color="#9ED6D4" transparent opacity={0.2} />
      </mesh>
    </group>
  );
}

function SyringeMesh({
  position,
  fill,
  plunging,
}: {
  position: [number, number, number];
  fill: number;
  plunging: boolean;
}) {
  const fillLen = 0.2 + fill * 1.5;
  const plungerY = plunging ? 0.55 : 0.95 - fill * 0.5;

  return (
    <group position={position}>
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 1.9, 24]} />
        <meshPhysicalMaterial
          color="#9ED6D4"
          transparent
          opacity={0.45}
          transmission={0.75}
          roughness={0.12}
          thickness={0.35}
        />
      </mesh>
      <mesh position={[0, 0.85 - fillLen / 2, 0]}>
        <cylinderGeometry args={[0.12, 0.12, fillLen, 20]} />
        <meshStandardMaterial color="#F472B6" transparent opacity={0.92} />
      </mesh>
      <mesh position={[0, plungerY + 0.55, 0]}>
        <cylinderGeometry args={[0.045, 0.045, 1, 12]} />
        <meshStandardMaterial color="#5BA8A6" />
      </mesh>
      <mesh position={[0, plungerY + 1.05, 0]}>
        <cylinderGeometry args={[0.17, 0.17, 0.1, 16]} />
        <meshStandardMaterial color="#6BB5B3" />
      </mesh>
      <mesh position={[0, -0.85, 0]}>
        <cylinderGeometry args={[0.11, 0.09, 0.22, 12]} />
        <meshStandardMaterial color="#8ECFCD" metalness={0.35} roughness={0.35} />
      </mesh>
      <mesh position={[0, -1.25, 0]}>
        <cylinderGeometry args={[0.022, 0.008, 0.55, 8]} />
        <meshStandardMaterial color="#4B5563" metalness={0.75} roughness={0.2} />
      </mesh>
    </group>
  );
}

function SceneController({
  phase,
  progress,
}: {
  phase: Phase;
  progress: number;
}) {
  const t = easeInOut(progress);

  const syringePos = useMemo((): [number, number, number] => {
    if (phase === "approach" || phase === "draw") {
      return [-1.15, 1.65 - (phase === "draw" ? t * 0.55 : 0), 0.15];
    }
    if (phase === "transfer") {
      return [-1.15 + t * 2.3, 1.65, 0.15];
    }
    if (phase === "inject" || phase === "done") {
      return [1.15, 1.65 - (phase === "inject" ? Math.min(1, t * 1.2) * 0.55 : 0.55), 0.15];
    }
    return [-1.15, 1.9, 0.15];
  }, [phase, t]);

  const syringeFill =
    phase === "draw"
      ? 0.1 + t * 0.75
      : phase === "transfer"
        ? 0.85
        : phase === "inject"
          ? 0.85 - t * 0.75
          : phase === "done"
            ? 0.1
            : 0.08;

  const waterFill =
    phase === "draw"
      ? 0.85 - t * 0.35
      : phase === "idle" || phase === "approach"
        ? 0.85
        : 0.5;

  const medFill =
    phase === "inject"
      ? 0.15 + t * 0.55
      : phase === "done"
        ? 0.7
        : 0.12;

  const medColor = phase === "inject" || phase === "done" ? "#7EB8B0" : "#CBD5E1";
  const showPowder = phase === "idle" || phase === "approach" || phase === "draw" || phase === "transfer";

  return (
    <>
      <Float speed={1.2} rotationIntensity={0.04} floatIntensity={0.1}>
        <VialMesh
          position={[-1.15, 0, 0]}
          fill={waterFill}
          color="#7DD3FC"
          capColor="#5BA8A6"
          active={phase === "approach" || phase === "draw"}
        />
      </Float>
      <Float speed={1.1} rotationIntensity={0.04} floatIntensity={0.08}>
        <VialMesh
          position={[1.15, 0, 0]}
          fill={medFill}
          color={medColor}
          capColor="#6B9A93"
          powder={showPowder && medFill < 0.2}
          active={phase === "transfer" || phase === "inject" || phase === "done"}
        />
      </Float>
      <SyringeMesh
        position={syringePos}
        fill={syringeFill}
        plunging={phase === "inject"}
      />
    </>
  );
}

function AnimatedScene({
  onComplete,
  reduced,
}: {
  onComplete?: () => void;
  reduced: boolean;
}) {
  const [phase, setPhase] = useState<Phase>("approach");
  const [progress, setProgress] = useState(0);
  const startRef = useRef<number>(0);
  const phaseIndexRef = useRef(0);
  const completedRef = useRef(false);

  useEffect(() => {
    if (reduced) {
      const timer = window.setTimeout(() => onComplete?.(), 250);
      return () => window.clearTimeout(timer);
    }
    startRef.current = performance.now();
    phaseIndexRef.current = 0;
    setPhase("approach");
    setProgress(0);
    completedRef.current = false;
  }, [onComplete, reduced]);

  useFrame(() => {
    if (reduced || completedRef.current) return;
    const current = PHASE_ORDER[phaseIndexRef.current];
    const elapsed = performance.now() - startRef.current;
    const duration = PHASE_MS[current];
    const p = Math.min(1, elapsed / duration);
    setProgress(p);
    setPhase(current);

        if (p >= 1) {
      if (current === "done") {
        if (!completedRef.current) {
          completedRef.current = true;
          onComplete?.();
        }
        return;
      }
      phaseIndexRef.current += 1;
      startRef.current = performance.now();
      setProgress(0);
    }
  });

  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[4, 6, 3]} intensity={1.15} />
      <directionalLight position={[-3, 2, -2]} intensity={0.4} color="#8DC3E1" />
      <pointLight position={[0, 2.5, 2]} intensity={0.35} color="#DDE466" />
      <SceneController phase={phase} progress={progress} />
      <ContactShadows position={[0, -0.98, 0]} opacity={0.32} scale={8} blur={2.4} far={3} />
    </>
  );
}

export function ReconScene3D({ onComplete, className }: ReconScene3DProps) {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(prefersReducedMotion());
  }, []);

  return (
    <div className={className}>
      <div className="relative h-[320px] w-full overflow-hidden rounded-2xl border border-[#9ED6D4]/40 bg-gradient-to-b from-[#F3FBFA] to-[#DCEEEB] sm:h-[380px]">
        <Canvas
          camera={{ position: [0, 1.2, 4.2], fov: 40 }}
          dpr={[1, 1.75]}
          gl={{ antialias: true, alpha: true }}
        >
          <color attach="background" args={["#eef8f7"]} />
          <AnimatedScene onComplete={onComplete} reduced={reduced} />
        </Canvas>
      </div>
    </div>
  );
}
