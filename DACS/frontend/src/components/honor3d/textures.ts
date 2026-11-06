// Tạo texture bằng Canvas 2D ngay trên trình duyệt: không tải ảnh ngoài, hiển thị tiếng Việt chuẩn,
// không lỗi CORS và vẫn phản chiếu được trên sàn gương.
// Phong cách: Đoàn Thanh niên / Hội Sinh viên Việt Nam — đỏ #DA251D, vàng #FFCC00, xanh Đoàn #00539F
import * as THREE from "three";
import type { HonorStudentData } from "./HonorFrame3D";

export const FONT = `"Segoe UI", "Be Vietnam Pro", Roboto, "Helvetica Neue", Arial, sans-serif`;

// ── Hằng màu bộ nhận diện Đoàn – Hội ───────────────────────────────
export const DOAN_RED   = "#DA251D";   // đỏ cờ chính
export const DOAN_GOLD  = "#FFCC00";   // vàng ngôi sao
export const DOAN_BLUE  = "#00539F";   // xanh Đoàn
export const DOAN_DARK  = "#0a0d1f";   // nền tối xanh đêm

function makeCanvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

function toTexture(canvas: HTMLCanvasElement, repeat?: [number, number]) {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) {
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  t.needsUpdate = true;
  return t;
}

// Số ngẫu nhiên có hạt giống → hoa văn giống nhau mỗi lần tải
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function fitFont(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, start: number, weight = "700") {
  let size = start;
  do {
    ctx.font = `${weight} ${size}px ${FONT}`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 2;
  } while (size > 12);
  return size;
}

/** Gradient vàng đặc trưng (dùng cho chữ, viền kim loại) */
function goldGradient(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0,    "#7a5a16");
  g.addColorStop(0.25, "#e9c86a");
  g.addColorStop(0.5,  "#fff1b8");
  g.addColorStop(0.75, "#d4a73c");
  g.addColorStop(1,    "#7a5a16");
  return g;
}

/** Vẽ ngôi sao 5 cánh tại (cx, cy) bán kính outer r */
function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, fill: string | CanvasGradient) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? r : r * 0.42;
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(a) * radius;
    const y = cy + Math.sin(a) * radius;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

// ── Sàn đá cẩm thạch trắng + ron đỏ-vàng (sáng sủa, trang trọng) ──
export function createMarbleTexture() {
  const size = 1024;
  const c = makeCanvas(size, size);
  const ctx = c.getContext("2d")!;
  const rnd = seeded(7);

  const tiles = 2;
  const tile = size / tiles;
  for (let i = 0; i < tiles; i++) {
    for (let j = 0; j < tiles; j++) {
      const light = (i + j) % 2 === 0;
      ctx.fillStyle = light ? "#f5f1ea" : "#ece6d8";
      ctx.fillRect(i * tile, j * tile, tile, tile);
    }
  }
  // Vân đá trắng nhạt
  for (let k = 0; k < 60; k++) {
    ctx.strokeStyle = `rgba(180,170,150,${0.04 + rnd() * 0.1})`;
    ctx.lineWidth = 0.5 + rnd() * 1.8;
    ctx.beginPath();
    let x = rnd() * size, y = rnd() * size;
    ctx.moveTo(x, y);
    for (let s = 0; s < 6; s++) {
      const nx = x + (rnd() - 0.3) * 240;
      const ny = y + (rnd() - 0.5) * 240;
      ctx.quadraticCurveTo(x + (rnd() - 0.5) * 150, y + (rnd() - 0.5) * 150, nx, ny);
      x = nx; y = ny;
    }
    ctx.stroke();
  }
  // Ron đỏ-vàng (truyền thống Việt)
  ctx.strokeStyle = "rgba(218,37,29,0.5)";
  ctx.lineWidth = 2.5;
  for (let i = 0; i <= tiles; i++) {
    ctx.beginPath(); ctx.moveTo(i * tile, 0); ctx.lineTo(i * tile, size); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i * tile); ctx.lineTo(size, i * tile); ctx.stroke();
  }
  ctx.strokeStyle = "rgba(255,204,0,0.45)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= tiles; i++) {
    ctx.beginPath(); ctx.moveTo(i * tile + 3, 0); ctx.lineTo(i * tile + 3, size); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i * tile + 3); ctx.lineTo(size, i * tile + 3); ctx.stroke();
  }
  return toTexture(c, [8, 8]);
}

