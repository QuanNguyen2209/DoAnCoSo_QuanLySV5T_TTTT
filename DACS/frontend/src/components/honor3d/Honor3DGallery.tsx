"use client";

import { useState, useMemo, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Loader } from "@react-three/drei";
import ExhibitionRoom3D from "./ExhibitionRoom3D";
import TrophyCenter3D from "./TrophyCenter3D";
import HonorFrame3D, { HonorStudentData } from "./HonorFrame3D";
import CameraRig from "./CameraRig";
import HonorDetailModal from "./HonorDetailModal";
import { RotateCcw, Sparkles, Trophy, Users, Search } from "lucide-react";

interface Honor3DGalleryProps {
  students: HonorStudentData[];
}

export default function Honor3DGallery({ students }: Honor3DGalleryProps) {
  const [selectedStudent, setSelectedStudent] = useState<HonorStudentData | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Lọc sinh viên theo ô tìm kiếm
  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) return students;
    const term = searchTerm.toLowerCase();
    return students.filter(
      (s) =>
        s.sinh_vien.ho_ten.toLowerCase().includes(term) ||
        s.sinh_vien.ma_sv.toLowerCase().includes(term) ||
        s.sinh_vien.khoa?.ten_khoa.toLowerCase().includes(term)
    );
  }, [students, searchTerm]);

  // Tính toán toạ độ và góc xoay cho từng khung tranh theo hình vòng cung bán nguyệt
  const framePositions = useMemo(() => {
    const total = filteredStudents.length;
    if (total === 0) return [];

    const radius = Math.max(6, Math.min(10, total * 0.9)); // Bán kính vòng cung
    // Góc trải rộng từ -75 độ đến +75 độ
    const startAngle = -Math.PI * 0.42;
    const endAngle = Math.PI * 0.42;
    const step = total > 1 ? (endAngle - startAngle) / (total - 1) : 0;

    return filteredStudents.map((_, index) => {
      const angle = total === 1 ? 0 : startAngle + step * index;
      const x = Math.sin(angle) * radius;
      const z = -Math.cos(angle) * radius + 2;
      const y = 1.0; // Chiều cao ngang tầm mắt

      // Xoay khung tranh hướng về phía tâm không gian
      const rotY = angle;

      return {
        pos: [x, y, z] as [number, number, number],
        rot: [0, rotY, 0] as [number, number, number],
        // Vị trí camera khi focus vào sinh viên này (đứng đối diện cách 2.2m)
        cameraPos: [x * 0.68, y + 0.1, z + 2.2] as [number, number, number],
        lookAt: [x, y, z] as [number, number, number],
      };
    });
  }, [filteredStudents]);

  // Tìm index của sinh viên đang chọn
  const selectedIndex = selectedStudent
    ? filteredStudents.findIndex((s) => s.sinh_vien.id === selectedStudent.sinh_vien.id)
    : -1;

  const currentFocus = selectedIndex !== -1 ? framePositions[selectedIndex] : null;

  const handlePrev = () => {
    if (filteredStudents.length === 0) return;
    const prevIdx = (selectedIndex - 1 + filteredStudents.length) % filteredStudents.length;
    setSelectedStudent(filteredStudents[prevIdx]);
  };

  const handleNext = () => {
    if (filteredStudents.length === 0) return;
    const nextIdx = (selectedIndex + 1) % filteredStudents.length;
    setSelectedStudent(filteredStudents[nextIdx]);
  };

  return (
    <div className="relative w-full h-[780px] rounded-3xl overflow-hidden bg-gradient-to-b from-slate-950 via-[#0a0f1d] to-slate-950 border border-slate-800 shadow-2xl select-none">
      {/* ── 2D HUD Header Overlay ── */}
      <div className="absolute top-6 left-6 z-20 pointer-events-auto flex flex-col gap-2">
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-slate-700/80 shadow-lg text-white">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center text-slate-950 shadow">
            <Trophy className="w-4 h-4 font-bold" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5 leading-none">
              Không Gian Triển Lãm 3D
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Phòng Truyền Thống Vinh Danh SV5T
            </p>
          </div>
          <span className="ml-2 px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 text-xs font-semibold flex items-center gap-1">
            <Users className="w-3 h-3" />
            {filteredStudents.length} gương mặt
          </span>
        </div>

        {/* Ô tìm kiếm nhanh trong không gian 3D */}
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm sinh viên trong sảnh..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700/80 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* ── 2D HUD Top-Right Action Controls ── */}
      <div className="absolute top-6 right-6 z-20 pointer-events-auto flex items-center gap-2">
        {selectedStudent && (
          <button
            onClick={() => setSelectedStudent(null)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700 hover:border-amber-400 text-white text-xs font-semibold shadow-lg transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            Xem toàn cảnh
          </button>
        )}
      </div>

      {/* ── 2D HUD Bottom Instruction Bar ── */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
        <div className="px-5 py-2 rounded-full bg-slate-950/75 backdrop-blur-md border border-slate-800 text-[11px] text-slate-400 flex items-center gap-3 shadow-lg">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Kéo chuột để xoay 360°
          </span>
          <span>•</span>
          <span>Cuộn chuột để Zoom</span>
          <span>•</span>
          <span className="text-amber-300 font-medium">
            Bấm vào khung tranh để xem chi tiết
          </span>
        </div>
      </div>

      {/* ── Modal chi tiết sinh viên khi được chọn ── */}
      <HonorDetailModal
        student={selectedStudent}
        onClose={() => setSelectedStudent(null)}
        onPrev={filteredStudents.length > 1 ? handlePrev : undefined}
        onNext={filteredStudents.length > 1 ? handleNext : undefined}
      />

      {/* ── 3D WebGL Canvas Scene ── */}
      <Canvas
        shadows
        camera={{ position: [0, 2.5, 9], fov: 48 }}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      >
        <Suspense fallback={null}>
          <ExhibitionRoom3D />
          <TrophyCenter3D />

          {/* Render các khung tranh sinh viên trong sảnh */}
          <group>
            {filteredStudents.map((student, idx) => {
              const frameConfig = framePositions[idx];
              if (!frameConfig) return null;
              return (
                <HonorFrame3D
                  key={student.sinh_vien.id}
                  student={student}
                  position={frameConfig.pos}
                  rotation={frameConfig.rot}
                  isSelected={selectedStudent?.sinh_vien.id === student.sinh_vien.id}
                  onSelect={(st) => setSelectedStudent(st)}
                />
              );
            })}
          </group>

          {/* Bộ điều khiển máy quay */}
          <CameraRig
            targetPosition={currentFocus ? currentFocus.cameraPos : null}
            targetLookAt={currentFocus ? currentFocus.lookAt : null}
          />
        </Suspense>
      </Canvas>

      {/* Drei Loader indicator */}
      <Loader
        containerStyles={{ background: "rgba(10, 15, 29, 0.95)" }}
        innerStyles={{ width: "240px", backgroundColor: "#1e1b4b" }}
        barStyles={{ backgroundColor: "#fbbf24" }}
        dataStyles={{ color: "#fef3c7", fontSize: "12px", fontWeight: "bold" }}
        dataInterpolation={(p) => `Đang tải không gian 3D... ${p.toFixed(0)}%`}
      />
    </div>
  );
}
