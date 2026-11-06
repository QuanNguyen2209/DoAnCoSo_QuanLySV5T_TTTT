"use client";

// Khung chân dung vinh danh: khung vàng đắp nổi, viền passe-partout, đèn rọi tranh,
// bảng tên đồng, huy hiệu sao cho SV đạt nhiều lần. Hover/chọn → khung nhô ra & sáng lên.
import { memo, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useCursor } from "@react-three/drei";
import { easing } from "maath";
import { createNameplateTexture, createPortraitTexture, createLabelTexture } from "./textures";
import { getStarGeometry } from "./TrophyPodium";
import type { FrameSlot } from "./hallLayout";

export interface HonorStudentData {
  sinh_vien: {
    id: number;
    ho_ten: string;
    ma_sv: string;
    email?: string;
    avatar_url: string | null;
    lop: { id: number; ma_lop: string; ten_lop: string } | null;
    khoa: { id: number; ma_khoa: string; ten_khoa: string } | null;
  };
  so_lan_dat: number;
  ho_so_list: {
    id: number;
    ma_ho_so: string;
    loai_doi_tuong: string;
    ngay_duyet: string;
    cap_xet_duyet: string;
    ky_xet_duyet: { id: number; ten_ky: string; nam_hoc: string; loai: string } | null;
    so_minh_chung: number;
  }[];
}

const FRAME_W = 1.5;
const FRAME_H = 1.86;
const BORDER = 0.13;

// Khung vàng đùn nổi có vát cạnh — dùng chung 1 geometry cho mọi khung
let frameGeometry: THREE.ExtrudeGeometry | null = null;
function getFrameGeometry() {
  if (!frameGeometry) {
    const w = FRAME_W / 2, h = FRAME_H / 2, b = BORDER;
    const shape = new THREE.Shape();
    shape.moveTo(-w, -h); shape.lineTo(w, -h); shape.lineTo(w, h); shape.lineTo(-w, h); shape.lineTo(-w, -h);
    const hole = new THREE.Path();
    hole.moveTo(-w + b, -h + b); hole.lineTo(-w + b, h - b); hole.lineTo(w - b, h - b); hole.lineTo(w - b, -h + b); hole.lineTo(-w + b, -h + b);
    shape.holes.push(hole);
    frameGeometry = new THREE.ExtrudeGeometry(shape, {
      depth: 0.06, bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.035, bevelSegments: 4, curveSegments: 4,
    });
    frameGeometry.translate(0, 0, -0.03);
  }
  return frameGeometry;
}

// Quầng sáng hình nón của đèn rọi tranh (giả lập ánh sáng thể tích, rẻ hơn đèn thật)
function useLightConeMaterial() {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 4; c.height = 128;
    const ctx = c.getContext("2d")!;
    const g = ctx.createLinearGradient(0, 0, 0, 128);
    g.addColorStop(0, "rgba(255,230,170,0.55)");
    g.addColorStop(1, "rgba(255,230,170,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4, 128);
    const tex = new THREE.CanvasTexture(c);
    return new THREE.MeshBasicMaterial({
      map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, opacity: 0.55,
    });
  }, []);
}

function PictureLight({ active }: { active: boolean }) {
  const cone = useLightConeMaterial();
  useEffect(() => () => { cone.map?.dispose(); cone.dispose(); }, [cone]);
  useEffect(() => { cone.opacity = active ? 0.9 : 0.5; }, [active, cone]);
  return (
    <group position={[0, FRAME_H / 2 + 0.16, 0.18]}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.035, 0.035, 0.75, 16]} />
        <meshStandardMaterial color="#c79a3a" metalness={1} roughness={0.3} />
      </mesh>
      <mesh position={[0, -0.03, 0.02]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.012, 0.012, 0.7, 8]} />
        <meshBasicMaterial color={[4, 3.2, 2]} toneMapped={false} />
      </mesh>
      <mesh position={[0, -0.12, -0.12]} rotation={[0.55, 0, 0]}>
        <boxGeometry args={[0.04, 0.24, 0.03]} />
        <meshStandardMaterial color="#c79a3a" metalness={1} roughness={0.3} />
      </mesh>
      {/* nón sáng chiếu xuống mặt tranh */}
      <mesh position={[0, -0.85, 0.12]} rotation={[-0.16, 0, 0]} material={cone}>
        <coneGeometry args={[0.95, 1.7, 32, 1, true]} />
      </mesh>
    </group>
  );
}

interface FrameProps {
  student: HonorStudentData;
  slot: FrameSlot;
  isSelected: boolean;
  onSelect: (student: HonorStudentData) => void;
}

