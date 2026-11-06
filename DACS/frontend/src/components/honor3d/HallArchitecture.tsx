"use client";

// Kiến trúc sảnh tròn: sàn cẩm thạch phản chiếu, tường + viền vàng, cột La Mã, mái vòm, đèn chùm,
// cửa chính, thảm đỏ và cột chắn dây nhung.
import { memo, useEffect, useMemo } from "react";
import * as THREE from "three";
import { MeshReflectorMaterial } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import {
  createMarbleTexture, createWallTexture, createDomeTexture, createBandTexture,
  createCarpetTexture, createLabelTexture,
} from "./textures";

interface Props {
  radius: number;
  wallHeight: number;
  columnAngles: number[];
  quality: "high" | "standard";
  onFloorDoubleClick?: (point: [number, number, number]) => void;
}

const GOLD = { color: "#d4a73c", metalness: 1, roughness: 0.28 } as const;

function useDisposable<T extends { dispose: () => void }>(factory: () => T, deps: unknown[]) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const value = useMemo(factory, deps);
  useEffect(() => () => value.dispose(), [value]);
  return value;
}

function Column({ angle, radius, height }: { angle: number; radius: number; height: number }) {
  const r = radius - 0.5;
  return (
    <group position={[Math.sin(angle) * r, 0, Math.cos(angle) * r]}>
      {/* chân cột */}
      <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.78, 0.24, 0.78]} />
        <meshStandardMaterial color="#d9d4c7" roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.34, 0]}>
        <cylinderGeometry args={[0.32, 0.36, 0.2, 28]} />
        <meshStandardMaterial color="#e6e1d4" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.47, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.27, 0.035, 10, 32]} />
        <meshStandardMaterial {...GOLD} />
      </mesh>
      {/* thân cột (nhiều cạnh tạo cảm giác rãnh khía) */}
      <mesh position={[0, height / 2, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.25, height - 1, 20]} />
        <meshStandardMaterial color="#efeae0" roughness={0.38} flatShading />
      </mesh>
      {/* đầu cột */}
      <mesh position={[0, height - 0.42, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.24, 0.04, 10, 32]} />
        <meshStandardMaterial {...GOLD} />
      </mesh>
      <mesh position={[0, height - 0.26, 0]}>
        <cylinderGeometry args={[0.36, 0.24, 0.32, 28]} />
        <meshStandardMaterial color="#e6e1d4" roughness={0.4} />
      </mesh>
      <mesh position={[0, height - 0.05, 0]}>
        <boxGeometry args={[0.86, 0.1, 0.86]} />
        <meshStandardMaterial {...GOLD} />
      </mesh>
      {/* đèn tường phát sáng (bloom) */}
      <group position={[0, height - 1.6, 0]} rotation={[0, angle + Math.PI, 0]}>
        <group position={[0, 0, 0.27]}>
          <mesh>
            <coneGeometry args={[0.11, 0.24, 16, 1, true]} />
            <meshStandardMaterial {...GOLD} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 0.08, 0]}>
            <sphereGeometry args={[0.07, 12, 12]} />
            <meshBasicMaterial color={[4, 2.6, 1.2]} toneMapped={false} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

function Stanchion({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.16, 0.18, 0.06, 24]} />
        <meshStandardMaterial {...GOLD} />
      </mesh>
      <mesh position={[0, 0.48, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.9, 12]} />
        <meshStandardMaterial {...GOLD} />
      </mesh>
      <mesh position={[0, 0.96, 0]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial {...GOLD} />
      </mesh>
    </group>
  );
}

function VelvetRope({ from, to }: { from: THREE.Vector3; to: THREE.Vector3 }) {
  const geometry = useMemo(() => {
    const mid = from.clone().add(to).multiplyScalar(0.5);
    mid.y -= 0.22;
    const curve = new THREE.QuadraticBezierCurve3(from, mid, to);
    return new THREE.TubeGeometry(curve, 20, 0.028, 8, false);
  }, [from, to]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color="#8b0f1f" roughness={0.7} />
    </mesh>
  );
}

