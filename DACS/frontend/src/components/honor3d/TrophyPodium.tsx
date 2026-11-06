"use client";

// Bục vinh danh trung tâm: bục 3 tầng, cúp vàng tiện tròn, ngôi sao phát sáng,
// 5 trụ pha lê tượng trưng 5 tiêu chí SV5T. Bấm vào cúp → bắn pháo giấy.
import { memo, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Billboard, Float, Sparkles, useCursor } from "@react-three/drei";
import { createLabelTexture } from "./textures";

// Dùng MeshStandardMaterial cho mọi vật liệu: ít biến thể shader hơn → lần đầu mở sảnh nhanh hơn nhiều
// trên card đồ hoạ tích hợp (Windows/ANGLE biên dịch shader rất chậm).
const GOLD_PHYSICAL = {
  color: "#ffcf57",
  metalness: 1,
  roughness: 0.3, // đủ nhám để bắt sáng từ môi trường (quá bóng sẽ phản chiếu nền tối → trông đen)
  envMapIntensity: 2.4,
  emissive: "#4a2e00",
  emissiveIntensity: 0.5,
} as const;

export const SV5T_CRITERIA = [
  { name: "Đạo đức tốt", color: "#f43f5e" },
  { name: "Học tập tốt", color: "#3b82f6" },
  { name: "Thể lực tốt", color: "#22c55e" },
  { name: "Tình nguyện tốt", color: "#f59e0b" },
  { name: "Hội nhập tốt", color: "#a855f7" },
];

// Hình ngôi sao 5 cánh dùng chung (cúp + huy hiệu khung ảnh)
let starGeometry: THREE.ExtrudeGeometry | null = null;
export function getStarGeometry() {
  if (!starGeometry) {
    const shape = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? 1 : 0.45;
      const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
      const x = Math.cos(a) * r, y = Math.sin(a) * r;
      if (i === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
    }
    shape.closePath();
    starGeometry = new THREE.ExtrudeGeometry(shape, {
      depth: 0.25, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.1, bevelSegments: 3,
    });
    starGeometry.center();
  }
  return starGeometry;
}

function Trophy({ onClick }: { onClick: () => void }) {
  const group = useRef<THREE.Group>(null);
  const star = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);

  // Biên dạng cúp (bán kính, chiều cao) → tiện tròn bằng LatheGeometry
  const cupGeometry = useMemo(() => {
    const pts = [
      [0, 0], [0.34, 0], [0.34, 0.07], [0.16, 0.13], [0.09, 0.3], [0.08, 0.42], [0.15, 0.47],
      [0.09, 0.53], [0.11, 0.6], [0.3, 0.74], [0.42, 0.95], [0.48, 1.18], [0.5, 1.36],
      [0.46, 1.37], [0.43, 1.2], [0.36, 0.97], [0.22, 0.82], [0, 0.76],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    return new THREE.LatheGeometry(pts, 64);
  }, []);
  useEffect(() => () => cupGeometry.dispose(), [cupGeometry]);

  useFrame((state, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.35;
    if (star.current) {
      star.current.rotation.y += delta * 1.4;
      const s = 0.16 + Math.sin(state.clock.elapsedTime * 2) * 0.012;
      star.current.scale.setScalar(hovered ? s * 1.25 : s);
    }
  });

  return (
    <group
      ref={group}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={() => setHovered(false)}
    >
      {/* đế đá đen viền vàng */}
      <mesh position={[0, 0.14, 0]}>
        <boxGeometry args={[0.82, 0.28, 0.82]} />
        <meshStandardMaterial color="#0b0b10" roughness={0.15} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[0.62, 0.05, 0.62]} />
        <meshStandardMaterial {...GOLD_PHYSICAL} />
      </mesh>
      {/* thân + miệng cúp */}
      <mesh geometry={cupGeometry} position={[0, 0.32, 0]}>
        <meshStandardMaterial {...GOLD_PHYSICAL} side={THREE.DoubleSide} />
      </mesh>
      {/* 2 quai cúp */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.47, 1.36, 0]} rotation={[0, 0, s > 0 ? -Math.PI / 2 : Math.PI / 2]}>
          <torusGeometry args={[0.24, 0.035, 12, 32, Math.PI]} />
          <meshStandardMaterial {...GOLD_PHYSICAL} />
        </mesh>
      ))}
      {/* ngôi sao phát sáng */}
      <mesh ref={star} geometry={getStarGeometry()} position={[0, 2.05, 0]}>
        <meshStandardMaterial color="#ffd66b" emissive="#ffb400" emissiveIntensity={hovered ? 4 : 2.4} toneMapped={false} />
      </mesh>
    </group>
  );
}