function HonorFrame3D({ student, slot, isSelected, onSelect }: FrameProps) {
  const inner = useRef<THREE.Group>(null);
  const glow = useRef<THREE.MeshBasicMaterial>(null);
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);

  const portrait = useMemo(() => createPortraitTexture(student), [student]);
  const plate = useMemo(() => createNameplateTexture(student), [student]);
  useEffect(() => () => { portrait.dispose(); plate.dispose(); }, [portrait, plate]);

  const active = isSelected || hovered;

  useFrame((_, delta) => {
    if (inner.current) {
      easing.damp3(inner.current.position, [0, 0, active ? 0.22 : 0], 0.18, delta);
      const s = isSelected ? 1.06 : hovered ? 1.03 : 1;
      easing.damp3(inner.current.scale, [s, s, s], 0.18, delta);
    }
    if (glow.current) easing.damp(glow.current, "opacity", isSelected ? 0.85 : hovered ? 0.45 : 0, 0.2, delta);
  });

  return (
    <group position={slot.pos} rotation={[0, slot.rotY, 0]}>
      <PictureLight active={active} />
      <group
        ref={inner}
        onClick={(e) => { e.stopPropagation(); onSelect(student); }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={() => setHovered(false)}
      >
        {/* quầng sáng khi chọn */}
        <mesh position={[0, 0, -0.06]}>
          <planeGeometry args={[FRAME_W + 0.35, FRAME_H + 0.35]} />
          <meshBasicMaterial ref={glow} color={[3, 2.2, 0.7]} transparent opacity={0} toneMapped={false} depthWrite={false} />
        </mesh>
        {/* khung vàng-đỏ Đoàn */}
        <mesh geometry={getFrameGeometry()}>
          <meshStandardMaterial
            color={isSelected ? "#DA251D" : "#d6a93f"}
            emissive={isSelected ? "#8b0000" : "#000000"}
            emissiveIntensity={isSelected ? 0.5 : 0}
            metalness={1}
            roughness={0.22}
          />
        </mesh>
        {/* viền trắng ngà passe-partout */}
        <mesh position={[0, 0, -0.005]}>
          <planeGeometry args={[FRAME_W - BORDER * 2 + 0.02, FRAME_H - BORDER * 2 + 0.02]} />
          <meshStandardMaterial color="#f8f4ec" roughness={0.9} />
        </mesh>
        {/* ảnh chân dung */}
        <mesh position={[0, 0.02, 0.004]}>
          <planeGeometry args={[1.02, 1.28]} />
          <meshStandardMaterial
            map={portrait.texture}
            emissiveMap={portrait.texture}
            emissive="#ffffff"
            emissiveIntensity={active ? 0.38 : 0.22}
            roughness={0.55}
          />
        </mesh>
        {/* huy hiệu sao vàng Đoàn — sáng hơn, vị trí góc trên phải */}
        {student.so_lan_dat > 1 && (
          <mesh geometry={getStarGeometry()} position={[FRAME_W / 2 - 0.1, FRAME_H / 2 - 0.1, 0.09]} scale={0.13}>
            <meshStandardMaterial color="#FFCC00" emissive="#FFB800" emissiveIntensity={2.2} toneMapped={false} />
          </mesh>
        )}
        {/* bảng tên đỏ Đoàn */}
        <group position={[0, -FRAME_H / 2 - 0.3, 0.02]}>
          <mesh>
            <boxGeometry args={[1.32, 0.42, 0.04]} />
            <meshStandardMaterial color="#8b0a0a" metalness={0.8} roughness={0.4} />
          </mesh>
          {/* gờ vàng bảng tên */}
          <mesh position={[0, 0, 0.021]}>
            <boxGeometry args={[1.34, 0.44, 0.005]} />
            <meshStandardMaterial color="#d4a73c" metalness={1} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0, 0.026]}>
            <planeGeometry args={[1.26, 0.378]} />
            <meshStandardMaterial map={plate} metalness={0.4} roughness={0.35} emissiveMap={plate} emissive="#ffffff" emissiveIntensity={0.22} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

export default memo(HonorFrame3D);

// Ô trống trên tường: "Gương mặt tiếp theo có thể là bạn"
export const EmptyFrame3D = memo(function EmptyFrame3D({ slot }: { slot: FrameSlot }) {
  const label = useMemo(() => createLabelTexture("VỊ TRÍ DÀNH CHO BẠN", "Gương mặt SV5T tiếp theo", "#9aa4c7", 512, 640), []);
  useEffect(() => () => label.dispose(), [label]);
  return (
    <group position={slot.pos} rotation={[0, slot.rotY, 0]}>
      <mesh geometry={getFrameGeometry()}>
        <meshStandardMaterial color="#8a7340" metalness={1} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0, -0.005]}>
        <planeGeometry args={[FRAME_W - BORDER * 2 + 0.02, FRAME_H - BORDER * 2 + 0.02]} />
        <meshStandardMaterial map={label} roughness={0.9} emissiveMap={label} emissive="#ffffff" emissiveIntensity={0.12} />
      </mesh>
    </group>
  );
});
