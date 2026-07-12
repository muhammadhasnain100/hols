"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Line, MeshDistortMaterial, Sphere } from "@react-three/drei";
import type { Group, Mesh } from "three";
import * as THREE from "three";
import { prefersReducedMotion } from "@/lib/motion";

const COLORS = {
  navy: "#152744",
  dusk: "#3853A4",
  lemon: "#DDE466",
  sky: "#8DC3E1",
} as const;

type Vec3 = [number, number, number];

function Atom({
  position,
  color,
  size = 0.11,
}: {
  position: Vec3;
  color: string;
  size?: number;
}) {
  return (
    <Sphere position={position} args={[size, 20, 20]}>
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.18}
        roughness={0.28}
        metalness={0.32}
        transparent
        opacity={0.9}
      />
    </Sphere>
  );
}

function MoleculeChain({
  atomPositions,
  atomColors,
  bondColor = COLORS.dusk,
  bondOpacity = 0.38,
}: {
  atomPositions: Vec3[];
  atomColors: string[];
  bondColor?: string;
  bondOpacity?: number;
}) {
  return (
    <group>
      {atomPositions.map((position, index) => (
        <Atom
          key={`atom-${index}`}
          position={position}
          color={atomColors[index]}
          size={index % 2 === 0 ? 0.13 : 0.095}
        />
      ))}
      {atomPositions.slice(0, -1).map((start, index) => (
        <Line
          key={`bond-${index}`}
          points={[start, atomPositions[index + 1]]}
          color={bondColor}
          transparent
          opacity={bondOpacity}
          lineWidth={1}
        />
      ))}
    </group>
  );
}

function PeptideChain() {
  const atoms = useMemo<Vec3[]>(
    () => [
      [0, 0, 0],
      [0.42, 0.18, 0.08],
      [0.84, 0.02, -0.12],
      [1.28, 0.22, 0.04],
      [1.72, 0.05, -0.08],
      [2.14, -0.12, 0.1],
    ],
    [],
  );

  const colors = useMemo(
    () => [COLORS.dusk, COLORS.sky, COLORS.lemon, COLORS.dusk, COLORS.sky, COLORS.lemon],
    [],
  );

  return <MoleculeChain atomPositions={atoms} atomColors={colors} />;
}

function SecondaryMolecule() {
  const atoms = useMemo<Vec3[]>(
    () => [
      [0, 0.1, 0],
      [0.35, -0.08, 0.12],
      [0.68, 0.14, -0.06],
      [1.02, -0.04, 0.08],
    ],
    [],
  );

  const colors = useMemo(
    () => [COLORS.sky, COLORS.lemon, COLORS.dusk, COLORS.sky],
    [],
  );

  return (
    <MoleculeChain
      atomPositions={atoms}
      atomColors={colors}
      bondColor={COLORS.sky}
      bondOpacity={0.3}
    />
  );
}

function DnaHelix({ position }: { position: Vec3 }) {
  const { strandA, strandB, rungs } = useMemo(() => {
    const a: Vec3[] = [];
    const b: Vec3[] = [];
    const bridges: [Vec3, Vec3][] = [];

    for (let i = 0; i < 18; i += 1) {
      const t = i * 0.42;
      const y = i * 0.11 - 0.95;
      a.push([Math.cos(t) * 0.28, y, Math.sin(t) * 0.28]);
      b.push([Math.cos(t + Math.PI) * 0.28, y, Math.sin(t + Math.PI) * 0.28]);

      if (i % 3 === 0) {
        bridges.push([a[a.length - 1], b[b.length - 1]]);
      }
    }

    return { strandA: a, strandB: b, rungs: bridges };
  }, []);

  return (
    <group position={position} rotation={[0.25, -0.45, 0.15]}>
      {strandA.map((point, index) => (
        <Atom key={`a-${index}`} position={point} color={COLORS.sky} size={0.06} />
      ))}
      {strandB.map((point, index) => (
        <Atom key={`b-${index}`} position={point} color={COLORS.lemon} size={0.06} />
      ))}
      {rungs.map(([start, end], index) => (
        <Line
          key={`rung-${index}`}
          points={[start, end]}
          color={COLORS.dusk}
          transparent
          opacity={0.22}
          lineWidth={1}
        />
      ))}
    </group>
  );
}

