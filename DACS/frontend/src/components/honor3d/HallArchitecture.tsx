"use client";

// Kiến trúc sảnh tròn phong cách Đoàn Thanh niên / Hội Sinh viên Việt Nam:
// Sàn cẩm thạch trắng + ron đỏ-vàng, tường xanh Đoàn, cột trắng viền vàng,
// mái vòm ngôi sao, cờ Đoàn, đèn ánh sáng đỏ-vàng, thảm đỏ, dây nhung.
import { memo, useEffect, useMemo } from "react";
import * as THREE from "three";
import { MeshReflectorMaterial } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import {
  createMarbleTexture, createWallTexture, createDomeTexture, createBandTexture,
  createCarpetTexture, createLabelTexture,
  createVietnamFlagTexture, createDoanFlagTexture, createHoiSVFlagTexture, createSloganBannerTexture,
} from "./textures";

interface Props {
  radius: number;
  wallHeight: number;
  columnAngles: number[];
  quality: "high" | "standard";
  onFloorDoubleClick?: (point: [number, number, number]) => void;
}

// Vàng kim loại (giữ nguyên cột + viền trang trí)
const GOLD = { color: "#d4a73c", metalness: 1, roughness: 0.28 } as const;
// Đỏ Đoàn
const DOAN_RED_HEX = "#DA251D";

function useDisposable<T extends { dispose: () => void }>(factory: () => T, deps: unknown[]) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const value = useMemo(factory, deps);
  useEffect(() => () => value.dispose(), [value]);
  return value;
}

// ── Cột La Mã cải tiến: thân trắng ivory, vòng vàng, đèn tường ─────
function Column({ angle, radius, height }: { angle: number; radius: number; height: number }) {
  const r = radius - 0.5;
  return (
    <group position={[Math.sin(angle) * r, 0, Math.cos(angle) * r]}>
      {/* chân cột */}
      <mesh position={[0, 0.12, 0]}>
        <boxGeometry args={[0.78, 0.24, 0.78]} />
        <meshStandardMaterial color="#f0ece0" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.34, 0]}>
        <cylinderGeometry args={[0.32, 0.36, 0.2, 28]} />
        <meshStandardMaterial color="#f5f1e6" roughness={0.38} />
      </mesh>
      <mesh position={[0, 0.47, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.27, 0.035, 10, 32]} />
        <meshStandardMaterial {...GOLD} />
      </mesh>
      {/* thân cột ivory */}
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[0.22, 0.25, height - 1, 20]} />
        <meshStandardMaterial color="#f8f4ec" roughness={0.35} />
      </mesh>
      {/* đầu cột */}
      <mesh position={[0, height - 0.42, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.24, 0.04, 10, 32]} />
        <meshStandardMaterial {...GOLD} />
      </mesh>
      <mesh position={[0, height - 0.26, 0]}>
        <cylinderGeometry args={[0.36, 0.24, 0.32, 28]} />
        <meshStandardMaterial color="#f5f1e6" roughness={0.38} />
      </mesh>
      <mesh position={[0, height - 0.05, 0]}>
        <boxGeometry args={[0.86, 0.1, 0.86]} />
        <meshStandardMaterial {...GOLD} />
      </mesh>
      {/* đèn tường: ánh đỏ-vàng */}
      <group position={[0, height - 1.6, 0]} rotation={[0, angle + Math.PI, 0]}>
        <group position={[0, 0, 0.27]}>
          <mesh>
            <coneGeometry args={[0.11, 0.24, 16, 1, true]} />
            <meshStandardMaterial {...GOLD} />
          </mesh>
          {/* bóng đèn vàng-đỏ */}
          <mesh position={[0, 0.08, 0]}>
            <sphereGeometry args={[0.07, 12, 12]} />
            <meshBasicMaterial color={[4.5, 1.5, 0.3]} toneMapped={false} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

// ── Cột chắn dây nhung đỏ ───────────────────────────────────────────
function Stanchion({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.16, 0.18, 0.06, 24]} />
        <meshStandardMaterial {...GOLD} />
      </mesh>
      <mesh position={[0, 0.48, 0]}>
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
      <meshStandardMaterial color="#8b0000" roughness={0.65} />
    </mesh>
  );
}