function HallArchitecture({ radius, wallHeight, columnAngles, quality, onFloorDoubleClick }: Props) {
  const marble = useDisposable(() => createMarbleTexture(), []);
  const wall = useDisposable(() => createWallTexture(), []);
  const dome = useDisposable(() => createDomeTexture(), []);
  const band = useDisposable(() => createBandTexture("SẢNH VINH DANH  •  SINH VIÊN 5 TỐT  •  HUTECH"), []);
  const doorSign = useDisposable(() => createLabelTexture("SẢNH VINH DANH", "Gương sáng Sinh viên 5 Tốt", "#e9c86a", 768, 192), []);

  const carpetStart = radius - 0.4;
  const carpetEnd = 2.7;
  const carpetLength = carpetStart - carpetEnd;
  const carpet = useDisposable(() => createCarpetTexture(carpetLength), [carpetLength]);

  // Cột chắn dây nhung 2 bên thảm đỏ
  const { posts, ropes } = useMemo(() => {
    const posts: [number, number, number][] = [];
    const ropes: { from: THREE.Vector3; to: THREE.Vector3 }[] = [];
    for (const x of [-1.25, 1.25]) {
      let prev: THREE.Vector3 | null = null;
      for (let z = carpetEnd + 0.6; z <= carpetStart - 0.6; z += 1.9) {
        posts.push([x, 0, z]);
        const top = new THREE.Vector3(x, 0.94, z);
        if (prev) ropes.push({ from: prev, to: top });
        prev = top;
      }
    }
    return { posts, ropes };
  }, [carpetStart, carpetEnd]);

  const domeScaleY = 0.42;
  const crystals = useMemo(
    () => Array.from({ length: 28 }, (_, i) => {
      const a = (i / 28) * Math.PI * 2;
      return { pos: [Math.sin(a) * 2.3, -0.35 - (i % 2) * 0.25, Math.cos(a) * 2.3] as [number, number, number] };
    }),
    []
  );

  const handleDoubleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onFloorDoubleClick?.([e.point.x, 0, e.point.z]);
  };

  return (
    <group>
      {/* ── SÀN ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow onDoubleClick={handleDoubleClick}>
        <circleGeometry args={[radius, 128]} />
        {quality === "high" ? (
          <MeshReflectorMaterial
            map={marble}
            blur={[400, 120]}
            resolution={1024}
            mixBlur={1}
            mixStrength={28}
            mirror={0.55}
            depthScale={1.1}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.4}
            roughness={0.85}
            metalness={0.3}
            color="#ffffff"
          />
        ) : (
          <meshStandardMaterial map={marble} roughness={0.32} metalness={0.25} />
        )}
      </mesh>
      {/* Vòng khảm vàng trên sàn */}
      {[3.05, 3.25, 6.2].map((r) => (
        <mesh key={r} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
          <ringGeometry args={[r, r + 0.05, 128]} />
          <meshStandardMaterial {...GOLD} />
        </mesh>
      ))}

      {/* ── TƯỜNG ── */}
      <mesh position={[0, wallHeight / 2, 0]} receiveShadow>
        <cylinderGeometry args={[radius, radius, wallHeight, 160, 1, true]} />
        <meshStandardMaterial map={wall} roughness={0.85} side={THREE.BackSide} />
      </mesh>
      {/* ốp gỗ chân tường */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[radius - 0.04, radius - 0.04, 1, 160, 1, true]} />
        <meshStandardMaterial color="#2a170c" roughness={0.55} side={THREE.BackSide} />
      </mesh>
      {/* chỉ vàng */}
      {[1.02, 3.12, wallHeight - 0.95, wallHeight - 0.05].map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[radius - 0.06, 0.04, 8, 200]} />
          <meshStandardMaterial {...GOLD} />
        </mesh>
      ))}
      {/* dải chữ */}
      <mesh position={[0, wallHeight - 0.5, 0]}>
        <cylinderGeometry args={[radius - 0.05, radius - 0.05, 0.8, 160, 1, true]} />
        <meshStandardMaterial map={band} emissiveMap={band} emissive="#ffffff" emissiveIntensity={0.35} roughness={0.5} side={THREE.BackSide} />
      </mesh>

      {/* ── CỘT ── */}
      {columnAngles.map((a) => (
        <Column key={a} angle={a} radius={radius} height={wallHeight} />
      ))}

      {/* ── MÁI VÒM ── */}
      <mesh position={[0, wallHeight, 0]} scale={[1, domeScaleY, 1]}>
        <sphereGeometry args={[radius, 96, 48, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial map={dome} roughness={0.9} side={THREE.BackSide} />
      </mesh>
      {/* giếng trời */}
      <mesh position={[0, wallHeight + radius * domeScaleY - 0.06, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.6, 48]} />
        <meshBasicMaterial color={[2.2, 2.1, 1.8]} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, wallHeight + radius * domeScaleY - 0.08, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.65, 0.08, 12, 64]} />
        <meshStandardMaterial {...GOLD} />
      </mesh>

      {/* ── ĐÈN CHÙM ── */}
      <group position={[0, wallHeight + 1.1, 0]}>
        <mesh position={[0, 1.4, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 2.6, 8]} />
          <meshStandardMaterial {...GOLD} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2.3, 0.06, 12, 96]} />
          <meshStandardMaterial {...GOLD} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.25, 0]}>
          <torusGeometry args={[1.5, 0.045, 12, 96]} />
          <meshStandardMaterial {...GOLD} />
        </mesh>
        {crystals.map((c, i) => (
          <mesh key={i} position={c.pos}>
            <octahedronGeometry args={[0.09, 0]} />
            <meshBasicMaterial color={[3, 2.8, 2.4]} toneMapped={false} />
          </mesh>
        ))}
        <pointLight position={[0, -0.6, 0]} intensity={90} distance={0} decay={2} color="#ffe2a8" />
      </group>

      {/* ── CỬA CHÍNH ── */}
      <group position={[0, 0, radius - 0.08]} rotation={[0, Math.PI, 0]}>
        {[-0.68, 0.68].map((x) => (
          <mesh key={x} position={[x, 1.8, 0]} castShadow>
            <boxGeometry args={[1.3, 3.6, 0.1]} />
            <meshStandardMaterial color="#3b1f0f" roughness={0.5} />
          </mesh>
        ))}
        <mesh position={[0, 3.62, 0.02]}>
          <torusGeometry args={[1.42, 0.07, 12, 48, Math.PI]} />
          <meshStandardMaterial {...GOLD} />
        </mesh>
        {[-1.42, 1.42].map((x) => (
          <mesh key={x} position={[x, 1.8, 0.02]}>
            <boxGeometry args={[0.14, 3.64, 0.12]} />
            <meshStandardMaterial {...GOLD} />
          </mesh>
        ))}
        <mesh position={[0, 5.55, 0.06]}>
          <planeGeometry args={[3.6, 0.9]} />
          <meshStandardMaterial map={doorSign} emissiveMap={doorSign} emissive="#ffffff" emissiveIntensity={0.5} />
        </mesh>
      </group>

      {/* ── THẢM ĐỎ + DÂY NHUNG ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, (carpetStart + carpetEnd) / 2]} receiveShadow>
        <planeGeometry args={[2, carpetLength]} />
        <meshStandardMaterial map={carpet} roughness={0.95} />
      </mesh>
      {posts.map((p, i) => <Stanchion key={i} position={p} />)}
      {ropes.map((r, i) => <VelvetRope key={i} from={r.from} to={r.to} />)}
    </group>
  );
}

export default memo(HallArchitecture);