function KnowledgeNodes() {
  const nodes = useMemo<Vec3[]>(
    () => [
      [-1.4, 0.9, -1.2],
      [-0.5, 1.35, -0.6],
      [0.35, 1.15, -1.4],
      [1.1, 0.75, -0.9],
      [0.2, 0.55, -1.8],
      [-0.95, 0.45, -1.5],
    ],
    [],
  );

  const edges = useMemo<[Vec3, Vec3][]>(
    () => [
      [nodes[0], nodes[1]],
      [nodes[1], nodes[2]],
      [nodes[2], nodes[3]],
      [nodes[1], nodes[4]],
      [nodes[4], nodes[5]],
      [nodes[5], nodes[0]],
      [nodes[2], nodes[4]],
    ],
    [nodes],
  );

  return (
    <group>
      {nodes.map((position, index) => (
        <Atom
          key={`node-${index}`}
          position={position}
          color={index % 2 === 0 ? COLORS.lemon : COLORS.sky}
          size={0.075}
        />
      ))}
      {edges.map(([start, end], index) => (
        <Line
          key={`edge-${index}`}
          points={[start, end]}
          color={COLORS.dusk}
          transparent
          opacity={0.18}
          lineWidth={1}
        />
      ))}
    </group>
  );
}

function FloatingIons() {
  const ions = useMemo(
    () => [
      { position: [-2.6, 1.1, -2.4] as Vec3, color: COLORS.lemon, size: 0.08 },
      { position: [2.8, 0.6, -2.8] as Vec3, color: COLORS.sky, size: 0.07 },
      { position: [-2.1, -1.2, -1.8] as Vec3, color: COLORS.dusk, size: 0.09 },
      { position: [2.3, -0.9, -2.1] as Vec3, color: COLORS.lemon, size: 0.065 },
      { position: [0.4, 1.6, -3.2] as Vec3, color: COLORS.sky, size: 0.055 },
    ],
    [],
  );

  return (
    <group>
      {ions.map((ion, index) => (
        <Float
          key={`ion-${index}`}
          speed={1.4 + index * 0.15}
          rotationIntensity={0.08}
          floatIntensity={0.55 + index * 0.08}
        >
          <Atom position={ion.position} color={ion.color} size={ion.size} />
        </Float>
      ))}
    </group>
  );
}

function OrganicOrb() {
  const meshRef = useRef<Mesh>(null);

  useFrame((_, delta) => {
    if (!meshRef.current || prefersReducedMotion()) return;
    meshRef.current.rotation.y += delta * 0.08;
  });

  return (
    <Float speed={1.1} rotationIntensity={0.12} floatIntensity={0.45}>
      <Sphere ref={meshRef} args={[1.05, 48, 48]} position={[-2.15, -0.15, -2.35]}>
        <MeshDistortMaterial
          color={COLORS.dusk}
          distort={0.22}
          speed={1.1}
          roughness={0.18}
          metalness={0.45}
          transparent
          opacity={0.28}
        />
      </Sphere>
    </Float>
  );
}

function HeroSceneContent() {
  const groupRef = useRef<Group>(null);
  const reducedMotion = useMemo(() => prefersReducedMotion(), []);

  useFrame((state) => {
    if (!groupRef.current || reducedMotion) return;

    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      state.pointer.x * 0.28,
      0.035,
    );
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      state.pointer.y * 0.14,
      0.035,
    );
  });

  return (
    <>
      <ambientLight intensity={0.62} />
      <directionalLight position={[7, 9, 5]} intensity={0.95} color={COLORS.sky} />
      <directionalLight position={[-6, -4, 3]} intensity={0.32} color={COLORS.navy} />
      <pointLight position={[1.5, 0.5, 2]} intensity={0.45} color={COLORS.lemon} />

      <group ref={groupRef}>
        <Float speed={1.15} rotationIntensity={0.18} floatIntensity={0.42}>
          <group position={[-0.35, 0.05, 0]} scale={1.05}>
            <PeptideChain />
          </group>
        </Float>

        <Float speed={1.65} rotationIntensity={0.12} floatIntensity={0.62}>
          <group position={[2.05, -0.35, -1.35]} scale={0.82} rotation={[0, -0.4, 0.08]}>
            <SecondaryMolecule />
          </group>
        </Float>

        <Float speed={1.35} rotationIntensity={0.1} floatIntensity={0.5}>
          <DnaHelix position={[2.45, 0.15, -0.55]} />
        </Float>

        <Float speed={0.95} rotationIntensity={0.08} floatIntensity={0.35}>
          <KnowledgeNodes />
        </Float>

        <OrganicOrb />
        <FloatingIons />
      </group>
    </>
  );
}

export function HeroScene() {
  return (
    <div className="h-full w-full">
      <Canvas
        camera={{ position: [0, 0.15, 6.2], fov: 42 }}
        dpr={[1, 1.35]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ background: "transparent", width: "100%", height: "100%" }}
      >
        <HeroSceneContent />
      </Canvas>
    </div>
  );
}