// ── Tường: xanh Đoàn sâu + hoa văn truyền thống + viền vàng-đỏ ────
export function createWallTexture() {
  const c = makeCanvas(512, 1024);
  const ctx = c.getContext("2d")!;
  // Nền xanh Đoàn gradient
  const g = ctx.createLinearGradient(0, 0, 0, 1024);
  g.addColorStop(0, "#002d6b");
  g.addColorStop(0.5, "#003f8a");
  g.addColorStop(1, "#001f4e");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 1024);

  // Hoa văn chìm (damask truyền thống: hình thoi + ellip)
  ctx.strokeStyle = "rgba(255,204,0,0.07)";
  ctx.lineWidth = 2;
  for (let y = 60; y < 1024; y += 130) {
    for (let x = 0; x <= 512; x += 110) {
      const ox = ((y / 130) % 2) * 55;
      ctx.beginPath();
      ctx.ellipse(x + ox, y, 28, 44, Math.PI / 4, 0, Math.PI * 2);
      ctx.stroke();
      // hình thoi nhỏ
      ctx.beginPath();
      ctx.moveTo(x + ox, y - 20); ctx.lineTo(x + ox + 12, y);
      ctx.lineTo(x + ox, y + 20); ctx.lineTo(x + ox - 12, y);
      ctx.closePath();
      ctx.stroke();
    }
  }
  // Viền vàng khung
  ctx.strokeStyle = "rgba(255,204,0,0.5)";
  ctx.lineWidth = 5;
  ctx.strokeRect(28, 28, 456, 968);
  // Viền đỏ bên trong
  ctx.strokeStyle = "rgba(218,37,29,0.3)";
  ctx.lineWidth = 2;
  ctx.strokeRect(36, 36, 440, 952);
  return toTexture(c, [24, 1]);
}

// ── Mái vòm: đỏ-xanh Đoàn, ngôi sao, lưới vàng ───────────────────
export function createDomeTexture() {
  const c = makeCanvas(1024, 512);
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0,   "#0a1540");
  g.addColorStop(0.7, "#0d1e5a");
  g.addColorStop(1,   "#1a0810");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1024, 512);

  // Sao li ti
  const rnd = seeded(5);
  for (let i = 0; i < 320; i++) {
    ctx.fillStyle = `rgba(255,240,200,${0.15 + rnd() * 0.55})`;
    ctx.fillRect(rnd() * 1024, rnd() * 512, 1.4, 1.4);
  }
  // Lưới vàng
  ctx.strokeStyle = "rgba(255,204,0,0.35)";
  ctx.lineWidth = 2.5;
  for (let x = 0; x <= 1024; x += 1024 / 24) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 512); ctx.stroke();
  }
  for (let y = 60; y < 512; y += 72) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1024, y); ctx.stroke();
  }
  // Dải đỏ nhẹ trên đỉnh vòm
  const rg = ctx.createLinearGradient(0, 0, 1024, 0);
  rg.addColorStop(0,    "rgba(218,37,29,0)");
  rg.addColorStop(0.25, "rgba(218,37,29,0.08)");
  rg.addColorStop(0.5,  "rgba(218,37,29,0.14)");
  rg.addColorStop(0.75, "rgba(218,37,29,0.08)");
  rg.addColorStop(1,    "rgba(218,37,29,0)");
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, 1024, 180);
  return toTexture(c);
}

