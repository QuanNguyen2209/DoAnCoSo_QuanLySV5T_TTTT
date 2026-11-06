"use client";

// Sảnh Vinh Danh 3D — sảnh tròn kiểu bảo tàng
import { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { AdaptiveDpr, Environment, Lightformer, Loader } from "@react-three/drei";
import HallArchitecture from "./HallArchitecture";
import TrophyPodium from "./TrophyPodium";
import HonorFrame3D, { EmptyFrame3D, type HonorStudentData } from "./HonorFrame3D";
import CameraRig, { type CameraGoal, type WalkGoal } from "./CameraRig";
import ConfettiBurst from "./ConfettiBurst";
import Effects from "./Effects";
import HonorDetailModal from "./HonorDetailModal";
import { computeHallLayout, HALL, HOME_TARGET, type FrameSlot, type Vec3 } from "./hallLayout";
import {
  RotateCcw, Sparkles, Trophy, Users, Search, Play, Pause, Maximize2, Minimize2, Gauge, PartyPopper,
} from "lucide-react";

export type { HonorStudentData };

type Quality = "high" | "standard";
const QUALITY_KEY = "sv5t_hall_quality";
const TOUR_INTERVAL_MS = 6000;

// Đèn rọi đi theo khung ảnh đang được chọn.
// LUÔN gắn sẵn trong cảnh (chỉ tắt bằng intensity = 0): thêm/bớt đèn làm three.js biên dịch lại
// shader của MỌI vật liệu → cảnh khựng vài giây mỗi lần bấm chọn.
function SelectedSpot({ slot }: { slot: FrameSlot | null }) {
  const target = useMemo(() => new THREE.Object3D(), []);
  const pos = slot?.pos ?? ([0, 0, 0] as Vec3);
  const position = useMemo<Vec3>(() => [pos[0] * 0.72, pos[1] + 2.6, pos[2] * 0.72], [pos]);
  return (
    <>
      <primitive object={target} position={pos} />
      <spotLight position={position} target={target} angle={0.32} penumbra={0.85} intensity={slot ? 70 : 0} distance={0} decay={2} color="#fff3d6" />
    </>
  );
}

// Bảo vệ chế độ "Chất lượng cao": nếu máy không kéo nổi (< 24 FPS trong 4 giây) thì tự về "Tiêu chuẩn".
// Dùng setInterval thay vì đo trong useFrame vì khi quá nặng, khung hình gần như dừng hẳn.
function QualityGuard({ onTooSlow }: { onTooSlow: () => void }) {
  const frames = useRef(0);
  useFrame(() => { frames.current += 1; });
  useEffect(() => {
    const started = performance.now();
    frames.current = 0;
    const timer = setInterval(() => {
      const elapsed = (performance.now() - started) / 1000;
      if (elapsed < 4) return;
      clearInterval(timer);
      if (frames.current / elapsed < 24) onTooSlow();
    }, 500);
    return () => clearInterval(timer);
  }, [onTooSlow]);
  return null;
}

// Biên dịch trước TOÀN BỘ shader song song (KHR_parallel_shader_compile) rồi mới chạy vòng lặp vẽ.
// Nếu không, khung hình đầu buộc GPU biên dịch tuần tự từng shader → trên card tích hợp (Windows/ANGLE)
// trang bị đơ hàng chục giây. Đặt component này CUỐI cảnh để Environment đã gắn envMap.
function ShaderWarmUp({ onDone }: { onDone: () => void }) {
  const { gl, scene, camera } = useThree();
  useLayoutEffect(() => {
    let finished = false;
    const finish = () => { if (!finished) { finished = true; onDone(); } };
    const fallback = setTimeout(finish, 20000); // không chờ quá 20 giây
    const t = setTimeout(() => {
      const r = gl as unknown as { compileAsync?: (s: unknown, c: unknown) => Promise<unknown> };
      if (typeof r.compileAsync === "function") r.compileAsync(scene, camera).catch(() => {}).finally(finish);
      else finish();
    }, 0);
    return () => { clearTimeout(t); clearTimeout(fallback); };
  }, [gl, scene, camera, onDone]);
  return null;
}

// Báo cho giao diện khi cảnh đã vẽ trơn tru (lần đầu GPU phải biên dịch shader, có thể mất vài giây)
function ReadySignal({ onReady }: { onReady: () => void }) {
  const frames = useRef(0);
  const done = useRef(false);
  useFrame(() => {
    if (done.current) return;
    frames.current += 1;
    if (frames.current > 8) { done.current = true; onReady(); }
  });
  return null;
}

// Đèn hắt tường (ít đèn: mỗi đèn thêm vào làm mọi bề mặt tốn thêm 1 lượt tính sáng)
function WallWashLights({ radius }: { radius: number }) {
  const lights = useMemo(
    () => Array.from({ length: 3 }, (_, i) => {
      const a = (i / 3) * Math.PI * 2 + Math.PI / 3;
      return [Math.sin(a) * (radius - 2.4), 5.6, Math.cos(a) * (radius - 2.4)] as Vec3;
    }),
    [radius]
  );
  return (
    <>
      {lights.map((p, i) => (
        <pointLight key={i} position={p} intensity={45} distance={0} decay={2} color="#ffd9a0" />
      ))}
    </>
  );
}

export default function Honor3DGallery({ students }: { students: HonorStudentData[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedStudent, setSelectedStudent] = useState<HonorStudentData | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  // Mặc định "Tiêu chuẩn" (chạy mượt cả trên laptop đồ hoạ tích hợp); "Chất lượng cao" bật thêm sàn gương + bloom
  const [quality, setQuality] = useState<Quality>("standard");
  const [notice, setNotice] = useState<string | null>(null);
  const [sceneReady, setSceneReady] = useState(false);
  const [warmedUp, setWarmedUp] = useState(false);
  const markWarm = useCallback(() => setWarmedUp(true), []);
  const markReady = useCallback(() => setSceneReady(true), []);
  const [touring, setTouring] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [burstKey, setBurstKey] = useState(0);
  const [goal, setGoal] = useState<CameraGoal | null>(null);
  const [walk, setWalk] = useState<WalkGoal | null>(null);
  const [autoSpin, setAutoSpin] = useState(true); // tự xoay nhẹ khi đang ở toàn cảnh

  // Nhớ lựa chọn chất lượng đồ hoạ của người xem
  useEffect(() => {
    try {
      const q = localStorage.getItem(QUALITY_KEY);
      if (q === "high" || q === "standard") setQuality(q);
    } catch { /* bỏ qua */ }
  }, []);
  const toggleQuality = () => {
    const next: Quality = quality === "high" ? "standard" : "high";
    setNotice(null);
    setQuality(next);
    try { localStorage.setItem(QUALITY_KEY, next); } catch { /* bỏ qua */ }
  };

  const filteredStudents = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return students;
    return students.filter(
      (s) =>
        s.sinh_vien.ho_ten.toLowerCase().includes(term) ||
        (s.sinh_vien.ma_sv || "").toLowerCase().includes(term) ||
        (s.sinh_vien.khoa?.ten_khoa || "").toLowerCase().includes(term) ||
        (s.sinh_vien.lop?.ma_lop || "").toLowerCase().includes(term)
    );
  }, [students, searchTerm]);

  const layout = useMemo(() => computeHallLayout(filteredStudents.length), [filteredStudents.length]);

  const selectedIndex = selectedStudent
    ? filteredStudents.findIndex((s) => s.sinh_vien.id === selectedStudent.sinh_vien.id)
    : -1;
  const selectedSlot = selectedIndex >= 0 ? layout.slots[selectedIndex] : null;

  // Chọn sinh viên → máy quay bay tới trước khung ảnh
  useEffect(() => {
    if (selectedSlot) setGoal({ position: selectedSlot.cameraPos, target: selectedSlot.lookAt, key: Date.now() });
  }, [selectedSlot]);

  const goHome = useCallback(() => {
    setSelectedStudent(null);
    setTouring(false);
    setAutoSpin(true);
    setGoal({ position: layout.homeCamera, target: HOME_TARGET, key: Date.now() });
  }, [layout.homeCamera]);

  const step = useCallback(
    (dir: 1 | -1) => {
      if (filteredStudents.length === 0) return;
      const base = selectedIndex < 0 ? (dir > 0 ? -1 : 0) : selectedIndex;
      const next = (base + dir + filteredStudents.length) % filteredStudents.length;
      setSelectedStudent(filteredStudents[next]);
    },
    [filteredStudents, selectedIndex]
  );

  // Tham quan tự động: lần lượt dừng trước từng gương mặt
  useEffect(() => {
    if (!touring || filteredStudents.length === 0) return;
    if (selectedIndex < 0) step(1);
    const t = setInterval(() => step(1), TOUR_INTERVAL_MS);
    return () => clearInterval(t);
  }, [touring, step, filteredStudents.length, selectedIndex]);

  // Phím tắt: ← → chuyển sinh viên, Esc về toàn cảnh
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "Escape" && selectedStudent) goHome();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, goHome, selectedStudent]);

  // Toàn màn hình
  useEffect(() => {
    const onChange = () => setIsFullscreen(document.fullscreenElement === containerRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);
  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else containerRef.current?.requestFullscreen?.().catch(() => {});
  };

  const handleTooSlow = useCallback(() => {
    setQuality("standard");
    try { localStorage.setItem(QUALITY_KEY, "standard"); } catch { /* bỏ qua */ }
    setNotice("Máy chạy chưa đủ mượt ở Chất lượng cao nên đã tự chuyển về Tiêu chuẩn.");
    setTimeout(() => setNotice(null), 6000);
  }, []);

  const handleFloorDoubleClick = useCallback((point: Vec3) => {
    setTouring(false);
    setAutoSpin(false);
    setWalk({ point, key: Date.now() });
  }, []);
  const celebrate = useCallback(() => setBurstKey((k) => k + 1), []);
  const handleSelect = useCallback((s: HonorStudentData) => { setTouring(false); setSelectedStudent(s); }, []);

  const hudBtn =
    "flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-700 hover:border-amber-400 text-white text-xs font-semibold shadow-lg transition-all";

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden bg-[#04060d] border border-slate-800 shadow-2xl select-none ${
        isFullscreen ? "h-screen rounded-none" : "h-[780px] rounded-3xl"
      }`}
    >
      {/* ── HUD trái: tiêu đề + tìm kiếm ── */}
      <div className="absolute top-5 left-5 z-20 pointer-events-auto flex flex-col gap-2 max-w-[calc(100%-2.5rem)]">
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-slate-700/80 shadow-lg text-white">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-300 to-yellow-600 flex items-center justify-center text-slate-950 shadow">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold flex items-center gap-1.5 leading-none">
              Sảnh Vinh Danh 3D <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Phòng truyền thống Sinh viên 5 Tốt</p>
          </div>
          <span className="ml-2 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-300 text-xs font-semibold flex items-center gap-1">
            <Users className="w-3 h-3" /> {filteredStudents.length} gương mặt
          </span>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setSelectedStudent(null); }}
            placeholder="Tìm theo tên, MSSV, lớp, khoa..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700/80 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* ── HUD phải: điều khiển ── */}
      <div className={`absolute z-20 pointer-events-auto flex flex-wrap gap-2 left-5 top-[8.5rem] lg:left-auto lg:top-5 lg:justify-end ${selectedStudent ? "hidden lg:flex lg:right-[28.5rem]" : "lg:right-5"}`}>
        <button onClick={goHome} className={hudBtn} title="Về toàn cảnh (Esc)">
          <RotateCcw className="w-3.5 h-3.5 text-amber-400" /> Toàn cảnh
        </button>
        <button onClick={() => setTouring((t) => !t)} className={hudBtn} disabled={filteredStudents.length === 0}>
          {touring ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-amber-400" />}
          {touring ? "Dừng tham quan" : "Tham quan tự động"}
        </button>
        <button onClick={celebrate} className={hudBtn} title="Bắn pháo giấy">
          <PartyPopper className="w-3.5 h-3.5 text-amber-400" />
        </button>
        <button onClick={toggleQuality} className={hudBtn} title="Chất lượng đồ hoạ">
          <Gauge className="w-3.5 h-3.5 text-amber-400" /> {quality === "high" ? "Chất lượng cao" : "Tiêu chuẩn"}
        </button>
        <button onClick={toggleFullscreen} className={hudBtn} title="Toàn màn hình">
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-amber-400" /> : <Maximize2 className="w-3.5 h-3.5 text-amber-400" />}
        </button>
      </div>

      {/* ── Hướng dẫn ── */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 pointer-events-none hidden md:block">
        <div className="px-5 py-2 rounded-full bg-slate-950/75 backdrop-blur-md border border-slate-800 text-[11px] text-slate-400 flex items-center gap-3 shadow-lg whitespace-nowrap">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> Kéo để xoay</span>
          <span>•</span><span>Cuộn để zoom</span>
          <span>•</span><span>Nhấp đúp lên sàn để đi tới</span>
          <span>•</span><span>← → chuyển sinh viên</span>
          <span>•</span><span className="text-amber-300 font-medium">Bấm khung ảnh để xem chi tiết • Bấm cúp để ăn mừng 🎉</span>
        </div>
      </div>

      {notice && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-xl bg-amber-500/90 text-slate-950 text-xs font-semibold shadow-lg">
          {notice}
        </div>
      )}

      {filteredStudents.length === 0 && (
        <div className="absolute inset-x-0 top-1/3 z-10 text-center pointer-events-none">
          <p className="text-slate-300 font-semibold">Không tìm thấy sinh viên phù hợp trong sảnh</p>
        </div>
      )}

      <HonorDetailModal
        student={selectedStudent}
        onClose={goHome}
        onPrev={filteredStudents.length > 1 ? () => step(-1) : undefined}
        onNext={filteredStudents.length > 1 ? () => step(1) : undefined}
      />

      {/* ── Cảnh 3D ── */}
      <Canvas
        frameloop={warmedUp ? "always" : "never"}
        dpr={quality === "high" ? [1, 1.75] : [1, 1.25]}
        camera={{ position: layout.homeCamera, fov: 55, near: 0.1, far: 200 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
        }}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      >
        <color attach="background" args={["#04060d"]} />
        <ambientLight intensity={0.3} />
        <hemisphereLight args={["#c3ccff", "#24160a", 0.5]} />
        {quality === "high" && <QualityGuard onTooSlow={handleTooSlow} />}
        <AdaptiveDpr pixelated />
        <WallWashLights radius={layout.radius} />

        <Suspense fallback={null}>
          {/* Phản chiếu "studio" dựng tại chỗ bằng Lightformer — không cần tải HDRI từ mạng */}
          <Environment resolution={256} frames={1} environmentIntensity={1.3}>
            <Lightformer form="ring" intensity={4} color="#fff1d0" scale={8} position={[0, 12, 0]} rotation={[Math.PI / 2, 0, 0]} />
            <Lightformer form="rect" intensity={2.2} color="#ffd88a" scale={[30, 2, 1]} position={[0, 5, -14]} />
            <Lightformer form="rect" intensity={1.4} color="#9fb4ff" scale={[30, 2, 1]} position={[0, 5, 14]} rotation={[0, Math.PI, 0]} />
            <Lightformer form="rect" intensity={1.4} color="#ffffff" scale={[2, 9, 1]} position={[14, 4, 0]} rotation={[0, -Math.PI / 2, 0]} />
            <Lightformer form="rect" intensity={1.4} color="#ffffff" scale={[2, 9, 1]} position={[-14, 4, 0]} rotation={[0, Math.PI / 2, 0]} />
          </Environment>

          <HallArchitecture
            radius={layout.radius}
            wallHeight={HALL.wallHeight}
            columnAngles={layout.columnAngles}
            quality={quality}
            onFloorDoubleClick={handleFloorDoubleClick}
          />
          <TrophyPodium onCelebrate={celebrate} />
          <ConfettiBurst burstKey={burstKey} />

          {layout.slots.map((slot) => {
            const student = filteredStudents[slot.index];
            return (
              <HonorFrame3D
                key={student.sinh_vien.id}
                student={student}
                slot={slot}
                isSelected={selectedStudent?.sinh_vien.id === student.sinh_vien.id}
                onSelect={handleSelect}
              />
            );
          })}
          {layout.emptySlots.map((slot) => (
            <EmptyFrame3D key={`empty-${slot.angle.toFixed(4)}`} slot={slot} />
          ))}
          <SelectedSpot slot={selectedSlot} />
          <ReadySignal onReady={markReady} />
          <ShaderWarmUp onDone={markWarm} />

          {quality === "high" && <Effects />}
        </Suspense>

        <CameraRig
          goal={goal}
          walk={walk}
          hallRadius={layout.radius}
          ceiling={HALL.wallHeight + 2.5}
          autoRotate={autoSpin && !selectedStudent && !touring}
        />
      </Canvas>

      {!sceneReady && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-3 bg-[#04060d]/95 text-amber-100 pointer-events-none">
          <div className="w-10 h-10 rounded-full border-2 border-amber-400/30 border-t-amber-400 animate-spin" />
          <p className="text-sm font-semibold">Đang chuẩn bị sảnh vinh danh…</p>
          <p className="text-xs text-slate-400">Lần đầu mở có thể mất vài giây trên máy dùng card đồ hoạ tích hợp</p>
        </div>
      )}

      <Loader
        containerStyles={{ background: "rgba(4, 6, 13, 0.96)" }}
        innerStyles={{ width: "240px", backgroundColor: "#1e1b4b" }}
        barStyles={{ backgroundColor: "#fbbf24" }}
        dataStyles={{ color: "#fef3c7", fontSize: "12px", fontWeight: "bold" }}
        dataInterpolation={(p) => `Đang dựng sảnh vinh danh... ${p.toFixed(0)}%`}
      />
    </div>
  );
}
