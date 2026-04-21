-- ================================================================
-- CẬP NHẬT ROLE VÀ GÁN LỚP CHO TÀI KHOẢN TEST
-- Chạy trong Supabase Dashboard → SQL Editor
-- ================================================================

-- 1. Cập nhật role admin
UPDATE users SET role = 'admin' WHERE email = 'admin@test.edu.vn';

-- 2. Gán sinh viên test vào lớp CNTT01 (lop_id = 1)
UPDATE users SET lop_id = 1 WHERE email = 'sinhvien@test.edu.vn';
