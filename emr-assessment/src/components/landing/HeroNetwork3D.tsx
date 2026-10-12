"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

const NODE_COUNT = 89; // one node per checklist capability
const LINK_DISTANCE = 1.15;

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function glowTexture(): THREE.Texture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.25, "rgba(160,240,255,0.9)");
  g.addColorStop(0.6, "rgba(34,211,238,0.25)");
  g.addColorStop(1, "rgba(34,211,238,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function Network() {
  const group = useRef<THREE.Group>(null);
  const pulse = useRef<THREE.PointsMaterial>(null);
  const { pointer } = useThree();

  const { positions, colors, linePositions } = useMemo(() => {
    const rand = seeded(42);
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      // Points in a slightly flattened shell for a "globe of capabilities" look.
      const u = rand() * 2 - 1;
      const theta = rand() * Math.PI * 2;
      const radius = 2.1 + (rand() - 0.5) * 0.7;
      const s = Math.sqrt(1 - u * u);
      pts.push(new THREE.Vector3(radius * s * Math.cos(theta), radius * u * 0.85, radius * s * Math.sin(theta)));
    }
    const positions = new Float32Array(pts.flatMap((p) => [p.x, p.y, p.z]));
    const cyan = new THREE.Color("#22D3EE");
    const sky = new THREE.Color("#6CB4E4");
    const white = new THREE.Color("#E6FBFF");
    const colors = new Float32Array(
      pts.flatMap((_, i) => {
        const c = i % 9 === 0 ? white : i % 3 === 0 ? cyan : sky;
        return [c.r, c.g, c.b];
      }),
    );
    const lines: number[] = [];
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        if (pts[i].distanceTo(pts[j]) < LINK_DISTANCE) lines.push(pts[i].x, pts[i].y, pts[i].z, pts[j].x, pts[j].y, pts[j].z);
      }
    }
    return { positions, colors, linePositions: new Float32Array(lines) };
  }, []);

  const texture = useMemo(() => glowTexture(), []);
  useEffect(() => () => texture.dispose(), [texture]);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    g.rotation.y += delta * 0.06;
    // Ease the tilt toward the cursor.
    g.rotation.x += (pointer.y * 0.25 - g.rotation.x) * 0.04;
    g.rotation.z += (-pointer.x * 0.12 - g.rotation.z) * 0.04;
    if (pulse.current) pulse.current.size = 0.26 + Math.sin(state.clock.elapsedTime * 1.6) * 0.03;
  });

  return (
    <group ref={group}>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[linePositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#6CB4E4" transparent opacity={0.22} depthWrite={false} blending={THREE.AdditiveBlending} />
      </lineSegments>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          ref={pulse}
          map={texture}
          vertexColors
          size={0.26}
          sizeAttenuation
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

export default function HeroNetwork3D() {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 6.2], fov: 50 }}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      aria-hidden
      eventSource={typeof document !== "undefined" ? document.body : undefined}
      eventPrefix="client"
    >
      <Network />
    </Canvas>
  );
}
