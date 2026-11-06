-- ================================================================
-- THIẾT LẬP TÀI KHOẢN CÁN BỘ XÉT DUYỆT (TEST)
-- Chạy SAU KHI đã chạy file add_reviewer_assignments.sql
-- Chạy trong Supabase Dashboard → SQL Editor
-- ================================================================

-- 1. Tạo bảng reviewer_assignments (nếu chưa có)
CREATE TABLE IF NOT EXISTS reviewer_assignments (
    id              SERIAL PRIMARY KEY,
    reviewer_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lop_id          INT NOT NULL REFERENCES lop_hoc(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(reviewer_id, lop_id)
);
ALTER TABLE reviewer_assignments ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_reviewer_assignments_reviewer ON reviewer_assignments(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviewer_assignments_lop ON reviewer_assignments(lop_id);

-- 2. Cập nhật role cho tài khoản cán bộ test (email: canbo@test.edu.vn)
UPDATE users SET role = 'can_bo' WHERE email = 'canbo@test.edu.vn';

-- 3. Phân công cán bộ quản lý tất cả các lớp hiện có
INSERT INTO reviewer_assignments (reviewer_id, lop_id)
SELECT u.id, lh.id
FROM users u, lop_hoc lh
WHERE u.email = 'canbo@test.edu.vn'
ON CONFLICT (reviewer_id, lop_id) DO NOTHING;
