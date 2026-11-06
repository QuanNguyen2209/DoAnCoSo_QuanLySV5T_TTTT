-- ================================================================
-- DỮ LIỆU MẪU: Hồ sơ + Minh chứng để test chức năng Cán bộ
-- Chạy trong Supabase Dashboard → SQL Editor
-- ================================================================

-- Tạo hồ sơ mẫu cho sinh viên Nguyễn Lê Nguyên Quân (tài khoản chính)
-- Lấy ID động để tránh lỗi
DO $$
DECLARE
  v_sv_id_1 INT;
  v_sv_id_2 INT;
  v_ky_id INT;
  v_hs_id_1 INT;
  v_hs_id_2 INT;
  v_hs_id_3 INT;
  v_tc_1 INT;
  v_tc_2 INT;
  v_tc_3 INT;
  v_tc_4 INT;
  v_tc_5 INT;
BEGIN
  -- Lấy ID sinh viên
  SELECT id INTO v_sv_id_1 FROM users WHERE email = 'nguyenlebaoquan1404@gmail.com';
  SELECT id INTO v_sv_id_2 FROM users WHERE email = 'sinhvien@test.edu.vn';
  
  -- Lấy ID kỳ xét duyệt đang active
  SELECT id INTO v_ky_id FROM ky_xet_duyet WHERE trang_thai = 'active' LIMIT 1;
  
  -- Lấy ID tiêu chí
  SELECT id INTO v_tc_1 FROM tieu_chi WHERE ten_tieu_chi ILIKE '%Học tập%' LIMIT 1;
  SELECT id INTO v_tc_2 FROM tieu_chi WHERE ten_tieu_chi ILIKE '%Đạo đức%' LIMIT 1;
  SELECT id INTO v_tc_3 FROM tieu_chi WHERE ten_tieu_chi ILIKE '%Thể lực%' LIMIT 1;
  SELECT id INTO v_tc_4 FROM tieu_chi WHERE ten_tieu_chi ILIKE '%Tình nguyện%' LIMIT 1;
  SELECT id INTO v_tc_5 FROM tieu_chi WHERE ten_tieu_chi ILIKE '%Hội nhập%' LIMIT 1;

  -- ===== HỒ SƠ 1: Chờ duyệt (pending) =====
  IF v_sv_id_1 IS NOT NULL AND v_ky_id IS NOT NULL THEN
    INSERT INTO ho_so (ma_ho_so, sinh_vien_id, ky_xet_duyet_id, loai_doi_tuong, trang_thai, ghi_chu_sv, ngay_nop)
    VALUES ('HS-TEST-001', v_sv_id_1, v_ky_id, 'individual', 'pending', 
            'Em đã tích cực tham gia các hoạt động Đoàn - Hội trong suốt học kỳ và đạt GPA 3.5/4.0. Kính mong được xét duyệt danh hiệu Sinh viên 5 Tốt.', 
            NOW() - INTERVAL '2 days')
    RETURNING id INTO v_hs_id_1;

    -- Minh chứng cho hồ sơ 1
    INSERT INTO minh_chung (ho_so_id, tieu_chi_id, ten_thanh_tich, mo_ta, cap_thanh_tich, ngay_ghi_nhan) VALUES
    (v_hs_id_1, v_tc_1, 'Đạt GPA 3.5/4.0 - HK2 2024-2025', 'Kết quả học tập xuất sắc, đứng top 10% khoa CNTT', 'truong', '2026-03-15'),
    (v_hs_id_1, v_tc_2, 'Giấy khen Sinh viên Gương mẫu', 'Được Đoàn khoa tuyên dương về tấm gương đạo đức tốt', 'khoa', '2026-02-20'),
    (v_hs_id_1, v_tc_3, 'Giải Ba Giải chạy Marathon Trường 2025', 'Tham gia và đạt giải tại sự kiện thể thao cấp Trường', 'truong', '2025-12-10'),
    (v_hs_id_1, v_tc_4, 'Tham gia Mùa hè xanh 2025', 'Tình nguyện 14 ngày tại huyện Cần Giờ, TP.HCM', 'truong', '2025-08-15'),
    (v_hs_id_1, v_tc_5, 'Chứng chỉ TOEIC 750', 'Đạt chứng chỉ ngoại ngữ quốc tế', 'khac', '2025-11-20');
  END IF;

  -- ===== HỒ SƠ 2: Chờ duyệt (pending) =====
  IF v_sv_id_2 IS NOT NULL AND v_ky_id IS NOT NULL THEN
    INSERT INTO ho_so (ma_ho_so, sinh_vien_id, ky_xet_duyet_id, loai_doi_tuong, trang_thai, ghi_chu_sv, ngay_nop)
    VALUES ('HS-TEST-002', v_sv_id_2, v_ky_id, 'individual', 'pending', 
            'Em xin nộp hồ sơ đăng ký xét duyệt SV5T. Em đã đạt điểm rèn luyện 92 và tham gia nhiều hoạt động tình nguyện.', 
            NOW() - INTERVAL '1 day')
    RETURNING id INTO v_hs_id_2;

    -- Minh chứng cho hồ sơ 2
    INSERT INTO minh_chung (ho_so_id, tieu_chi_id, ten_thanh_tich, mo_ta, cap_thanh_tich, ngay_ghi_nhan) VALUES
    (v_hs_id_2, v_tc_1, 'Đạt GPA 3.2/4.0', 'Kết quả học tập khá giỏi', 'truong', '2026-03-10'),
    (v_hs_id_2, v_tc_4, 'Tham gia chiến dịch Xuân tình nguyện 2026', 'Hoạt động tình nguyện 7 ngày tại Tây Ninh', 'truong', '2026-01-25');
  END IF;

  -- ===== HỒ SƠ 3: Đang xem xét (reviewing) =====
  IF v_sv_id_1 IS NOT NULL AND v_ky_id IS NOT NULL THEN
    INSERT INTO ho_so (ma_ho_so, sinh_vien_id, ky_xet_duyet_id, loai_doi_tuong, trang_thai, ghi_chu_sv, ngay_nop)
    VALUES ('HS-TEST-003', v_sv_id_1, v_ky_id, 'collective', 'reviewing', 
            'Lớp CNTT K22A đã có thành tích xuất sắc trong phong trào Đoàn - Hội năm học 2024-2025.', 
            NOW() - INTERVAL '5 days')
    RETURNING id INTO v_hs_id_3;

    -- Minh chứng cho hồ sơ 3
    INSERT INTO minh_chung (ho_so_id, tieu_chi_id, ten_thanh_tich, mo_ta, cap_thanh_tich, ngay_ghi_nhan) VALUES
    (v_hs_id_3, v_tc_4, 'Tổ chức thành công chiến dịch Hiến máu nhân đạo', 'Thu hút 150 sinh viên tham gia, thu được 120 đơn vị máu', 'truong', '2026-03-08'),
    (v_hs_id_3, v_tc_2, 'Chi đoàn Xuất sắc cấp Khoa', 'Được Đoàn khoa CNTT công nhận Chi đoàn Xuất sắc năm học 2024-2025', 'khoa', '2026-02-28');

    -- Ghi lịch sử cho hồ sơ 3
    INSERT INTO lich_su_ho_so (ho_so_id, tu_trang_thai, den_trang_thai, ghi_chu, nguoi_thuc_hien_id)
    VALUES (v_hs_id_3, 'pending', 'reviewing', 'Cán bộ bắt đầu xem xét hồ sơ tập thể', v_sv_id_1);
  END IF;

  RAISE NOTICE 'Đã tạo dữ liệu mẫu thành công!';
END $$;