// ── Dải chữ truyền thống chạy quanh tường ─────────────────────────
export function createBandTexture(text: string) {
  const c = makeCanvas(2048, 128);
  const ctx = c.getContext("2d")!;
  // Nền đỏ Đoàn
  const g = ctx.createLinearGradient(0, 0, 0, 128);
  g.addColorStop(0, "#8b0d0d");
  g.addColorStop(0.4, "#c41a1a");
  g.addColorStop(0.6, "#da251d");
  g.addColorStop(1, "#8b0d0d");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 2048, 128);
  // Viền vàng trên-dưới
  ctx.fillStyle = goldGradient(ctx, 0, 0, 0, 128);
  ctx.fillRect(0, 0, 2048, 10);
  ctx.fillRect(0, 118, 2048, 10);
  // Ngôi sao nhỏ trang trí
  for (let sx = 80; sx < 2048; sx += 400) {
    drawStar(ctx, sx, 64, 18, "rgba(255,204,0,0.5)");
  }
  // Chữ
  ctx.font = `800 60px ${FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = goldGradient(ctx, 0, 24, 0, 104);
  ctx.fillText(text, 1024, 68);
  return toTexture(c, [-5, 1]);
}

// ── Thảm đỏ Đoàn viền vàng (hoa văn ngôi sao) ─────────────────────
export function createCarpetTexture(length: number) {
  const c = makeCanvas(256, 1024);
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 256, 0);
  g.addColorStop(0, "#6b0808");
  g.addColorStop(0.5, "#da251d");
  g.addColorStop(1, "#6b0808");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 1024);
  // Viền vàng
  ctx.fillStyle = goldGradient(ctx, 0, 0, 0, 1024);
  ctx.fillRect(10, 0, 12, 1024);
  ctx.fillRect(234, 0, 12, 1024);
  // Ngôi sao + nhánh lúa
  for (let y = 50; y < 1024; y += 130) {
    drawStar(ctx, 128, y, 22, "rgba(255,204,0,0.28)");
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(128, y + 32);
      ctx.quadraticCurveTo(128 + side * 24, y + 50, 128 + side * 18, y + 72);
      ctx.strokeStyle = "rgba(255,204,0,0.22)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
  return toTexture(c, [1, Math.max(1, Math.round(length / 4))]);
}

// ── Nhãn chữ chung (bảng tiêu chí, biển cửa, ô trống...) ─────────
export function createLabelTexture(title: string, subtitle = "", accent = "#FFCC00", w = 512, h = 192) {
  const c = makeCanvas(w, h);
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "rgba(0,30,75,0.94)";
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, w - 12, h - 12);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = accent;
  fitFont(ctx, title, w - 48, Math.round(h * 0.32), "800");
  ctx.fillText(title, w / 2, subtitle ? h * 0.4 : h / 2);
  if (subtitle) {
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    fitFont(ctx, subtitle, w - 48, Math.round(h * 0.17), "500");
    ctx.fillText(subtitle, w / 2, h * 0.72);
  }
  return toTexture(c);
}

// ── Bảng tên dưới mỗi khung ảnh (nền đỏ-vàng Đoàn) ────────────────
export function createNameplateTexture(student: HonorStudentData) {
  const w = 640, h = 192;
  const c = makeCanvas(w, h);
  const ctx = c.getContext("2d")!;
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, "#6b0808");
  bg.addColorStop(0.5, "#9e1515");
  bg.addColorStop(1, "#6b0808");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "rgba(255,204,0,0.9)";
  ctx.lineWidth = 4;
  ctx.strokeRect(8, 8, w - 16, h - 16);
  ctx.strokeStyle = "rgba(255,204,0,0.3)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(14, 14, w - 28, h - 28);

  const sv = student.sinh_vien;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillStyle = goldGradient(ctx, 0, 20, 0, 80);
  fitFont(ctx, sv.ho_ten.toUpperCase(), w - 60, 44, "800");
  ctx.fillText(sv.ho_ten.toUpperCase(), w / 2, 54);

  const line2 = [sv.ma_sv && `MSSV: ${sv.ma_sv}`, sv.lop?.ma_lop].filter(Boolean).join("  •  ");
  ctx.fillStyle = "rgba(255,230,180,0.95)";
  fitFont(ctx, line2, w - 60, 24, "600");
  ctx.fillText(line2, w / 2, 100);

  const line3 = sv.khoa?.ten_khoa || "";
  ctx.fillStyle = "rgba(255,210,150,0.85)";
  fitFont(ctx, line3, w - 60, 20, "500");
  ctx.fillText(line3, w / 2, 134);

  if (student.so_lan_dat > 1) {
    ctx.fillStyle = DOAN_GOLD;
    ctx.font = `800 18px ${FONT}`;
    ctx.fillText(`★ ${student.so_lan_dat} LẦN ĐẠT DANH HIỆU ★`, w / 2, 166);
  }
  return toTexture(c);
}

// ── Chân dung: vẽ chữ cái đầu ngay, thay bằng ảnh thật khi tải xong
export function createPortraitTexture(student: HonorStudentData) {
  const w = 320, h = 400;
  const c = makeCanvas(w, h);
  const ctx = c.getContext("2d")!;
  const name = student.sinh_vien.ho_ten || "SV";

  // Nền xanh Đoàn
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0,   "#001f4e");
  g.addColorStop(0.5, "#003f8a");
  g.addColorStop(1,   "#002d6b");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // Viền vàng + đỏ tròn
  ctx.strokeStyle = "rgba(255,204,0,0.75)";
  ctx.lineWidth = 6;
  ctx.beginPath(); ctx.arc(w / 2, h * 0.42, 100, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = "rgba(218,37,29,0.5)";
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(w / 2, h * 0.42, 110, 0, Math.PI * 2); ctx.stroke();

  // Chữ cái đầu
  const initials = name.trim().split(/\s+/).map((s) => s[0]).slice(-2).join("").toUpperCase();
  ctx.fillStyle = "#fff";
  ctx.font = `800 92px ${FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(initials, w / 2, h * 0.42);

  // Nhãn SV5T
  ctx.fillStyle = DOAN_GOLD;
  ctx.font = `800 20px ${FONT}`;
  ctx.fillText("SINH VIÊN 5 TỐT", w / 2, h * 0.84);
  drawStar(ctx, w / 2 - 95, h * 0.84, 10, DOAN_GOLD);
  drawStar(ctx, w / 2 + 95, h * 0.84, 10, DOAN_GOLD);

  const texture = toTexture(c);
  let cancelled = false;
  const url = student.sinh_vien.avatar_url;
  if (url && /^https?:\/\//.test(url)) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (cancelled) return;
      const scale = Math.max(w / img.width, h / img.height);
      const dw = img.width * scale, dh = img.height * scale;
      ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
      // Vignette
      const v = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.72);
      v.addColorStop(0, "rgba(0,0,0,0)");
      v.addColorStop(1, "rgba(0,0,0,0.42)");
      ctx.fillStyle = v;
      ctx.fillRect(0, 0, w, h);
      // Dải nhãn SV5T dưới ảnh
      const lbg = ctx.createLinearGradient(0, h * 0.78, 0, h);
      lbg.addColorStop(0, "rgba(218,37,29,0)");
      lbg.addColorStop(0.4, "rgba(218,37,29,0.72)");
      lbg.addColorStop(1, "rgba(130,10,10,0.9)");
      ctx.fillStyle = lbg;
      ctx.fillRect(0, h * 0.78, w, h * 0.22);
      ctx.fillStyle = DOAN_GOLD;
      ctx.font = `800 18px ${FONT}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("SINH VIÊN 5 TỐT", w / 2, h * 0.92);
      texture.needsUpdate = true;
    };
    img.onerror = () => { /* giữ ảnh chữ cái đầu */ };
    img.src = url;
  }
  return { texture, dispose: () => { cancelled = true; texture.dispose(); } };
}

// ── Cờ Tổ quốc Việt Nam (Đỏ sao vàng) ─────────────────────────────
export function createVietnamFlagTexture() {
  const w = 600, h = 400;
  const c = makeCanvas(w, h);
  const ctx = c.getContext("2d")!;
  // Nền đỏ cờ
  ctx.fillStyle = DOAN_RED;
  ctx.fillRect(0, 0, w, h);
  // Ngôi sao vàng 5 cánh ở tâm
  drawStar(ctx, w / 2, h / 2, h * 0.32, DOAN_GOLD);
  return toTexture(c);
}

// ── Cờ Đoàn Thanh niên Cộng sản Hồ Chí Minh ────────────────────────
export function createDoanFlagTexture() {
  const w = 600, h = 400;
  const c = makeCanvas(w, h);
  const ctx = c.getContext("2d")!;
  // Nền đỏ
  ctx.fillStyle = DOAN_RED;
  ctx.fillRect(0, 0, w, h);

  // Huy hiệu Đoàn ở trung tâm
  const cx = w / 2, cy = h / 2, r = 110;
  // Vòng tròn đỏ viền vàng
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = DOAN_GOLD;
  ctx.stroke();

  // Vòng ngoài màu đỏ viền chữ
  ctx.beginPath();
  ctx.arc(cx, cy, r - 6, 0, Math.PI * 2);
  ctx.fillStyle = "#DA251D";
  ctx.fill();

  // Lõi trong màu xanh lá / đỏ
  ctx.beginPath();
  ctx.arc(cx, cy, r - 30, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  // Cánh tay cầm cờ tượng trưng
  // Vẽ lá cờ nhỏ bên trong
  ctx.fillStyle = "#DA251D";
  ctx.fillRect(cx - 35, cy - 50, 70, 45);
  drawStar(ctx, cx, cy - 28, 14, DOAN_GOLD);

  // Cán cờ
  ctx.strokeStyle = "#8b5a00";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx - 35, cy - 55);
  ctx.lineTo(cx - 35, cy + 35);
  ctx.stroke();

  // Cánh tay khỏe khoắn nắm cán cờ
  ctx.fillStyle = "#f59e0b";
  ctx.beginPath();
  ctx.ellipse(cx - 20, cy + 20, 22, 12, -Math.PI / 6, 0, Math.PI * 2);
  ctx.fill();

  // Chữ chạy cong hoặc thẳng "THANH NIÊN VIỆT NAM"
  ctx.fillStyle = "#ffffff";
  ctx.font = `800 12px ${FONT}`;
  ctx.textAlign = "center";
  ctx.fillText("ĐOÀN TNCS HỒ CHÍ MINH", cx, cy + r - 12);

  return toTexture(c);
}

// ── Cờ Hội Sinh viên Việt Nam ─────────────────────────────────────
export function createHoiSVFlagTexture() {
  const w = 600, h = 400;
  const c = makeCanvas(w, h);
  const ctx = c.getContext("2d")!;
  // Nền xanh da trời đặc trưng Hội Sinh viên
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, "#0072ce");
  g.addColorStop(1, "#00539F");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2, cy = h / 2, r = 110;
  // Vòng tròn trắng viền xanh
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = DOAN_GOLD;
  ctx.stroke();

  // Biểu tượng chim bồ câu trắng và ngọn đuốc / ngôi sao xanh
  ctx.beginPath();
  ctx.arc(cx, cy, r - 10, 0, Math.PI * 2);
  ctx.fillStyle = "#00539F";
  ctx.fill();

  // Ngôi sao vàng & cánh chim biểu trưng
  drawStar(ctx, cx, cy - 35, 20, DOAN_GOLD);

  // Cánh chim bồ câu trắng
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(cx - 50, cy + 15);
  ctx.quadraticCurveTo(cx, cy - 20, cx + 50, cy + 15);
  ctx.quadraticCurveTo(cx + 25, cy + 35, cx, cy + 15);
  ctx.quadraticCurveTo(cx - 25, cy + 35, cx - 50, cy + 15);
  ctx.fill();

  // Ngọn đuốc / ngọn lửa sinh viên
  ctx.fillStyle = "#f59e0b";
  ctx.beginPath();
  ctx.moveTo(cx, cy + 5);
  ctx.quadraticCurveTo(cx + 12, cy - 15, cx, cy - 25);
  ctx.quadraticCurveTo(cx - 12, cy - 15, cx, cy + 5);
  ctx.fill();

  // Chữ viền
  ctx.fillStyle = "#ffffff";
  ctx.font = `800 12px ${FONT}`;
  ctx.textAlign = "center";
  ctx.fillText("HỘI SINH VIÊN VIỆT NAM", cx, cy + r - 20);

  return toTexture(c);
}

// ── Bảng biểu ngữ khẩu hiệu Đoàn - Hội (Pano lụa viền đồng) ────────
export function createSloganBannerTexture(title: string, subtitle: string) {
  const w = 1024, h = 256;
  const c = makeCanvas(w, h);
  const ctx = c.getContext("2d")!;
  // Nền đỏ thắm gấm nhung
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#730c0c");
  g.addColorStop(0.5, "#a81616");
  g.addColorStop(1, "#660808");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // Viền vàng kép hoa văn góc
  ctx.strokeStyle = DOAN_GOLD;
  ctx.lineWidth = 6;
  ctx.strokeRect(12, 12, w - 24, h - 24);
  ctx.lineWidth = 2;
  ctx.strokeRect(20, 20, w - 40, h - 40);

  // 2 ngôi sao trang trí 2 đầu
  drawStar(ctx, 60, h / 2, 24, DOAN_GOLD);
  drawStar(ctx, w - 60, h / 2, 24, DOAN_GOLD);

  // Dòng chữ chính mạ vàng
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = goldGradient(ctx, 0, 30, 0, 130);
  fitFont(ctx, title, w - 180, 56, "900");
  ctx.fillText(title, w / 2, h * 0.42);

  // Dòng chữ phụ
  if (subtitle) {
    ctx.fillStyle = "#ffeaa7";
    fitFont(ctx, subtitle, w - 180, 26, "700");
    ctx.fillText(subtitle, w / 2, h * 0.74);
  }

  return toTexture(c);
}
