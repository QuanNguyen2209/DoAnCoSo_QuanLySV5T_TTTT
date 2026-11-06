-- ================================================================
-- THÊM TIÊU CHÍ TẬP THỂ SINH VIÊN TIÊN TIẾN (theo HUTECH 2024-2025)
-- Chạy trên Supabase Dashboard → SQL Editor
-- ================================================================

-- 1. Cập nhật tất cả tiêu chí hiện tại (đang không có loai_doi_tuong) thành 'individual'
UPDATE tieu_chi SET loai_doi_tuong = 'individual' WHERE loai_doi_tuong IS NULL;

-- ================================================================
-- TIÊU CHUẨN "HỌC TẬP" - 40 điểm
-- ================================================================
INSERT INTO tieu_chi (ten_tieu_chi, mo_ta, thu_tu, parent_id, is_active, loai_doi_tuong)
VALUES ('Tiêu chuẩn Học tập', 'Tiêu chuẩn đánh giá học tập tập thể - 40 điểm', 1, NULL, true, 'collective');

INSERT INTO tieu_chi (ten_tieu_chi, mo_ta, thu_tu, parent_id, is_active, loai_doi_tuong)
VALUES 
(
  '≥ 40% SV đạt ĐTBNH từ 2.5 trở lên',
  'Tỷ lệ sinh viên đạt điểm trung bình năm học từ 2.5 trở lên (15 điểm)',
  1,
  (SELECT id FROM tieu_chi WHERE ten_tieu_chi = 'Tiêu chuẩn Học tập' AND loai_doi_tuong = 'collective' LIMIT 1),
  true, 'collective'
),
(
  '≥ 70% SV tham gia sinh hoạt chuyên đề hoặc ≥ 20% thi học thuật',
  'Tham gia tổ chức buổi sinh hoạt chuyên đề; hoặc ≥ 20% SV tham gia cuộc thi học thuật các cấp (10 điểm)',
  2,
  (SELECT id FROM tieu_chi WHERE ten_tieu_chi = 'Tiêu chuẩn Học tập' AND loai_doi_tuong = 'collective' LIMIT 1),
  true, 'collective'
),
(
  '≥ 01 SV tham gia NCKH hoặc có bài báo kỷ yếu',
  'Có ít nhất 01 SV tham gia nghiên cứu khoa học các cấp hoặc có bài báo đăng trên kỷ yếu SV (5 điểm)',
  3,
  (SELECT id FROM tieu_chi WHERE ten_tieu_chi = 'Tiêu chuẩn Học tập' AND loai_doi_tuong = 'collective' LIMIT 1),
  true, 'collective'
),
(
  '≥ 30% SV đạt "Sinh viên 5 tốt" cấp Trường',
  'Tỷ lệ sinh viên đạt danh hiệu SV5T từ cấp Trường trở lên (5 điểm)',
  4,
  (SELECT id FROM tieu_chi WHERE ten_tieu_chi = 'Tiêu chuẩn Học tập' AND loai_doi_tuong = 'collective' LIMIT 1),
  true, 'collective'
),
(
  '≥ 01 SV đạt "Sinh viên 5 tốt" cấp Thành',
  'Có ít nhất 01 SV đạt danh hiệu SV5T cấp Thành phố (5 điểm)',
  5,
  (SELECT id FROM tieu_chi WHERE ten_tieu_chi = 'Tiêu chuẩn Học tập' AND loai_doi_tuong = 'collective' LIMIT 1),
  true, 'collective'
);

-- ================================================================
-- TIÊU CHUẨN "RÈN LUYỆN" - 35 điểm
-- ================================================================
INSERT INTO tieu_chi (ten_tieu_chi, mo_ta, thu_tu, parent_id, is_active, loai_doi_tuong)
VALUES ('Tiêu chuẩn Rèn luyện', 'Tiêu chuẩn đánh giá rèn luyện tập thể - 35 điểm', 2, NULL, true, 'collective');

