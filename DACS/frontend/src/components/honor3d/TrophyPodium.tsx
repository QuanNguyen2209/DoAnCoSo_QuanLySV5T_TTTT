"use client";

// Bục vinh danh trung tâm phong cách Đoàn Thanh niên Việt Nam:
// Bục 3 tầng màu đỏ-xanh Đoàn, cúp vàng, ngôi sao 5 cánh phát sáng lớn,
// 5 trụ pha lê tượng trưng 5 tiêu chí SV5T, nhẫn holo đỏ-vàng.
// Bấm vào cúp → bắn pháo giấy ăn mừng.
import { memo, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Billboard, Float, Sparkles, useCursor } from "@react-three/drei";
import { createLabelTexture } from "./textures";

const GOLD_PHYSICAL = {
  color: "#ffcf57",
  metalness: 1,
  roughness: 0.3,
  envMapIntensity: 2.4,
  emissive: "#4a2e00",
  emissiveIntensity: 0.5,
} as const;

export const SV5T_CRITERIA = [
  { name: "Đạo đức tốt",    color: "#f43f5e" },
  { name: "Học tập tốt",    color: "#3b82f6" },
  { name: "Thể lực tốt",    color: "#22c55e" },
  { name: "Tình nguyện tốt", color: "#f59e0b" },
  { name: "Hội nhập tốt",   color: "#a855f7" },
];

// Hình ngôi sao 5 cánh dùng chung
let starGeometry: THREE.ExtrudeGeometry | null = null;
export function getStarGeometry() {
  if (!starGeometry) {
    const shape = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? 1 : 0.42;
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

// ── Cúp vàng quay + ngôi sao phát sáng ─────────────────────────────
function Trophy({ onClick }: { onClick: () => void }) {
  const group = useRef<THREE.Group>(null);
  const star = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);

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
    if (group.current) group.current.rotation.y += delta * 0.3;
    if (star.current) {
      star.current.rotation.y += delta * 1.6;
      const s = 0.18 + Math.sin(state.clock.elapsedTime * 2.2) * 0.014;
      star.current.scale.setScalar(hovered ? s * 1.3 : s);
    }
  });

  return (
    <group
      ref={group}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={() => setHovered(false)}
    >
      {/* đế đen viền đỏ-vàng */}
      <mesh position={[0, 0.14, 0]}>
        <boxGeometry args={[0.82, 0.28, 0.82]} />
        <meshStandardMaterial color="#0d0608" roughness={0.15} metalness={0.4} />
      </mesh>
      {/* gờ đỏ Đoàn */}
      <mesh position={[0, 0.28, 0]}>
        <boxGeometry args={[0.84, 0.05, 0.84]} />
        <meshStandardMaterial color="#DA251D" metalness={0.5} roughness={0.4} emissive="#DA251D" emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[0, 0.32, 0]}>
        <boxGeometry args={[0.62, 0.04, 0.62]} />
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
      {/* ngôi sao vàng lớn phát sáng */}
      <mesh ref={star} geometry={getStarGeometry()} position={[0, 2.1, 0]}>
        <meshStandardMaterial
          color="#FFCC00"
          emissive="#FFB800"
          emissiveIntensity={hovered ? 5 : 3.0}
          toneMapped={false}
        />
      </mesh>
      {/* đèn rọi cúp */}
      {hovered && <pointLight position={[0, 2.5, 0]} intensity={60} distance={0} decay={2} color="#FFDD55" />}
    </group>
  );
}

// ── Trụ tiêu chí 5 Tốt ──────────────────────────────────────────────
function CriterionPillar({ angle, name, color }: { angle: number; name: string; color: string }) {
  const crystal = useRef<THREE.Mesh>(null);
  const label = useMemo(
    () => createLabelTexture(name.toUpperCase(), "SINH VIÊN 5 TỐT", color, 512, 160),
    [name, color]
  );
  useEffect(() => () => label.dispose(), [label]);
  const r = 3.75;
  useFrame((_, delta) => {
    if (crystal.current) {
      crystal.current.rotation.y += delta * 0.9;
      crystal.current.rotation.x += delta * 0.35;
    }
  });
  return (
    <group position={[Math.sin(angle) * r, 0, Math.cos(angle) * r]}>
      {/* trụ trắng-vàng */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.26, 0.32, 1, 6]} />
        <meshStandardMaterial color="#f0ece0" roughness={0.35} />
      </mesh>
      {/* gờ đỏ chân trụ */}
      <mesh position={[0, 1.02, 0]}>
        <cylinderGeometry args={[0.35, 0.35, 0.06, 6]} />
        <meshStandardMaterial color="#DA251D" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.08, 0]}>
        <cylinderGeometry args={[0.34, 0.34, 0.03, 6]} />
        <meshStandardMaterial color="#d4a73c" metalness={1} roughness={0.28} />
      </mesh>
      {/* tinh thể phát sáng */}
      <Float speed={2} floatIntensity={0.4} rotationIntensity={0}>
        <mesh ref={crystal} position={[0, 1.56, 0]}>
          <icosahedronGeometry args={[0.22, 0]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.5} toneMapped={false} />
        </mesh>
      </Float>
      <Billboard position={[0, 2.1, 0]}>
        <mesh>
          <planeGeometry args={[1.1, 0.35]} />
          <meshBasicMaterial map={label} transparent toneMapped={false} />
        </mesh>
      </Billboard>
    </group>
  );
}

