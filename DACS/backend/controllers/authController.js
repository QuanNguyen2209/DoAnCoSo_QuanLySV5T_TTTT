const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');

const TOKEN_EXPIRY = '7d'; // Token hết hạn sau 7 ngày

// Tạo JWT token
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, ho_ten: user.ho_ten },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
}

// POST /api/auth/register — Đăng ký tài khoản mới (mặc định role = sinh_vien)
exports.register = async (req, res) => {
  try {
    const { ho_ten, email, password, ma_sv } = req.body;

    // Validate
    if (!ho_ten || !email || !password) {
      return res.status(400).json({ success: false, error: 'Vui lòng điền đầy đủ thông tin' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }

    // Kiểm tra email đã tồn tại chưa
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return res.status(409).json({ success: false, error: 'Email này đã được đăng ký' });
    }

    // Hash mật khẩu
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Tạo user mới với role mặc định là sinh_vien
    const { data, error } = await supabase
      .from('users')
      .insert([{
        ho_ten,
        email,
        password_hash,
        ma_sv: ma_sv || null,
        role: 'sinh_vien',
      }])
      .select('id, ho_ten, email, ma_sv, role')
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công! Vui lòng đăng nhập.',
      data,
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/auth/login — Đăng nhập
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Vui lòng nhập email và mật khẩu' });
    }

    // Tìm user theo email
    const { data: user, error } = await supabase
      .from('users')
      .select('id, ho_ten, email, ma_sv, role, password_hash, avatar_url')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ success: false, error: 'Email hoặc mật khẩu không đúng' });
    }

    // So sánh mật khẩu
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Email hoặc mật khẩu không đúng' });
    }

    // Tạo token
    const token = generateToken(user);

    // Trả về (không bao gồm password_hash)
    const { password_hash, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'Đăng nhập thành công!',
      data: {
        user: userWithoutPassword,
        token,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/auth/me — Lấy thông tin user hiện tại (cần token)
exports.me = async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, ho_ten, email, ma_sv, role, avatar_url')
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy người dùng' });
    }

    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/auth/forgot-password — Gửi yêu cầu đặt lại mật khẩu
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Vui lòng nhập email' });
    }

    // Kiểm tra email có tồn tại
    const { data: user } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single();

    // Luôn trả về thành công để tránh lộ thông tin
    res.json({
      success: true,
      message: 'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.',
    });

    // TODO: Tích hợp gửi email reset password khi cần
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// PUT /api/auth/change-role/:id — Admin phân quyền (chỉ Admin)
exports.changeRole = async (req, res) => {
  try {
    const { role } = req.body;
    const validRoles = ['sinh_vien', 'lop_truong', 'can_bo', 'admin'];

    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, error: `Role không hợp lệ. Chấp nhận: ${validRoles.join(', ')}` });
    }

    const { data, error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', req.params.id)
      .select('id, ho_ten, email, role')
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, error: 'Không tìm thấy người dùng' });

    res.json({ success: true, message: `Đã cập nhật quyền thành ${role}`, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