// ── Cờ Đoàn & Cờ Hội treo tường trang trọng ───────────────────────
function WallFlag({
  angle,
  radius,
  wallHeight,
  texture,
}: {
  angle: number;
  radius: number;
  wallHeight: number;
  texture: THREE.Texture;
}) {
  const r = radius - 0.28;
  const x = Math.sin(angle) * r;
  const z = Math.cos(angle) * r;
  const rotY = -angle + Math.PI;
  const flagH = 1.6, flagW = 1.15;
  return (
    <group position={[x, wallHeight - 2.1, z]} rotation={[0, rotY, 0]}>
      {/* cán cờ vàng kim */}
      <mesh position={[-flagW / 2 - 0.02, 0, 0.02]}>
        <cylinderGeometry args={[0.025, 0.025, flagH + 0.4, 12]} />
        <meshStandardMaterial {...GOLD} />
      </mesh>
      {/* núm chóp cán cờ hình mũi giáo / búp sen */}
      <mesh position={[-flagW / 2 - 0.02, (flagH + 0.4) / 2 + 0.06, 0.02]}>
        <coneGeometry args={[0.05, 0.12, 12]} />
        <meshStandardMaterial {...GOLD} />
      </mesh>
      {/* lá cờ lụa (texture Đoàn / Hội) */}
      <mesh position={[0, 0, 0.015]}>
        <planeGeometry args={[flagW, flagH]} />
        <meshStandardMaterial
          map={texture}
          emissiveMap={texture}
          emissive="#ffffff"
          emissiveIntensity={0.25}
          roughness={0.75}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

// ── Cụm cờ đứng nghi thức (Tổ quốc, Đoàn, Hội) ──────────────────────
function CeremonialFlagStand({ position, rotation = [0, 0, 0] }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  const vnFlag = useDisposable(() => createVietnamFlagTexture(), []);
  const doanFlag = useDisposable(() => createDoanFlagTexture(), []);
  const hoiFlag = useDisposable(() => createHoiSVFlagTexture(), []);

  return (
    <group position={position} rotation={rotation}>
      {/* bục gỗ tròn đế cờ */}
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.45, 0.5, 0.16, 24]} />
        <meshStandardMaterial color="#3b1008" roughness={0.4} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.16, 0]}>
        <cylinderGeometry args={[0.38, 0.4, 0.04, 24]} />
        <meshStandardMaterial {...GOLD} />
      </mesh>

      {/* Cờ 1: Cờ Đoàn (trái) */}
      <group position={[-0.22, 0, 0]} rotation={[0, 0, 0.08]}>
        <mesh position={[0, 1.25, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 2.3, 12]} />
          <meshStandardMaterial {...GOLD} />
        </mesh>
        <mesh position={[0, 2.44, 0]}>
          <coneGeometry args={[0.04, 0.1, 12]} />
          <meshStandardMaterial {...GOLD} />
        </mesh>
        <mesh position={[0.42, 1.85, 0.02]}>
          <planeGeometry args={[0.84, 0.56]} />
          <meshStandardMaterial map={doanFlag} emissiveMap={doanFlag} emissive="#fff" emissiveIntensity={0.2} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Cờ 2: Cờ Tổ quốc (giữa - cao hơn) */}
      <group position={[0, 0, 0.06]}>
        <mesh position={[0, 1.45, 0]}>
          <cylinderGeometry args={[0.022, 0.022, 2.7, 12]} />
          <meshStandardMaterial {...GOLD} />
        </mesh>
        <mesh position={[0, 2.85, 0]}>
          <coneGeometry args={[0.045, 0.12, 12]} />
          <meshStandardMaterial {...GOLD} />
        </mesh>
        <mesh position={[0.48, 2.2, 0.02]}>
          <planeGeometry args={[0.96, 0.64]} />
          <meshStandardMaterial map={vnFlag} emissiveMap={vnFlag} emissive="#fff" emissiveIntensity={0.25} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Cờ 3: Cờ Hội Sinh viên (phải) */}
      <group position={[0.22, 0, 0]} rotation={[0, 0, -0.08]}>
        <mesh position={[0, 1.25, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 2.3, 12]} />
          <meshStandardMaterial {...GOLD} />
        </mesh>
        <mesh position={[0, 2.44, 0]}>
          <coneGeometry args={[0.04, 0.1, 12]} />
          <meshStandardMaterial {...GOLD} />
        </mesh>
        <mesh position={[0.42, 1.85, 0.02]}>
          <planeGeometry args={[0.84, 0.56]} />
          <meshStandardMaterial map={hoiFlag} emissiveMap={hoiFlag} emissive="#fff" emissiveIntensity={0.2} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

