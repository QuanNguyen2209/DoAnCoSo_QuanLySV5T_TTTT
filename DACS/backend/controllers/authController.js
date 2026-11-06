const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/db');
const { JWT_SECRET, invalidateUserCache } = require('../middleware/auth');
const { sendMail } = require('../services/mailService');
const { handleError, escapeHtml, escapeLike, requireId } = require('../utils/http');

const TOKEN_EXPIRY = '7d';         // Token hết hạn sau 7 ngày
const BCRYPT_COST = 10;            // bcrypt cost (10 là mức khuyến nghị tối thiểu)
const OTP_TTL_MS = 15 * 60 * 1000; // OTP hết hạn sau 15 phút
const OTP_RESEND_MS = 60 * 1000;   // Chờ 60s mới được gửi lại OTP
const OTP_MAX_ATTEMPTS = 5;        // Nhập sai 5 lần → huỷ OTP
const VALID_ROLES = ['sinh_vien', 'lop_truong', 'can_bo', 'admin'];
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', BCRYPT_COST);

// Bộ nhớ tạm chống spam/brute-force OTP (theo email)
const otpGuard = new Map(); // email -> { lastSent, attempts }

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, ho_ten: user.ho_ten },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY, algorithm: 'HS256' }
  );
}

// Tìm user theo email không phân biệt hoa/thường (dữ liệu cũ có thể lưu chữ hoa)
async function findUserByEmail(email, columns) {
  const { data, error } = await supabase
    .from('users')
    .select(columns)
    .ilike('email', escapeLike(email))
    .limit(1);
  if (error) throw error;
  return data && data[0] ? data[0] : null;
}

function safeEqual(a, b) {
  const bufA = Buffer.from(String(a ?? ''));
  const bufB = Buffer.from(String(b ?? ''));
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

// POST /api/auth/register — Đăng ký tài khoản mới (mặc định role = sinh_vien)
exports.register = async (req, res) => {
  try {
    const ho_ten = String(req.body.ho_ten || '').trim();
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');
    const ma_sv = req.body.ma_sv ? String(req.body.ma_sv).trim() : null;

    if (!ho_ten || !email || !password) {
      return res.status(400).json({ success: false, error: 'Vui lòng điền đầy đủ thông tin' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, error: 'Email không hợp lệ' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }

    // Kiểm tra trùng email và mã SV song song
    const [existingEmail, existingMaSv] = await Promise.all([
      findUserByEmail(email, 'id'),
      ma_sv
        ? supabase.from('users').select('id').eq('ma_sv', ma_sv).maybeSingle().then((r) => r.data)
        : Promise.resolve(null),
    ]);
    if (existingEmail) {
      return res.status(409).json({ success: false, error: 'Email này đã được đăng ký' });
    }
    if (existingMaSv) {
      return res.status(409).json({ success: false, error: 'Mã sinh viên này đã được đăng ký' });
    }

    const password_hash = await bcrypt.hash(password, BCRYPT_COST);

    const { data, error } = await supabase
      .from('users')
      .insert([{ ho_ten, email, password_hash, ma_sv, role: 'sinh_vien' }])
      .select('id, ho_ten, email, ma_sv, role')
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ success: false, error: 'Email hoặc mã sinh viên đã được đăng ký' });
      }
      throw error;
    }

    res.status(201).json({ success: true, message: 'Đăng ký thành công! Vui lòng đăng nhập.', data });
  } catch (err) {
    handleError(res, err, 'register');
  }
};

// POST /api/auth/login — Đăng nhập
exports.login = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Vui lòng nhập email và mật khẩu' });
    }

    const user = await findUserByEmail(email, 'id, ho_ten, email, ma_sv, role, password_hash, avatar_url, is_active');

    // Luôn chạy bcrypt.compare (kể cả khi không có user) để thời gian phản hồi đồng đều
    const hash = user?.password_hash || DUMMY_HASH;
    const isMatch = await bcrypt.compare(password, hash);

    if (!user || !isMatch) {
      return res.status(401).json({ success: false, error: 'Email hoặc mật khẩu không đúng' });
    }
    if (user.is_active === false) {
      return res.status(403).json({ success: false, error: 'Tài khoản đã bị vô hiệu hoá' });
    }

    const token = generateToken(user);
    const { password_hash, is_active, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'Đăng nhập thành công!',
      data: { user: userWithoutPassword, token },
    });
  } catch (err) {
    handleError(res, err, 'login');
  }
};

