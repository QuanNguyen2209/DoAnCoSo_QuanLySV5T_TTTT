const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Thiếu biến môi trường SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY!');
  process.exit(1);
}

// Tạo Supabase client với Service Role Key (full quyền, chỉ dùng ở backend)
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Kiểm tra kết nối khi khởi động
async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = table not found — vẫn kết nối được
      console.warn('⚠️  Cảnh báo kết nối Supabase:', error.message);
    } else {
      console.log('✅ Đã kết nối thành công tới Supabase!');
    }
  } catch (err) {
    console.error('❌ Không thể kết nối Supabase:', err.message);
  }
}

testConnection();

module.exports = supabase;
