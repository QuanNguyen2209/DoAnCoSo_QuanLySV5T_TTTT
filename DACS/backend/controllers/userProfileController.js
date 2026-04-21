const supabase = require('../config/db');

// Lấy thông tin hồ sơ của User hiện tại (hoặc theo ID)
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id; // Lấy từ middleware auth

    // 1. Lấy thông tin cơ bản từ bảng users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, ho_ten, email, ma_sv, avatar_url, role, lop_hoc(id, ma_lop, ten_lop, khoa(id, ten_khoa))')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    // 2. Lấy thông tin E-Profile từ bảng user_profiles
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle(); // maybeSingle vì có thể chưa có profile

    if (profileError) throw profileError;

    // Gộp dữ liệu
    const fullProfile = {
      user: userData,
      profile: profileData || {}
    };

    res.json({ success: true, data: fullProfile });
  } catch (err) {
    console.error('Lỗi getProfile:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Cập nhật hoặc tạo mới E-Profile
exports.upsertProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const profileInput = req.body; // chứa các trường dữ liệu

    // 1. Kiểm tra xem profile đã tồn tại chưa
    const { data: existingProfile, error: checkError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (checkError) throw checkError;

    let result;

    if (existingProfile) {
      // Cập nhật
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          ...profileInput,
          updated_at: new Date()
        })
        .eq('user_id', userId)
        .select()
        .single();
      if (error) throw error;
      result = data;
    } else {
      // Tạo mới
      const { data, error } = await supabase
        .from('user_profiles')
        .insert([{
          user_id: userId,
          ...profileInput
        }])
        .select()
        .single();
      if (error) throw error;
      result = data;
    }

    res.json({ success: true, data: result, message: 'Cập nhật hồ sơ thành công' });
  } catch (err) {
    console.error('Lỗi upsertProfile:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
