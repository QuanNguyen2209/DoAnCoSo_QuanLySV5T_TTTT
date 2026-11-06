// Tính bố cục sảnh tròn: vị trí khung ảnh trên tường (1–2 tầng), cột, góc máy quay cho từng sinh viên.
// Quy ước: lối vào ở hướng +Z (góc 0), phía cuối sảnh là góc π. Vật thể mặc định nhìn theo +Z.

export type Vec3 = [number, number, number];

export const HALL = {
  minRadius: 12,
  wallHeight: 7.2,
  tierY: [1.95, 4.65],       // tâm khung ảnh tầng 1, tầng 2
  entranceHalfAngle: Math.PI / 7, // chừa khoảng trống cho cửa chính
  slotArc: 2.5,              // độ dài cung mỗi ô khung (m)
  cameraDistance: 3.3,       // khoảng cách máy quay đứng trước khung khi xem
};

export const HOME_CAMERA: Vec3 = [0, 3.2, 0]; // sẽ đặt z theo bán kính
export const HOME_TARGET: Vec3 = [0, 1.7, 0];

export interface FrameSlot {
  index: number;   // thứ tự trong danh sách sinh viên (-1 = ô trống)
  tier: number;
  angle: number;
  pos: Vec3;
  rotY: number;
  cameraPos: Vec3;
  lookAt: Vec3;
}

export interface HallLayout {
  radius: number;
  perTier: number;
  slots: FrameSlot[];       // ô có sinh viên
  emptySlots: FrameSlot[];  // ô trống tầng 1 (trang trí "gương mặt tiếp theo")
  columnAngles: number[];
  homeCamera: Vec3;
}

function makeSlot(index: number, tier: number, angle: number, radius: number): FrameSlot {
  const r = radius - 0.14;
  const y = HALL.tierY[tier];
  const pos: Vec3 = [Math.sin(angle) * r, y, Math.cos(angle) * r];
  const camR = r - HALL.cameraDistance - tier * 0.8;
  const camY = tier === 0 ? y - 0.05 : 3.3;
  return {
    index,
    tier,
    angle,
    pos,
    rotY: angle + Math.PI, // quay mặt vào tâm sảnh
    cameraPos: [Math.sin(angle) * camR, camY, Math.cos(angle) * camR],
    lookAt: pos,
  };
}

export function computeHallLayout(count: number): HallLayout {
  const usable = Math.PI * 2 - HALL.entranceHalfAngle * 2;

  // Bán kính tối thiểu 12m; nới rộng nếu 2 tầng vẫn không đủ chỗ
  let radius = HALL.minRadius;
  const capacityAt = (r: number) => Math.max(1, Math.floor((usable * r) / HALL.slotArc));
  while (capacityAt(radius) * 2 < count) radius += 1;
  const perTier = capacityAt(radius);
  const step = usable / perTier;

  // Các ô xếp từ giữa phía cuối sảnh (đối diện cửa) lan ra 2 bên
  const slotAngles = Array.from({ length: perTier }, (_, i) => HALL.entranceHalfAngle + step * (i + 0.5));
  const order = [...slotAngles].sort((a, b) => Math.abs(a - Math.PI) - Math.abs(b - Math.PI));

  const slots: FrameSlot[] = [];
  for (let i = 0; i < count; i++) {
    const tier = i < perTier ? 0 : 1;
    const angle = order[tier === 0 ? i : i - perTier];
    slots.push(makeSlot(i, tier, angle, radius));
  }

  const used = new Set(slots.filter((s) => s.tier === 0).map((s) => s.angle));
  const emptySlots = order
    .filter((a) => !used.has(a))
    .slice(0, 40)
    .map((a) => makeSlot(-1, 0, a, radius));

  const columnAngles = Array.from({ length: perTier + 1 }, (_, k) => HALL.entranceHalfAngle + step * k);

  return {
    radius,
    perTier,
    slots,
    emptySlots,
    columnAngles,
    homeCamera: [0, HOME_CAMERA[1], radius - 2.2],
  };
}