// ── Bảng Pano Khẩu hiệu Hành động Đoàn - Hội ───────────────────────
function SloganBanner({
  angle,
  radius,
  y,
  texture,
}: {
  angle: number;
  radius: number;
  y: number;
  texture: THREE.Texture;
}) {
  const r = radius - 0.22;
  const x = Math.sin(angle) * r;
  const z = Math.cos(angle) * r;
  const rotY = -angle + Math.PI;
  return (
    <group position={[x, y, z]} rotation={[0, rotY, 0]}>
      {/* khung viền vàng đồng dày */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[3.84, 1.0, 0.05]} />
        <meshStandardMaterial {...GOLD} />
      </mesh>
      {/* mặt pano lụa đỏ thắm */}
      <mesh position={[0, 0, 0.03]}>
        <planeGeometry args={[3.72, 0.9]} />
        <meshStandardMaterial
          map={texture}
          emissiveMap={texture}
          emissive="#ffffff"
          emissiveIntensity={0.4}
          roughness={0.6}
        />
      </mesh>
    </group>
  );
}

// ── Ngôi sao 2D nổi trên mái vòm ───────────────────────────────────
function DomeStar({ wallHeight, radius }: { wallHeight: number; radius: number }) {
  const domeScaleY = 0.42;
  const starY = wallHeight + radius * domeScaleY - 0.5;
  // Hình ngôi sao đơn giản bằng mesh tròn phát sáng
  return (
    <group position={[0, starY, 0]}>
      <mesh rotation={[0, 0, 0]}>
        <circleGeometry args={[0.6, 5]} />
        <meshBasicMaterial color="#FFCC00" toneMapped={false} transparent opacity={0.95} side={THREE.DoubleSide} />
      </mesh>
      <pointLight position={[0, 0, 0]} intensity={25} distance={0} decay={2} color="#FFDD55" />
    </group>
  );
}

