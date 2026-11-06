// Mã điểm danh xoay vòng: đổi mỗi 30 giây, tính bằng HMAC(seed bí mật của sự kiện, cửa sổ thời gian).
// Sinh viên chỉ dùng được mã đang hiển thị (chấp nhận thêm 1 cửa sổ trước đó để bù độ trễ khi quét).
// → Chụp mã gửi cho bạn vắng mặt sẽ hết hạn sau tối đa ~60 giây.
const crypto = require('crypto');
const { JWT_SECRET } = require('../middleware/auth');

const WINDOW_MS = 30 * 1000;
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // bỏ 0/O, 1/I dễ nhầm

function tokenFor(eventId, seed, windowIndex) {
  const h = crypto.createHmac('sha256', JWT_SECRET).update(`${eventId}:${seed}:${windowIndex}`).digest();
  let out = '';
  for (let i = 0; i < 6; i++) out += ALPHABET[h[i] % ALPHABET.length];
  return out;
}

function currentToken(eventId, seed, now = Date.now()) {
  const w = Math.floor(now / WINDOW_MS);
  return {
    code: tokenFor(eventId, seed, w),
    expires_in: Math.max(1, Math.ceil(((w + 1) * WINDOW_MS - now) / 1000)),
    window_seconds: WINDOW_MS / 1000,
  };
}

function verifyToken(eventId, seed, code, now = Date.now()) {
  if (!seed || !code) return false;
  const c = Buffer.from(String(code).trim().toUpperCase());
  const w = Math.floor(now / WINDOW_MS);
  return [w, w - 1].some((x) => {
    const t = Buffer.from(tokenFor(eventId, seed, x));
    return t.length === c.length && crypto.timingSafeEqual(t, c);
  });
}

module.exports = { currentToken, verifyToken, WINDOW_MS };
