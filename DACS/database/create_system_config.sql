-- ================================================================
-- Tạo bảng system_config để lưu cấu hình ứng dụng
-- Chạy 1 lần duy nhất trong Supabase Dashboard → SQL Editor
-- ================================================================
CREATE TABLE IF NOT EXISTS system_config (
    key         VARCHAR PRIMARY KEY,
    value       TEXT    NOT NULL,
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Thêm giá trị mặc định: vinh danh chưa công bố
INSERT INTO system_config (key, value) 
VALUES ('vinh_danh_published', 'false')
ON CONFLICT (key) DO NOTHING;