function CriterionPillar({ angle, name, color }: { angle: number; name: string; color: string }) {
  const crystal = useRef<THREE.Mesh>(null);
  const label = useMemo(() => createLabelTexture(name.toUpperCase(), "SINH VIÊN 5 TỐT", color, 512, 160), [name, color]);
  useEffect(() => () => label.dispose(), [label]);
  const r = 3.75;
  useFrame((_, delta) => {
    if (crystal.current) {
      crystal.current.rotation.y += delta * 0.8;
      crystal.current.rotation.x += delta * 0.3;
    }
  });
  return (
    <group position={[Math.sin(angle) * r, 0, Math.cos(angle) * r]}>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.26, 0.32, 1, 6]} />
        <meshStandardMaterial color="#e8e2d4" roughness={0.35} />
      </mesh>
      <mesh position={[0, 1.02, 0]}>
        <cylinderGeometry args={[0.34, 0.34, 0.05, 6]} />
        <meshStandardMaterial color="#d4a73c" metalness={1} roughness={0.28} />
      </mesh>
      <Float speed={2} floatIntensity={0.4} rotationIntensity={0}>
        <mesh ref={crystal} position={[0, 1.5, 0]}>
          <icosahedronGeometry args={[0.2, 0]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.2} toneMapped={false} />
        </mesh>
      </Float>
      <Billboard position={[0, 2.05, 0]}>
        <mesh>
          <planeGeometry args={[1.05, 0.33]} />
          <meshBasicMaterial map={label} transparent toneMapped={false} />
        </mesh>
      </Billboard>
    </group>
  );
}

function HoloRings() {
  const a = useRef<THREE.Mesh>(null);
  const b = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (a.current) a.current.rotation.z += delta * 0.4;
    if (b.current) b.current.rotation.z -= delta * 0.25;
  });
  return (
    <group position={[0, 2.2, 0]}>
      <mesh ref={a} rotation={[Math.PI / 2.3, 0, 0]}>
        <torusGeometry args={[1.25, 0.012, 8, 128]} />
        <meshBasicMaterial color={[2.4, 1.8, 0.6]} toneMapped={false} transparent opacity={0.8} />
      </mesh>
      <mesh ref={b} rotation={[Math.PI / 1.8, 0.4, 0]}>
        <torusGeometry args={[1.45, 0.008, 8, 128]} />
        <meshBasicMaterial color={[0.8, 1.2, 2.6]} toneMapped={false} transparent opacity={0.6} />
      </mesh>
    </group>
  );
}

function TrophyPodium({ onCelebrate }: { onCelebrate: () => void }) {
  const plaque = useMemo(() => createLabelTexture("SINH VIÊN 5 TỐT", "Vinh danh những gương mặt tiêu biểu", "#e9c86a", 768, 200), []);
  useEffect(() => () => plaque.dispose(), [plaque]);

  // 5 trụ tiêu chí: tránh hướng thảm đỏ (góc 0)
  const pillarAngles = SV5T_CRITERIA.map((_, i) => Math.PI / 5 + (i * Math.PI * 2) / 5);

  return (
    <group>
      {/* bục 3 tầng */}
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[2.45, 2.55, 0.3, 64]} />
        <meshStandardMaterial color="#14151d" roughness={0.18} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.46, 0.03, 8, 128]} />
        <meshStandardMaterial color="#d4a73c" metalness={1} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.475, 0]}>
        <cylinderGeometry args={[1.75, 1.8, 0.35, 64]} />
        <meshStandardMaterial color="#ece7dc" roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.85, 0]}>
        <cylinderGeometry args={[1.1, 1.15, 0.4, 64]} />
        <meshStandardMaterial color="#111a3d" roughness={0.2} metalness={0.4} />
      </mesh>
      <mesh position={[0, 1.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.1, 0.025, 8, 128]} />
        <meshBasicMaterial color={[3, 2.2, 0.8]} toneMapped={false} />
      </mesh>
      {/* biển đồng phía trước bục */}
      <mesh position={[0, 0.475, 1.81]}>
        <planeGeometry args={[1.7, 0.34]} />
        <meshStandardMaterial map={plaque} emissiveMap={plaque} emissive="#ffffff" emissiveIntensity={0.45} />
      </mesh>

      <group position={[0, 1.05, 0]}>
        <Trophy onClick={onCelebrate} />
      </group>
      <HoloRings />
      <Sparkles count={90} scale={[4.5, 3.5, 4.5]} position={[0, 2.4, 0]} size={3.5} speed={0.35} color="#ffd66b" opacity={0.9} />

      {SV5T_CRITERIA.map((c, i) => (
        <CriterionPillar key={c.name} angle={pillarAngles[i]} name={c.name} color={c.color} />
      ))}

      <pointLight position={[0, 3.4, 2.6]} intensity={14} distance={0} decay={2} color="#ffe6b0" />
      {/* đèn rọi chính từ giếng trời xuống cúp */}
      <spotLight
        position={[0, 10, 0]}
        angle={0.32}
        penumbra={0.7}
        intensity={260}
        distance={0}
        decay={2}
        color="#fff1d0"
      />
    </group>
  );
}

export default memo(TrophyPodium);
