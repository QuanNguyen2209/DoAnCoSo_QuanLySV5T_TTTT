"use client";

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Image as DreiImage, Html } from "@react-three/drei";
import * as THREE from "three";
import { Trophy, Award } from "lucide-react";

export interface HonorStudentData {
  sinh_vien: {
    id: number;
    ho_ten: string;
    ma_sv: string;
    email: string;
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

interface HonorFrame3DProps {
  student: HonorStudentData;
  position: [number, number, number];
  rotation: [number, number, number];
  isSelected: boolean;
  onSelect: (student: HonorStudentData) => void;
}

function getInitialsAvatarDataUrl(name: string): string {
  if (typeof document === "undefined") return "";
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    // Gradient background
    const grad = ctx.createLinearGradient(0, 0, 512, 512);
    grad.addColorStop(0, "#1e1b4b");
    grad.addColorStop(0.5, "#312e81");
    grad.addColorStop(1, "#4338ca");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Subtle star / crest circle
    ctx.strokeStyle = "rgba(251, 191, 36, 0.4)";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(256, 220, 140, 0, Math.PI * 2);
    ctx.stroke();

    // Initials
    const initials =
      name
        .trim()
        .split(/\s+/)
        .map((w) => w[0])
        .slice(-2)
        .join("")
        .toUpperCase() || "SV";

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 130px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(initials, 256, 215);

    // Badge banner
    ctx.fillStyle = "#f59e0b";
    ctx.fillRect(66, 390, 380, 52);

    ctx.fillStyle = "#1e1b4b";
    ctx.font = "bold 24px Inter, sans-serif";
    ctx.fillText("⭐ SINH VIÊN 5 TỐT ⭐", 256, 423);

    return canvas.toDataURL("image/png");
  } catch {
    return "";
  }
}

export default function HonorFrame3D({
  student,
  position,
  rotation,
  isSelected,
  onSelect,
}: HonorFrame3DProps) {
  const meshRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  // Avatar URL fallback to custom canvas data URL (100% WebGL-compatible, 0 CORS)
  const fallbackAvatar = getInitialsAvatarDataUrl(student.sinh_vien.ho_ten);
  const avatarUrl =
    student.sinh_vien.avatar_url && student.sinh_vien.avatar_url.startsWith("http")
      ? student.sinh_vien.avatar_url
      : fallbackAvatar;

  useFrame((_, delta) => {
    if (meshRef.current) {
      // Nhẹ nhàng nhô về phía trước khi hover hoặc khi được chọn
      const targetScale = isSelected ? 1.12 : hovered ? 1.06 : 1;
      meshRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        delta * 8
      );
    }
  });

  return (
    <group
      ref={meshRef}
      position={position}
      rotation={rotation}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(student);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "auto";
      }}
    >
      {/* Khung viền mạ vàng ngoài cùng */}
      <mesh position={[0, 0, -0.04]} castShadow>
        <boxGeometry args={[1.5, 2.0, 0.08]} />
        <meshStandardMaterial
          color={isSelected ? "#f59e0b" : hovered ? "#fbbf24" : "#b45309"}
          emissive={isSelected ? "#f59e0b" : hovered ? "#d97706" : "#000000"}
          emissiveIntensity={isSelected ? 0.6 : hovered ? 0.4 : 0}
          metalness={0.9}
          roughness={0.2}
        />
      </mesh>

      {/* Viền đen trang trí bên trong */}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[1.36, 1.86]} />
        <meshBasicMaterial color="#0f172a" />
      </mesh>

      {/* Ảnh chân dung Sinh viên (Drei Image) */}
      <group position={[0, 0.18, 0.02]}>
        <DreiImage
          url={avatarUrl}
          scale={[1.22, 1.4]}
          transparent
          radius={0.06}
          toneMapped={false}
        />
      </group>

      {/* Huy hiệu Cúp Vàng nhỏ góc trên */}
      <group position={[0.5, 0.8, 0.06]}>
        <mesh>
          <circleGeometry args={[0.16, 24]} />
          <meshBasicMaterial color="#fbbf24" />
        </mesh>
      </group>

      {/* Bảng tên và Thông tin hiển thị dưới khung (HTML Billboard) */}
      <Html
        position={[0, -0.68, 0.08]}
        center
        distanceFactor={6}
        transform
        occlude
      >
        <div
          className={`w-64 p-3 rounded-xl backdrop-blur-md transition-all text-center select-none pointer-events-none ${
            isSelected
              ? "bg-indigo-950/90 border-2 border-amber-400 text-white shadow-xl shadow-amber-500/20"
              : hovered
              ? "bg-slate-900/90 border border-amber-300 text-white shadow-lg"
              : "bg-slate-900/80 border border-slate-700/80 text-white/95"
          }`}
        >
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
              {student.so_lan_dat > 1
                ? `${student.so_lan_dat} Lần Đạt Danh Hiệu`
                : "Sinh viên 5 Tốt"}
            </span>
          </div>

          <p className="text-xs font-bold truncate leading-tight">
            {student.sinh_vien.ho_ten}
          </p>

          <p className="text-[10px] text-slate-300 truncate mt-0.5">
            {student.sinh_vien.khoa?.ten_khoa ||
              student.sinh_vien.lop?.ten_lop ||
              student.sinh_vien.ma_sv}
          </p>

          <div className="mt-1.5 pt-1 border-t border-slate-700/50 flex items-center justify-center gap-1 text-[9px] text-amber-200 font-semibold">
            <Award className="w-2.5 h-2.5" />
            <span>Bấm để xem chi tiết</span>
          </div>
        </div>
      </Html>
    </group>
  );
}