function HallArchitecture({ radius, wallHeight, columnAngles, quality, onFloorDoubleClick }: Props) {
  const marble = useDisposable(() => createMarbleTexture(), []);
  const wall = useDisposable(() => createWallTexture(), []);
  const dome = useDisposable(() => createDomeTexture(), []);
  const band = useDisposable(
    () => createBandTexture("SẢNH VINH DANH  •  SINH VIÊN 5 TỐT  •  ĐOÀN THANH NIÊN HUTECH"),
    []
  );
  const doorSign = useDisposable(
    () => createLabelTexture("SẢNH VINH DANH", "Gương sáng Sinh viên 5 Tốt — Đoàn TNCS Hồ Chí Minh", "#FFCC00", 768, 192),
    []
  );

  const carpetStart = radius - 0.4;
  const carpetEnd = 2.7;
  const carpetLength = carpetStart - carpetEnd;
  const carpet = useDisposable(() => createCarpetTexture(carpetLength), [carpetLength]);

  const doanFlagTex = useDisposable(() => createDoanFlagTexture(), []);
  const hoiFlagTex = useDisposable(() => createHoiSVFlagTexture(), []);
  const sloganTex1 = useDisposable(
    () => createSloganBannerTexture("KHÁT VỌNG • TIÊN PHONG • BẢN LĨNH • SÁNG TẠO", "ĐOÀN TNCS HỒ CHÍ MINH — HUTECH"),
    []
  );
  const sloganTex2 = useDisposable(
    () => createSloganBannerTexture("RÈN ĐỨC LUYỆN TÀI • XUNG KÍCH VÌ CỘNG ĐỒNG", "SINH VIÊN 5 TỐT — TỰ HÀO TUỔI TRẺ VIỆT NAM"),
    []
  );

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

  // Tinh thể đèn chùm (màu vàng-đỏ nhẹ)
  const crystals = useMemo(
    () => Array.from({ length: 28 }, (_, i) => {
      const a = (i / 28) * Math.PI * 2;
      return { pos: [Math.sin(a) * 2.3, -0.35 - (i % 2) * 0.25, Math.cos(a) * 2.3] as [number, number, number] };
    }),
    []
  );

  // Vị trí treo cờ Đoàn (giữa các cột, tránh cửa)
  const flagAngles = useMemo(() => {
    return columnAngles.filter((a) => Math.abs(a % (Math.PI * 2)) > 0.4).slice(0, 6);
  }, [columnAngles]);

  const handleDoubleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onFloorDoubleClick?.([e.point.x, 0, e.point.z]);
  };

  return (
    <group>
      {/* ── ÁNH SÁNG BÙI TỬ THÀNH PHÒNG (đỏ-vàng Đoàn) ── */}
      {/* Đèn hắt tường màu đỏ nhẹ từ dưới lên */}
      {[0, Math.PI * 2 / 3, Math.PI * 4 / 3].map((a, i) => (
        <pointLight
          key={i}
          position={[Math.sin(a) * (radius - 1.5), 1.2, Math.cos(a) * (radius - 1.5)]}
          intensity={30}
          distance={0}
          decay={2.2}
          color="#c01818"
        />
      ))}
      {/* Đèn vàng tầm giữa */}
      {[Math.PI / 3, Math.PI, Math.PI * 5 / 3].map((a, i) => (
        <pointLight
          key={`g${i}`}
          position={[Math.sin(a) * (radius - 2), 3.5, Math.cos(a) * (radius - 2)]}
          intensity={40}
          distance={0}
          decay={2}
          color="#ffd060"
        />
      ))}

      {/* ── SÀN CẨM THẠCH TRẮNG ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} onDoubleClick={handleDoubleClick}>
        <circleGeometry args={[radius, 128]} />
        {quality === "high" ? (
          <MeshReflectorMaterial
            map={marble}
            blur={[300, 80]}
            resolution={512}
            mixBlur={1}
            mixStrength={18}
            mirror={0.45}
            depthScale={1.1}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.4}
            roughness={0.75}
            metalness={0.2}
            color="#ffffff"
          />
        ) : (
          <meshStandardMaterial map={marble} roughness={0.28} metalness={0.18} />
        )}
      </mesh>
      {/* Vòng khảm đỏ-vàng trên sàn */}
      {[3.05, 3.25].map((r) => (
        <mesh key={`red-${r}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
          <ringGeometry args={[r, r + 0.06, 128]} />
          <meshStandardMaterial color="#DA251D" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
      {[6.2].map((r) => (
        <mesh key={`gold-${r}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
          <ringGeometry args={[r, r + 0.06, 128]} />
          <meshStandardMaterial {...GOLD} />
        </mesh>
      ))}
      {/* Logo ngôi sao trên sàn tâm */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0]}>
        <circleGeometry args={[0.65, 5]} />
        <meshStandardMaterial color="#DA251D" metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]}>
        <circleGeometry args={[0.5, 5]} />
        <meshStandardMaterial color="#FFCC00" metalness={0.8} roughness={0.3} emissive="#FFCC00" emissiveIntensity={0.3} />
      </mesh>

      {/* ── TƯỜNG XANH ĐOÀN ── */}
      <mesh position={[0, wallHeight / 2, 0]}>
        <cylinderGeometry args={[radius, radius, wallHeight, 160, 1, true]} />
        <meshStandardMaterial map={wall} roughness={0.8} side={THREE.BackSide} />
      </mesh>
      {/* ốp gỗ tối chân tường */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[radius - 0.04, radius - 0.04, 1, 160, 1, true]} />
        <meshStandardMaterial color="#1a0a04" roughness={0.55} side={THREE.BackSide} />
      </mesh>
      {/* chỉ vàng tường */}
      {[1.02, 3.12, wallHeight - 0.95, wallHeight - 0.05].map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[radius - 0.06, 0.04, 8, 200]} />
          <meshStandardMaterial {...GOLD} />
        </mesh>
      ))}
      {/* chỉ đỏ Đoàn thêm */}
      {[1.5, 2.6].map((y) => (
        <mesh key={`red-band-${y}`} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[radius - 0.06, 0.025, 8, 200]} />
          <meshStandardMaterial color="#DA251D" metalness={0.3} roughness={0.5} />
        </mesh>
      ))}
      {/* dải chữ truyền thống */}
      <mesh position={[0, wallHeight - 0.5, 0]}>
        <cylinderGeometry args={[radius - 0.05, radius - 0.05, 0.9, 160, 1, true]} />
        <meshStandardMaterial map={band} emissiveMap={band} emissive="#ffffff" emissiveIntensity={0.4} roughness={0.5} side={THREE.BackSide} />
      </mesh>

      {/* ── CỘT ── */}
      {columnAngles.map((a) => (
        <Column key={a} angle={a} radius={radius} height={wallHeight} />
      ))}

      {/* ── CỜ ĐOÀN & CỜ HỘI TREO TƯỜNG XEN KẼ ── */}
      {flagAngles.map((a, i) => (
        <WallFlag
          key={a}
          angle={a}
          radius={radius}
          wallHeight={wallHeight}
          texture={i % 2 === 0 ? doanFlagTex : hoiFlagTex}
        />
      ))}

      {/* ── PANO KHẨU HIỆU ĐOÀN - HỘI TRÊN VÁCH ── */}
      <SloganBanner angle={-Math.PI / 3} radius={radius} y={wallHeight - 1.2} texture={sloganTex1} />
      <SloganBanner angle={Math.PI / 3} radius={radius} y={wallHeight - 1.2} texture={sloganTex2} />

      {/* ── CỤM CỜ ĐỨNG NGHI THỨC (TỔ QUỐC - ĐOÀN - HỘI) 2 BÊN LỐI VÀO ── */}
      <CeremonialFlagStand position={[-2.4, 0, carpetStart - 1.2]} rotation={[0, Math.PI / 6, 0]} />
      <CeremonialFlagStand position={[2.4, 0, carpetStart - 1.2]} rotation={[0, -Math.PI / 6, 0]} />

      {/* ── MÁI VÒM ── */}
      <mesh position={[0, wallHeight, 0]} scale={[1, domeScaleY, 1]}>
        <sphereGeometry args={[radius, 96, 48, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial map={dome} roughness={0.9} side={THREE.BackSide} />
      </mesh>
      {/* giếng trời vàng sáng */}
      <mesh position={[0, wallHeight + radius * domeScaleY - 0.06, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.6, 5]} />
        <meshBasicMaterial color={[3.5, 2.8, 0.5]} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, wallHeight + radius * domeScaleY - 0.08, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.65, 0.08, 12, 64]} />
        <meshStandardMaterial {...GOLD} />
      </mesh>
      {/* Ngôi sao vàng lớn trên đỉnh vòm */}
      <DomeStar wallHeight={wallHeight} radius={radius} />

      {/* ── ĐÈN CHÙM (tinh thể vàng) ── */}
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
        {crystals.map((crys, i) => (
          <mesh key={i} position={crys.pos}>
            <octahedronGeometry args={[0.09, 0]} />
            {/* tinh thể màu vàng-đỏ xen kẽ */}
            <meshBasicMaterial color={i % 2 === 0 ? [4, 3, 0.5] : [4, 1.2, 0.3]} toneMapped={false} />
          </mesh>
        ))}
        <pointLight position={[0, -0.6, 0]} intensity={120} distance={0} decay={2} color="#ffe090" />
      </group>

      {/* ── CỬA CHÍNH ── */}
      <group position={[0, 0, radius - 0.08]} rotation={[0, Math.PI, 0]}>
        {[-0.68, 0.68].map((x) => (
          <mesh key={x} position={[x, 1.8, 0]}>
            <boxGeometry args={[1.3, 3.6, 0.1]} />
            <meshStandardMaterial color="#2d1008" roughness={0.5} />
          </mesh>
        ))}
        {/* cuốn vòm cửa vàng */}
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
        {/* Biển cửa */}
        <mesh position={[0, 5.55, 0.06]}>
          <planeGeometry args={[3.6, 0.9]} />
          <meshStandardMaterial map={doorSign} emissiveMap={doorSign} emissive="#ffffff" emissiveIntensity={0.55} />
        </mesh>
        {/* Đèn chiếu biển cửa */}
        <pointLight position={[0, 5.5, 0.6]} intensity={12} distance={0} decay={2} color="#fff0a0" />
      </group>

      {/* ── THẢM ĐỎ ĐOÀN + DÂY NHUNG ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, (carpetStart + carpetEnd) / 2]}>
        <planeGeometry args={[2, carpetLength]} />
        <meshStandardMaterial map={carpet} roughness={0.92} />
      </mesh>
      {posts.map((p, i) => <Stanchion key={i} position={p} />)}
      {ropes.map((r, i) => <VelvetRope key={i} from={r.from} to={r.to} />)}
    </group>
  );
}

export default memo(HallArchitecture);
