// Tạo texture bằng Canvas 2D ngay trên trình duyệt: không tải ảnh ngoài, hiển thị tiếng Việt chuẩn,
// không lỗi CORS và vẫn phản chiếu được trên sàn gương.
import * as THREE from "three";
import type { HonorStudentData } from "./HonorFrame3D";

export const FONT = `"Segoe UI", "Be Vietnam Pro", Roboto, "Helvetica Neue", Arial, sans-serif`;

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

function goldGradient(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, "#7a5a16");
  g.addColorStop(0.25, "#e9c86a");
  g.addColorStop(0.5, "#fff1b8");
  g.addColorStop(0.75, "#d4a73c");
  g.addColorStop(1, "#7a5a16");
  return g;
}

// ── Sàn đá cẩm thạch đen vân trắng + ron vàng ────────────────────
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
      ctx.fillStyle = light ? "#1b1d26" : "#0c0d13";
      ctx.fillRect(i * tile, j * tile, tile, tile);
    }
  }
  // Vân đá
  for (let k = 0; k < 70; k++) {
    ctx.strokeStyle = `rgba(230,230,240,${0.03 + rnd() * 0.09})`;
    ctx.lineWidth = 0.6 + rnd() * 2.2;
    ctx.beginPath();
    let x = rnd() * size;
    let y = rnd() * size;
    ctx.moveTo(x, y);
    for (let s = 0; s < 6; s++) {
      const nx = x + (rnd() - 0.3) * 260;
      const ny = y + (rnd() - 0.5) * 260;
      ctx.quadraticCurveTo(x + (rnd() - 0.5) * 160, y + (rnd() - 0.5) * 160, nx, ny);
      x = nx;
      y = ny;
    }
    ctx.stroke();
  }
  // Ron vàng giữa các viên đá
  ctx.strokeStyle = "rgba(212,167,60,0.55)";
  ctx.lineWidth = 3;
  for (let i = 0; i <= tiles; i++) {
    ctx.beginPath(); ctx.moveTo(i * tile, 0); ctx.lineTo(i * tile, size); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i * tile); ctx.lineTo(size, i * tile); ctx.stroke();
  }
  return toTexture(c, [7, 7]);
}

// ── Tường: tấm ốp xanh than có khung chỉ vàng mờ ─────────────────
export function createWallTexture() {
  const c = makeCanvas(512, 1024);
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, 1024);
  g.addColorStop(0, "#0d1330");
  g.addColorStop(1, "#18204a");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 1024);
  // hoa văn chìm (damask đơn giản)
  ctx.strokeStyle = "rgba(255,255,255,0.035)";
  ctx.lineWidth = 2;
  for (let y = 40; y < 1024; y += 120) {
    for (let x = 0; x <= 512; x += 128) {
      ctx.beginPath();
      ctx.ellipse(x + ((y / 120) % 2) * 64, y, 34, 52, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.strokeStyle = "rgba(212,167,60,0.28)";
  ctx.lineWidth = 4;
  ctx.strokeRect(36, 36, 440, 952);
  return toTexture(c, [24, 1]);
}

// ── Mái vòm: ô kẻ vàng + sao li ti ───────────────────────────────
export function createDomeTexture() {
  const c = makeCanvas(1024, 512);
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, "#1a2150");
  g.addColorStop(1, "#070a1c");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1024, 512);
  const rnd = seeded(3);
  for (let i = 0; i < 260; i++) {
    ctx.fillStyle = `rgba(255,240,200,${0.2 + rnd() * 0.6})`;
    ctx.fillRect(rnd() * 1024, rnd() * 512, 1.6, 1.6);
  }
  ctx.strokeStyle = "rgba(233,200,106,0.45)";
  ctx.lineWidth = 3;
  for (let x = 0; x <= 1024; x += 1024 / 24) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 512); ctx.stroke();
  }
  for (let y = 64; y < 512; y += 80) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1024, y); ctx.stroke();
  }
  return toTexture(c);
}