INSERT INTO tieu_chi (ten_tieu_chi, mo_ta, thu_tu, parent_id, is_active, loai_doi_tuong)
VALUES 
(
  '≥ 70% SV có kết quả rèn luyện từ Tốt trở lên',
  'Tỷ lệ sinh viên có kết quả đánh giá rèn luyện từ tốt trở lên (15 điểm)',
  1,
  (SELECT id FROM tieu_chi WHERE ten_tieu_chi = 'Tiêu chuẩn Rèn luyện' AND loai_doi_tuong = 'collective' LIMIT 1),
  true, 'collective'
),
(
  '≥ 70% SV tham gia hoạt động tình nguyện vì cộng đồng',
  'Tham gia tổ chức ít nhất một hoạt động tình nguyện vì cộng đồng (10 điểm)',
  2,
  (SELECT id FROM tieu_chi WHERE ten_tieu_chi = 'Tiêu chuẩn Rèn luyện' AND loai_doi_tuong = 'collective' LIMIT 1),
  true, 'collective'
),
(
  '≥ 03 SV hiến máu hoặc ≥ 50% SV tham gia 3 ngày tình nguyện',
  'Có ≥ 03 SV tham gia hiến máu nhân đạo; hoặc ≥ 50% SV tham gia ba ngày tình nguyện trong năm học (5 điểm)',
  3,
  (SELECT id FROM tieu_chi WHERE ten_tieu_chi = 'Tiêu chuẩn Rèn luyện' AND loai_doi_tuong = 'collective' LIMIT 1),
  true, 'collective'
),
(
  '≥ 03 SV tham gia phong trào VHVN-TDTT',
  'Có ≥ 03 SV tham gia một phong trào văn hóa văn nghệ thể dục thể thao do các cấp tổ chức (5 điểm)',
  4,
  (SELECT id FROM tieu_chi WHERE ten_tieu_chi = 'Tiêu chuẩn Rèn luyện' AND loai_doi_tuong = 'collective' LIMIT 1),
  true, 'collective'
);

-- ================================================================
-- TIÊU CHUẨN "KỸ NĂNG" - 25 điểm
-- ================================================================
INSERT INTO tieu_chi (ten_tieu_chi, mo_ta, thu_tu, parent_id, is_active, loai_doi_tuong)
VALUES ('Tiêu chuẩn Kỹ năng', 'Tiêu chuẩn đánh giá kỹ năng tập thể - 25 điểm', 3, NULL, true, 'collective');

INSERT INTO tieu_chi (ten_tieu_chi, mo_ta, thu_tu, parent_id, is_active, loai_doi_tuong)
VALUES 
(
  '≥ 70% SV tham gia hội thảo/tập huấn kỹ năng',
  'Tham gia ít nhất một buổi hội thảo hoặc tập huấn kỹ năng các cấp tổ chức (10 điểm)',
  1,
  (SELECT id FROM tieu_chi WHERE ten_tieu_chi = 'Tiêu chuẩn Kỹ năng' AND loai_doi_tuong = 'collective' LIMIT 1),
  true, 'collective'
),
(
  '≥ 70% SV tham gia 2 buổi sinh hoạt kỹ năng ngoại khóa',
  'Tham gia tổ chức hai buổi sinh hoạt kỹ năng ngoại khóa (10 điểm)',
  2,
  (SELECT id FROM tieu_chi WHERE ten_tieu_chi = 'Tiêu chuẩn Kỹ năng' AND loai_doi_tuong = 'collective' LIMIT 1),
  true, 'collective'
),
(
  '≥ 01 SV tham gia cuộc thi/chương trình khởi nghiệp',
  'Có ít nhất 01 SV tham gia cuộc thi hoặc chương trình, hoạt động liên quan đến khởi nghiệp do các cấp tổ chức (5 điểm)',
  3,
  (SELECT id FROM tieu_chi WHERE ten_tieu_chi = 'Tiêu chuẩn Kỹ năng' AND loai_doi_tuong = 'collective' LIMIT 1),
  true, 'collective'
);
