"use client";

// Pháo giấy bắn lên từ cúp khi bấm vào (mỗi lần `burstKey` đổi giá trị)
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

const COUNT = 600;
const LIFE = 4.5; // giây
const COLORS = ["#ffd66b", "#f43f5e", "#3b82f6", "#22c55e", "#a855f7", "#ffffff"];

const DEFAULT_ORIGIN: [number, number, number] = [0, 3.1, 0];

export default function ConfettiBurst({ burstKey, origin = DEFAULT_ORIGIN }: { burstKey: number; origin?: [number, number, number] }) {
  const originRef = useRef(origin);
  originRef.current = origin;
  const points = useRef<THREE.Points>(null);
  const material = useRef<THREE.PointsMaterial>(null);
  const velocities = useMemo(() => new Float32Array(COUNT * 3), []);
  const age = useRef(LIFE);

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3));
    const colors = new Float32Array(COUNT * 3);
    const c = new THREE.Color();
    for (let i = 0; i < COUNT; i++) {
      c.set(COLORS[i % COLORS.length]);
      colors.set([c.r * 1.6, c.g * 1.6, c.b * 1.6], i * 3);
    }
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return g;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  useEffect(() => {
    if (!burstKey) return;
    const pos = geometry.getAttribute("position") as THREE.BufferAttribute;
    const o = originRef.current;
    for (let i = 0; i < COUNT; i++) {
      pos.setXYZ(i, o[0], o[1], o[2]);
      const a = Math.random() * Math.PI * 2;
      const up = 4 + Math.random() * 5;
      const out = 1.5 + Math.random() * 3.5;
      velocities.set([Math.cos(a) * out, up, Math.sin(a) * out], i * 3);
    }
    pos.needsUpdate = true;
    age.current = 0;
  }, [burstKey, geometry, velocities]);

  useFrame((_, delta) => {
    if (age.current >= LIFE || !points.current) {
      if (points.current) points.current.visible = false;
      return;
    }
    const dt = Math.min(delta, 0.05);
    age.current += dt;
    points.current.visible = true;
    const pos = geometry.getAttribute("position") as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    for (let i = 0; i < COUNT; i++) {
      const k = i * 3;
      velocities[k + 1] -= 6.5 * dt;                 // trọng lực
      velocities[k] *= 0.985; velocities[k + 2] *= 0.985; // lực cản không khí
      arr[k] += velocities[k] * dt;
      arr[k + 1] = Math.max(0.02, arr[k + 1] + velocities[k + 1] * dt);
      arr[k + 2] += velocities[k + 2] * dt;
      if (arr[k + 1] <= 0.02) { velocities[k] *= 0.5; velocities[k + 2] *= 0.5; velocities[k + 1] = 0; }
    }
    pos.needsUpdate = true;
    if (material.current) material.current.opacity = Math.max(0, 1 - Math.pow(age.current / LIFE, 3));
  });

  return (
    <points ref={points} geometry={geometry} visible={false} frustumCulled={false}>
      <pointsMaterial ref={material} size={0.09} vertexColors transparent depthWrite={false} toneMapped={false} sizeAttenuation />
    </points>
  );
}