// ── Dải chữ chạy quanh tường ─────────────────────────────────────
export function createBandTexture(text: string) {
  const c = makeCanvas(2048, 128);
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#0a0f26";
  ctx.fillRect(0, 0, 2048, 128);
  ctx.fillStyle = goldGradient(ctx, 0, 0, 0, 128);
  ctx.fillRect(0, 0, 2048, 8);
  ctx.fillRect(0, 120, 2048, 8);
  ctx.font = `800 64px ${FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = goldGradient(ctx, 0, 24, 0, 104);
  ctx.fillText(text, 1024, 68);
  return toTexture(c, [-5, 1]); // lặp lại & lật ngang (nhìn từ phía trong hình trụ)
}

// ── Thảm đỏ viền vàng ────────────────────────────────────────────
export function createCarpetTexture(length: number) {
  const c = makeCanvas(256, 1024);
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 256, 0);
  g.addColorStop(0, "#5c0a12");
  g.addColorStop(0.5, "#9b1424");
  g.addColorStop(1, "#5c0a12");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 1024);
  ctx.fillStyle = goldGradient(ctx, 0, 0, 0, 1024);
  ctx.fillRect(14, 0, 10, 1024);
  ctx.fillRect(232, 0, 10, 1024);
  ctx.fillStyle = "rgba(233,200,106,0.35)";
  for (let y = 40; y < 1024; y += 160) {
    ctx.beginPath();
    ctx.moveTo(128, y); ctx.lineTo(160, y + 40); ctx.lineTo(128, y + 80); ctx.lineTo(96, y + 40);
    ctx.closePath();
    ctx.fill();
  }
  return toTexture(c, [1, Math.max(1, Math.round(length / 4))]);
}

// ── Nhãn chữ chung (bảng tiêu chí, biển cửa, ô trống...) ─────────
export function createLabelTexture(title: string, subtitle = "", accent = "#e9c86a", w = 512, h = 192) {
  const c = makeCanvas(w, h);
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "rgba(8,11,30,0.92)";
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
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    fitFont(ctx, subtitle, w - 48, Math.round(h * 0.17), "500");
    ctx.fillText(subtitle, w / 2, h * 0.72);
  }
  return toTexture(c);
}

// ── Bảng tên đồng dưới mỗi khung ảnh ─────────────────────────────
export function createNameplateTexture(student: HonorStudentData) {
  const w = 640, h = 192;
  const c = makeCanvas(w, h);
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = goldGradient(ctx, 0, 0, w, h);
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "rgba(60,40,5,0.85)";
  ctx.lineWidth = 4;
  ctx.strokeRect(10, 10, w - 20, h - 20);

  const sv = student.sinh_vien;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#2a1a02";
  fitFont(ctx, sv.ho_ten.toUpperCase(), w - 60, 46, "800");
  ctx.fillText(sv.ho_ten.toUpperCase(), w / 2, 58);

  const line2 = [sv.ma_sv && `MSSV ${sv.ma_sv}`, sv.lop?.ma_lop].filter(Boolean).join("  •  ");
  ctx.fillStyle = "#3d2a07";
  fitFont(ctx, line2, w - 60, 26, "600");
  ctx.fillText(line2, w / 2, 104);

  const line3 = sv.khoa?.ten_khoa || "";
  fitFont(ctx, line3, w - 60, 22, "500");
  ctx.fillText(line3, w / 2, 138);

  if (student.so_lan_dat > 1) {
    ctx.fillStyle = "#7f1d1d";
    ctx.font = `800 20px ${FONT}`;
    ctx.fillText(`★ ${student.so_lan_dat} LẦN ĐẠT DANH HIỆU ★`, w / 2, 168);
  }
  return toTexture(c);
}

// ── Chân dung: vẽ chữ cái đầu ngay, thay bằng ảnh thật khi tải xong ─
export function createPortraitTexture(student: HonorStudentData) {
  const w = 320, h = 400;
  const c = makeCanvas(w, h);
  const ctx = c.getContext("2d")!;
  const name = student.sinh_vien.ho_ten || "SV";

  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, "#1e1b4b");
  g.addColorStop(0.55, "#312e81");
  g.addColorStop(1, "#4338ca");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "rgba(233,200,106,0.55)";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(w / 2, h * 0.42, 100, 0, Math.PI * 2);
  ctx.stroke();
  const initials = name.trim().split(/\s+/).map((s) => s[0]).slice(-2).join("").toUpperCase();
  ctx.fillStyle = "#fff";
  ctx.font = `800 96px ${FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(initials, w / 2, h * 0.42);
  ctx.fillStyle = "#e9c86a";
  ctx.font = `800 22px ${FONT}`;
  ctx.fillText("SINH VIÊN 5 TỐT", w / 2, h * 0.86);

  const texture = toTexture(c);

  let cancelled = false;
  const url = student.sinh_vien.avatar_url;
  if (url && /^https?:\/\//.test(url)) {
    const img = new Image();
    img.crossOrigin = "anonymous"; // Supabase Storage public cho phép CORS
    img.onload = () => {
      if (cancelled) return;
      // Cắt ảnh kiểu "cover" cho vừa khung dọc
      const scale = Math.max(w / img.width, h / img.height);
      const dw = img.width * scale, dh = img.height * scale;
      ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
      const v = ctx.createRadialGradient(w / 2, h / 2, h * 0.35, w / 2, h / 2, h * 0.7);
      v.addColorStop(0, "rgba(0,0,0,0)");
      v.addColorStop(1, "rgba(0,0,0,0.35)");
      ctx.fillStyle = v;
      ctx.fillRect(0, 0, w, h);
      texture.needsUpdate = true;
    };
    img.onerror = () => { /* giữ ảnh chữ cái đầu */ };
    img.src = url;
  }

  return { texture, dispose: () => { cancelled = true; texture.dispose(); } };
}