// ── Nhẫn holo đỏ-vàng Đoàn quay quanh cúp ─────────────────────────
function HoloRings() {
  const a = useRef<THREE.Mesh>(null);
  const b = useRef<THREE.Mesh>(null);
  const c = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (a.current) a.current.rotation.z += delta * 0.45;
    if (b.current) b.current.rotation.z -= delta * 0.28;
    if (c.current) c.current.rotation.x += delta * 0.2;
  });
  return (
    <group position={[0, 2.3, 0]}>
      {/* nhẫn vàng */}
      <mesh ref={a} rotation={[Math.PI / 2.3, 0, 0]}>
        <torusGeometry args={[1.3, 0.013, 8, 128]} />
        <meshBasicMaterial color={[3.0, 2.2, 0.0]} toneMapped={false} transparent opacity={0.85} />
      </mesh>
      {/* nhẫn đỏ */}
      <mesh ref={b} rotation={[Math.PI / 1.8, 0.4, 0]}>
        <torusGeometry args={[1.5, 0.009, 8, 128]} />
        <meshBasicMaterial color={[3.0, 0.3, 0.2]} toneMapped={false} transparent opacity={0.65} />
      </mesh>
      {/* nhẫn xanh Đoàn */}
      <mesh ref={c} rotation={[Math.PI / 2, 0.8, 0]}>
        <torusGeometry args={[1.65, 0.007, 8, 128]} />
        <meshBasicMaterial color={[0.2, 0.9, 2.5]} toneMapped={false} transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

// ── Bục trung tâm chính ─────────────────────────────────────────────
function TrophyPodium({ onCelebrate }: { onCelebrate: () => void }) {
  const plaque = useMemo(
    () => createLabelTexture("SINH VIÊN 5 TỐT TIÊU BIỂU", "Đoàn TNCS Hồ Chí Minh — HUTECH", "#FFCC00", 768, 200),
    []
  );
  useEffect(() => () => plaque.dispose(), [plaque]);

  // 5 trụ tiêu chí: tránh hướng thảm đỏ (góc 0)
  const pillarAngles = SV5T_CRITERIA.map((_, i) => Math.PI / 5 + (i * Math.PI * 2) / 5);

  return (
    <group>
      {/* ── Bục tầng 1 (ngoài): đỏ Đoàn ── */}
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[2.45, 2.55, 0.3, 64]} />
        <meshStandardMaterial color="#8b0a0a" roughness={0.2} metalness={0.3} />
      </mesh>
      {/* gờ vàng tầng 1 */}
      <mesh position={[0, 0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.46, 0.04, 8, 128]} />
        <meshStandardMaterial color="#d4a73c" metalness={1} roughness={0.25} />
      </mesh>

      {/* ── Bục tầng 2: trắng ivory ── */}
      <mesh position={[0, 0.475, 0]}>
        <cylinderGeometry args={[1.75, 1.8, 0.35, 64]} />
        <meshStandardMaterial color="#f0ece0" roughness={0.22} />
      </mesh>
      {/* gờ đỏ tầng 2 */}
      <mesh position={[0, 0.655, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.76, 0.03, 8, 128]} />
        <meshStandardMaterial color="#DA251D" metalness={0.5} roughness={0.4} />
      </mesh>

      {/* ── Bục tầng 3 (trên): xanh Đoàn sâu ── */}
      <mesh position={[0, 0.85, 0]}>
        <cylinderGeometry args={[1.1, 1.15, 0.4, 64]} />
        <meshStandardMaterial color="#001f4e" roughness={0.2} metalness={0.4} />
      </mesh>
      {/* gờ sáng vàng-đỏ trên đỉnh bục */}
      <mesh position={[0, 1.055, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.1, 0.028, 8, 128]} />
        <meshBasicMaterial color={[3.5, 2.5, 0.0]} toneMapped={false} />
      </mesh>

      {/* biển đồng phía trước bục */}
      <mesh position={[0, 0.475, 1.81]}>
        <planeGeometry args={[1.9, 0.38]} />
        <meshStandardMaterial map={plaque} emissiveMap={plaque} emissive="#ffffff" emissiveIntensity={0.5} />
      </mesh>

      {/* ── CÚP + HIỆU ỨNG ── */}
      <group position={[0, 1.05, 0]}>
        <Trophy onClick={onCelebrate} />
      </group>
      <HoloRings />

      {/* Sparkles vàng-đỏ */}
      <Sparkles count={70} scale={[4.5, 3.5, 4.5]} position={[0, 2.4, 0]} size={3.5} speed={0.4} color="#FFCC00" opacity={0.85} />
      <Sparkles count={30} scale={[3.5, 2.5, 3.5]} position={[0, 2.0, 0]} size={2.5} speed={0.6} color="#DA251D" opacity={0.6} />

      {/* 5 trụ tiêu chí */}
      {SV5T_CRITERIA.map((c, i) => (
        <CriterionPillar key={c.name} angle={pillarAngles[i]} name={c.name} color={c.color} />
      ))}

      {/* Đèn rọi trung tâm mạnh */}
      <pointLight position={[0, 3.4, 2.6]} intensity={18} distance={0} decay={2} color="#ffe6b0" />
      <spotLight
        position={[0, 10, 0]}
        angle={0.32}
        penumbra={0.7}
        intensity={320}
        distance={0}
        decay={2}
        color="#fff8e0"
      />
      {/* Đèn hắt đỏ từ dưới bục lên */}
      <pointLight position={[0, 0.1, 0]} intensity={40} distance={4} decay={2} color="#DA251D" />
    </group>
  );
}

export default memo(TrophyPodium);