// GET /api/auth/me — Lấy thông tin user hiện tại (cần token)
exports.me = async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, ho_ten, email, ma_sv, role, avatar_url')
      .eq('id', req.user.id)
      .maybeSingle();

    if (error) throw error;
    if (!user) return res.status(404).json({ success: false, error: 'Không tìm thấy người dùng' });

    res.json({ success: true, data: user });
  } catch (err) {
    handleError(res, err, 'me');
  }
};

// POST /api/auth/forgot-password — Gửi mã OTP đặt lại mật khẩu
exports.forgotPassword = async (req, res) => {
  const genericMsg = 'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được mã xác nhận.';
  try {
    const email = normalizeEmail(req.body.email);
    if (!email) {
      return res.status(400).json({ success: false, error: 'Vui lòng nhập email' });
    }

    // Chống spam gửi mail liên tục
    const guard = otpGuard.get(email);
    if (guard && Date.now() - guard.lastSent < OTP_RESEND_MS) {
      const wait = Math.ceil((OTP_RESEND_MS - (Date.now() - guard.lastSent)) / 1000);
      return res.status(429).json({ success: false, error: `Vui lòng đợi ${wait} giây trước khi yêu cầu mã mới.` });
    }

    const user = await findUserByEmail(email, 'id, email, ho_ten');
    if (!user) {
      return res.json({ success: true, message: genericMsg }); // Không lộ email có tồn tại hay không
    }

    // OTP 6 số bằng bộ sinh số ngẫu nhiên an toàn (thay cho Math.random)
    const otp = crypto.randomInt(100000, 1000000).toString();
    const expires = new Date(Date.now() + OTP_TTL_MS).toISOString();

    const { error: updateErr } = await supabase
      .from('users')
      .update({ reset_otp: otp, reset_otp_expires: expires })
      .eq('id', user.id);
    if (updateErr) throw updateErr;

    otpGuard.set(email, { lastSent: Date.now(), attempts: 0 });

    await sendMail({
      to: user.email,
      subject: '[Hệ thống SV5T] Mã xác thực lấy lại mật khẩu',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #4f46e5;">Yêu cầu lấy lại mật khẩu</h2>
          <p>Chào bạn <strong>${escapeHtml(user.ho_ten)}</strong>,</p>
          <p>Bạn (hoặc ai đó) vừa yêu cầu đặt lại mật khẩu cho tài khoản ứng dụng Quản lý Sinh viên 5 Tốt / Tập thể Tiên tiến.</p>
          <p>Dưới đây là mã xác thực (OTP) của bạn. Mã này có hiệu lực trong vòng <strong>15 phút</strong>:</p>
          <div style="background-color: #f8fafc; border: 2px dashed #4f46e5; text-align: center; padding: 15px; margin: 15px 0; border-radius: 4px; font-size: 24px; font-weight: bold; letter-spacing: 5px;">
            ${otp}
          </div>
          <p>Vui lòng nhập mã này trên trang web để đổi mật khẩu.</p>
          <p style="color: #ef4444;">Nếu bạn không yêu cầu đổi mật khẩu, vui lòng bỏ qua email này. Tuyệt đối không cung cấp mã OTP cho người khác.</p>
          <br/>
          <p style="font-size: 12px; color: #64748b;">Đây là email tự động, vui lòng không phản hồi.</p>
        </div>
      `,
    });

    res.json({ success: true, message: genericMsg });
  } catch (err) {
    console.error('Lỗi forgotPassword:', err);
    const msg = err.code === 'MAIL_NOT_CONFIGURED'
      ? 'Máy chủ chưa cấu hình email gửi OTP. Vui lòng liên hệ quản trị viên.'
      : 'Lỗi máy chủ khi gửi mã xác thực.';
    res.status(500).json({ success: false, error: msg });
  }
};

// POST /api/auth/reset-password — Đổi mật khẩu với mã OTP
exports.resetPassword = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const otp = String(req.body.otp || '').trim();
    const newPassword = String(req.body.newPassword || '');

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, error: 'Vui lòng cung cấp đủ thông tin.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'Mật khẩu phải có ít nhất 6 ký tự.' });
    }

    const user = await findUserByEmail(email, 'id, reset_otp, reset_otp_expires');
    if (!user || !user.reset_otp) {
      return res.status(400).json({ success: false, error: 'Mã xác thực không đúng hoặc đã hết hạn.' });
    }

    if (new Date(user.reset_otp_expires) < new Date()) {
      return res.status(400).json({ success: false, error: 'Mã xác thực đã hết hạn.' });
    }

    if (!safeEqual(user.reset_otp, otp)) {
      // Giới hạn số lần nhập sai để chống dò OTP
      const guard = otpGuard.get(email) || { lastSent: 0, attempts: 0 };
      guard.attempts += 1;
      otpGuard.set(email, guard);
      if (guard.attempts >= OTP_MAX_ATTEMPTS) {
        await supabase.from('users').update({ reset_otp: null, reset_otp_expires: null }).eq('id', user.id);
        otpGuard.delete(email);
        return res.status(400).json({ success: false, error: 'Nhập sai quá nhiều lần. Vui lòng yêu cầu mã mới.' });
      }
      return res.status(400).json({
        success: false,
        error: `Mã xác thực không đúng. Còn ${OTP_MAX_ATTEMPTS - guard.attempts} lần thử.`,
      });
    }

    const password_hash = await bcrypt.hash(newPassword, BCRYPT_COST);

    const { error: updateErr } = await supabase
      .from('users')
      .update({ password_hash, reset_otp: null, reset_otp_expires: null })
      .eq('id', user.id);
    if (updateErr) throw updateErr;

    otpGuard.delete(email);
    res.json({ success: true, message: 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập.' });
  } catch (err) {
    console.error('Lỗi resetPassword:', err);
    res.status(500).json({ success: false, error: 'Lỗi máy chủ khi đặt lại mật khẩu.' });
  }
};

// POST /api/auth/change-password — Người dùng đang đăng nhập tự đổi mật khẩu
exports.changePassword = async (req, res) => {
  try {
    const currentPassword = String(req.body.currentPassword || '');
    const newPassword = String(req.body.newPassword || '');

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Vui lòng nhập mật khẩu hiện tại và mật khẩu mới' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
    }
    if (newPassword === currentPassword) {
      return res.status(400).json({ success: false, error: 'Mật khẩu mới phải khác mật khẩu hiện tại' });
    }

    const { data: user, error } = await supabase
      .from('users').select('id, password_hash').eq('id', req.user.id).maybeSingle();
    if (error) throw error;
    if (!user) return res.status(404).json({ success: false, error: 'Không tìm thấy người dùng' });

    const ok = await bcrypt.compare(currentPassword, user.password_hash || DUMMY_HASH);
    if (!ok) return res.status(400).json({ success: false, error: 'Mật khẩu hiện tại không đúng' });

    const password_hash = await bcrypt.hash(newPassword, BCRYPT_COST);
    const { error: upErr } = await supabase
      .from('users')
      .update({ password_hash, reset_otp: null, reset_otp_expires: null })
      .eq('id', user.id);
    if (upErr) throw upErr;

    res.json({ success: true, message: 'Đổi mật khẩu thành công' });
  } catch (err) {
    handleError(res, err, 'changePassword');
  }
};

// PUT /api/auth/change-role/:id — Admin phân quyền (chỉ Admin)
exports.changeRole = async (req, res) => {
  try {
    const targetId = requireId(req.params.id, 'Mã người dùng');
    const { role } = req.body;

    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ success: false, error: `Role không hợp lệ. Chấp nhận: ${VALID_ROLES.join(', ')}` });
    }
    if (targetId === req.user.id && role !== 'admin') {
      return res.status(400).json({ success: false, error: 'Không thể tự hạ quyền admin của chính mình' });
    }

    const { data, error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', targetId)
      .select('id, ho_ten, email, role')
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, error: 'Không tìm thấy người dùng' });

    invalidateUserCache(targetId); // Quyền mới có hiệu lực ngay
    res.json({ success: true, message: `Đã cập nhật quyền thành ${role}`, data });
  } catch (err) {
    handleError(res, err, 'changeRole');
  }
};
