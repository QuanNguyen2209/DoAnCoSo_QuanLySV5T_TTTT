// Giới hạn số lần gọi API theo khoá (IP / email / user) — chống dò mật khẩu, spam OTP, dò mã điểm danh.
// Lưu trong bộ nhớ: đủ cho 1 server; nếu chạy nhiều instance nên chuyển sang Redis.
function rateLimit({ windowMs, max, keyFn, message }) {
  const hits = new Map(); // key -> { count, resetAt }

  // Dọn khoá hết hạn định kỳ để không rò rỉ bộ nhớ
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
  }, Math.min(windowMs, 60 * 1000));
  timer.unref();

  return (req, res, next) => {
    const key = keyFn(req);
    const now = Date.now();
    let entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }
    entry.count += 1;
    if (entry.count > max) {
      const retry = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retry));
      return res.status(429).json({
        success: false,
        error: message || `Bạn thao tác quá nhiều lần. Vui lòng thử lại sau ${Math.ceil(retry / 60)} phút.`,
      });
    }
    next();
  };
}

const ip = (req) => req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
const email = (req) => String(req.body?.email || '').trim().toLowerCase();

module.exports = {
  rateLimit,
  // 10 lần đăng nhập / 15 phút cho mỗi cặp IP + email
  loginLimiter: rateLimit({
    windowMs: 15 * 60 * 1000, max: 10, keyFn: (r) => `login:${ip(r)}:${email(r)}`,
    message: 'Đăng nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút.',
  }),
  // 100 tài khoản / giờ / IP (cả lớp có thể đăng ký chung 1 mạng wifi trường)
  registerLimiter: rateLimit({ windowMs: 60 * 60 * 1000, max: 100, keyFn: (r) => `register:${ip(r)}` }),
  // OTP: 5 lần gửi / giờ cho mỗi IP + email
  otpLimiter: rateLimit({ windowMs: 60 * 60 * 1000, max: 5, keyFn: (r) => `otp:${ip(r)}:${email(r)}` }),
  // Đặt lại mật khẩu: 15 lần / 15 phút cho mỗi IP + email
  resetLimiter: rateLimit({ windowMs: 15 * 60 * 1000, max: 15, keyFn: (r) => `reset:${ip(r)}:${email(r)}` }),
  // Điểm danh: 10 lần nhập mã / 10 phút / sinh viên (mã 6 ký tự → chống dò)
  checkInLimiter: rateLimit({
    windowMs: 10 * 60 * 1000, max: 10, keyFn: (r) => `checkin:${r.user?.id}`,
    message: 'Bạn đã nhập sai mã quá nhiều lần. Vui lòng thử lại sau 10 phút.',
  }),
  // Đổi mật khẩu: 10 lần / 15 phút / user
  changePasswordLimiter: rateLimit({ windowMs: 15 * 60 * 1000, max: 10, keyFn: (r) => `chpw:${r.user?.id}` }),
};
