const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
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

    // Hash mật khẩu (cost=8: đủ an toàn cho môi trường học, nhanh hơn cost=10 ~4x)
    const salt = await bcrypt.genSalt(8);
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
    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('id, email, ho_ten')
      .eq('email', email)
      .single();

    if (userErr || !user) {
      // Luôn trả về thành công để tránh lộ thông tin
      return res.json({
        success: true,
        message: 'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được mã xác nhận.',
      });
    }

    // Tạo mã OTP 6 số ngẫu nhiên
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    // Hết hạn sau 15 phút
    const expires = new Date(Date.now() + 15 * 60000).toISOString();

    // Lưu vào database
    const { error: updateErr } = await supabase
      .from('users')
      .update({ reset_otp: otp, reset_otp_expires: expires })
      .eq('id', user.id);

    if (updateErr) throw updateErr;

    // Cấu hình Nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: '[Hệ thống SV5T] Mã xác thực lấy lại mật khẩu',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #4f46e5;">Yêu cầu lấy lại mật khẩu</h2>
          <p>Chào bạn <strong>${user.ho_ten}</strong>,</p>
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
      `
    };

    await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: 'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được mã xác nhận.',
    });
  } catch (err) {
    console.error('Lỗi forgotPassword:', err);
    res.status(500).json({ success: false, error: 'Lỗi máy chủ khi gửi mã xác thực.' });
  }
};

// POST /api/auth/reset-password — Đổi mật khẩu với mã OTP
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, error: 'Vui lòng cung cấp đủ thông tin.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'Mật khẩu phải có ít nhất 6 ký tự.' });
    }

    // Tìm user và kiểm tra OTP
    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('id, reset_otp, reset_otp_expires')
      .eq('email', email)
      .single();

    if (userErr || !user) {
      return res.status(400).json({ success: false, error: 'Mã xác thực không đúng hoặc đã hết hạn.' });
    }

    // Kiểm tra tính hợp lệ của OTP
    if (user.reset_otp !== otp) {
      return res.status(400).json({ success: false, error: 'Mã xác thực không đúng.' });
    }

    if (new Date(user.reset_otp_expires) < new Date()) {
      return res.status(400).json({ success: false, error: 'Mã xác thực đã hết hạn.' });
    }

    // Hash mật khẩu mới (cost=8)
    const salt = await bcrypt.genSalt(8);
    const password_hash = await bcrypt.hash(newPassword, salt);

    // Cập nhật mật khẩu và xóa OTP
    const { error: updateErr } = await supabase
      .from('users')
      .update({
        password_hash,
        reset_otp: null,
        reset_otp_expires: null
      })
      .eq('id', user.id);

    if (updateErr) throw updateErr;

    res.json({ success: true, message: 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập.' });
  } catch (err) {
    console.error('Lỗi resetPassword:', err);
    res.status(500).json({ success: false, error: 'Lỗi máy chủ khi đặt lại mật khẩu.' });
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
