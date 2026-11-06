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

// Đèn hắt tường màu đỏ-vàng Đoàn (xen kẽ nhau)
function WallWashLights({ radius }: { radius: number }) {
  const lights = useMemo(
    () => Array.from({ length: 6 }, (_, i) => {
      const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
      return {
        pos: [Math.sin(a) * (radius - 2.4), 5.6, Math.cos(a) * (radius - 2.4)] as Vec3,
        color: i % 2 === 0 ? "#c01010" : "#ffcc00",
      };
    }),
    [radius]
  );
  return (
    <>
      {lights.map((l, i) => (
        <pointLight key={i} position={l.pos} intensity={35} distance={0} decay={2} color={l.color} />
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
    "flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl backdrop-blur-md border text-white text-xs font-semibold shadow-lg transition-all hover:scale-105"
    + " bg-slate-900/85 border-red-900/60 hover:border-yellow-400";

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden border shadow-2xl select-none ${
        isFullscreen ? "h-screen rounded-none border-0" : "h-[780px] rounded-3xl border-red-900/40"
      }`}
      style={{ background: "linear-gradient(135deg, #04060d 0%, #0a0d1f 50%, #0d0410 100%)" }}
    >
      {/* ── Banner đỏ Đoàn phía trên ── */}
      <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none h-1.5 bg-gradient-to-r from-transparent via-red-700 to-transparent opacity-80" />

      {/* ── HUD trái: tiêu đề + tìm kiếm ── */}
      <div className="absolute top-5 left-5 z-20 pointer-events-auto flex flex-col gap-2 max-w-[calc(100%-2.5rem)]">
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl backdrop-blur-md border shadow-lg text-white"
          style={{ background: "rgba(10,5,0,0.88)", borderColor: "rgba(218,37,29,0.5)" }}>
          {/* Logo ngôi sao Đoàn */}
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow"
            style={{ background: "linear-gradient(135deg, #DA251D 0%, #8b0a0a 100%)" }}>
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-yellow-300">
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-black flex items-center gap-1.5 leading-none tracking-wide"
              style={{ color: "#FFCC00" }}>
              Sảnh Vinh Danh 3D
              <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            </h2>
            <p className="text-[11px] text-red-300 mt-0.5 font-medium">
              Đoàn TNCS Hồ Chí Minh — HUTECH
            </p>
          </div>
          <span className="ml-2 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 border"
            style={{ background: "rgba(218,37,29,0.15)", borderColor: "rgba(218,37,29,0.5)", color: "#ff9090" }}>
            <Users className="w-3 h-3" /> {filteredStudents.length} gương mặt
          </span>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-red-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setSelectedStudent(null); }}
            placeholder="Tìm theo tên, MSSV, lớp, khoa..."
            className="w-full pl-9 pr-3 py-2 rounded-xl backdrop-blur-md text-xs text-white placeholder-slate-500 focus:outline-none"
            style={{
              background: "rgba(10,5,0,0.82)",
              border: "1px solid rgba(218,37,29,0.4)",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#FFCC00")}
            onBlur={(e) => (e.target.style.borderColor = "rgba(218,37,29,0.4)")}
          />
        </div>
      </div>

      {/* ── HUD phải: điều khiển ── */}
      <div className={`absolute z-20 pointer-events-auto flex flex-wrap gap-2 left-5 top-[8.5rem] lg:left-auto lg:top-5 lg:justify-end ${selectedStudent ? "hidden lg:flex lg:right-[28.5rem]" : "lg:right-5"}`}>
        <button onClick={goHome} className={hudBtn} title="Về toàn cảnh (Esc)">
          <RotateCcw className="w-3.5 h-3.5" style={{ color: "#FFCC00" }} /> Toàn cảnh
        </button>
        <button onClick={() => setTouring((t) => !t)} className={hudBtn} disabled={filteredStudents.length === 0}>
          {touring ? <Pause className="w-3.5 h-3.5" style={{ color: "#FFCC00" }} /> : <Play className="w-3.5 h-3.5" style={{ color: "#FFCC00" }} />}
          {touring ? "Dừng tham quan" : "Tham quan tự động"}
        </button>
        <button onClick={celebrate} className={hudBtn} title="Bắn pháo giấy 🎉">
          <PartyPopper className="w-3.5 h-3.5" style={{ color: "#FFCC00" }} />
        </button>
        <button onClick={toggleQuality} className={hudBtn} title="Chất lượng đồ hoạ">
          <Gauge className="w-3.5 h-3.5" style={{ color: "#FFCC00" }} /> {quality === "high" ? "Chất lượng cao" : "Tiêu chuẩn"}
        </button>
        <button onClick={toggleFullscreen} className={hudBtn} title="Toàn màn hình">
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" style={{ color: "#FFCC00" }} /> : <Maximize2 className="w-3.5 h-3.5" style={{ color: "#FFCC00" }} />}
        </button>
      </div>

      {/* ── Hướng dẫn ── */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 pointer-events-none hidden md:block">
        <div className="px-5 py-2 rounded-full backdrop-blur-md border text-[11px] text-slate-400 flex items-center gap-3 shadow-lg whitespace-nowrap"
          style={{ background: "rgba(6,2,0,0.78)", borderColor: "rgba(218,37,29,0.3)" }}>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#DA251D" }} />
            Kéo để xoay
          </span>
          <span>•</span><span>Cuộn để zoom</span>
          <span>•</span><span>Nhấp đúp lên sàn để đi tới</span>
          <span>•</span><span>← → chuyển sinh viên</span>
          <span>•</span>
          <span className="font-medium" style={{ color: "#FFCC00" }}>Bấm khung ảnh xem chi tiết • Bấm cúp để ăn mừng 🎉</span>
        </div>
      </div>

      {notice && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-xl text-xs font-semibold shadow-lg"
          style={{ background: "rgba(218,37,29,0.92)", color: "#fff1b8" }}>
          {notice}
        </div>
      )}

      {filteredStudents.length === 0 && (
        <div className="absolute inset-x-0 top-1/3 z-10 text-center pointer-events-none">
          <p className="font-semibold" style={{ color: "#FFCC00" }}>Không tìm thấy sinh viên phù hợp trong sảnh</p>
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
          gl.toneMappingExposure = 1.1;
        }}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      >
        <color attach="background" args={["#04060d"]} />
        <ambientLight intensity={0.25} />
        {/* Ánh sáng bầu trời: đỏ ấm bên trên + xanh lạnh bên dưới (tông Đoàn) */}
        <hemisphereLight args={["#c0c8ff", "#2a0808", 0.45]} />
        {quality === "high" && <QualityGuard onTooSlow={handleTooSlow} />}
        <AdaptiveDpr pixelated />
        <WallWashLights radius={layout.radius} />

        <Suspense fallback={null}>
          {/* Môi trường phản chiếu (không tải HDRI mạng) */}
          <Environment resolution={256} frames={1} environmentIntensity={1.2}>
            {/* Ánh vàng từ trên */}
            <Lightformer form="ring" intensity={4.5} color="#ffe8a0" scale={8} position={[0, 12, 0]} rotation={[Math.PI / 2, 0, 0]} />
            {/* Ánh đỏ Đoàn từ trước */}
            <Lightformer form="rect" intensity={2.5} color="#ff6060" scale={[30, 2, 1]} position={[0, 5, -14]} />
            {/* Ánh xanh Đoàn từ sau */}
            <Lightformer form="rect" intensity={1.8} color="#4080ff" scale={[30, 2, 1]} position={[0, 5, 14]} rotation={[0, Math.PI, 0]} />
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
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-3 pointer-events-none"
          style={{ background: "rgba(4,2,0,0.95)" }}>
          {/* Spinner màu đỏ-vàng Đoàn */}
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 rounded-full border-2 border-red-900 border-t-red-500 animate-spin" />
            <div className="absolute inset-2 rounded-full border-2 border-yellow-900 border-t-yellow-400 animate-spin" style={{ animationDirection: "reverse", animationDuration: "0.7s" }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-yellow-400">
                <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
              </svg>
            </div>
          </div>
          <p className="text-sm font-black tracking-widest uppercase" style={{ color: "#FFCC00" }}>
            Đang chuẩn bị sảnh vinh danh…
          </p>
          <p className="text-xs" style={{ color: "#c0a0a0" }}>
            Đoàn TNCS Hồ Chí Minh — Hội Sinh viên HUTECH
          </p>
        </div>
      )}

      <Loader
        containerStyles={{ background: "rgba(4,2,0,0.97)" }}
        innerStyles={{ width: "240px", backgroundColor: "#1a0005" }}
        barStyles={{ backgroundColor: "#DA251D" }}
        dataStyles={{ color: "#FFCC00", fontSize: "12px", fontWeight: "bold" }}
        dataInterpolation={(p) => `Đang dựng sảnh vinh danh... ${p.toFixed(0)}%`}
      />

      {/* ── Dải trang trí đáy ── */}
      <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none h-1 bg-gradient-to-r from-transparent via-yellow-600 to-transparent opacity-50" />
    </div>
  );
}
