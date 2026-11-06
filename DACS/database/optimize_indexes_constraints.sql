-- ================================================================
-- TỐI ƯU HIỆU NĂNG & TOÀN VẸN DỮ LIỆU (2026-11-06)
-- Chạy trong Supabase Dashboard → SQL Editor. Chạy lại nhiều lần vẫn an toàn.
-- ================================================================

-- ── 1. Index cho các cột được lọc / join thường xuyên ─────────
CREATE INDEX IF NOT EXISTS idx_ho_so_sinh_vien_id      ON ho_so(sinh_vien_id);
CREATE INDEX IF NOT EXISTS idx_ho_so_trang_thai        ON ho_so(trang_thai);
CREATE INDEX IF NOT EXISTS idx_ho_so_ky_xet_duyet_id   ON ho_so(ky_xet_duyet_id);
CREATE INDEX IF NOT EXISTS idx_minh_chung_ho_so_id     ON minh_chung(ho_so_id);
CREATE INDEX IF NOT EXISTS idx_minh_chung_files_mc_id  ON minh_chung_files(minh_chung_id);
CREATE INDEX IF NOT EXISTS idx_lich_su_ho_so_ho_so_id  ON lich_su_ho_so(ho_so_id);
CREATE INDEX IF NOT EXISTS idx_users_lop_id            ON users(lop_id);
CREATE INDEX IF NOT EXISTS idx_users_role              ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email_lower       ON users(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_tieu_chi_parent_id      ON tieu_chi(parent_id);
CREATE INDEX IF NOT EXISTS idx_lop_hoc_khoa_id         ON lop_hoc(khoa_id);

-- ── 2. Ràng buộc UNIQUE chống tạo trùng khi bấm nhiều lần / request song song ──
-- Chỉ tạo khi dữ liệu hiện tại KHÔNG có bản ghi trùng (nếu có, in NOTICE để xử lý tay).

DO $$
BEGIN
  -- Mỗi sinh viên chỉ 1 hồ sơ / kỳ / loại danh hiệu
  IF EXISTS (
    SELECT 1 FROM ho_so
    GROUP BY sinh_vien_id, ky_xet_duyet_id, loai_doi_tuong
    HAVING COUNT(*) > 1
  ) THEN
    RAISE NOTICE 'Bỏ qua uq_ho_so_sv_ky_loai: đang có hồ sơ trùng (sinh_vien_id, ky_xet_duyet_id, loai_doi_tuong).';
  ELSE
    CREATE UNIQUE INDEX IF NOT EXISTS uq_ho_so_sv_ky_loai
      ON ho_so(sinh_vien_id, ky_xet_duyet_id, loai_doi_tuong);
  END IF;

  -- Mỗi hồ sơ chỉ 1 minh chứng / tiêu chí (luồng upsert-criteria)
  IF EXISTS (
    SELECT 1 FROM minh_chung
    GROUP BY ho_so_id, tieu_chi_id
    HAVING COUNT(*) > 1
  ) THEN
    RAISE NOTICE 'Bỏ qua uq_minh_chung_ho_so_tieu_chi: đang có minh chứng trùng (ho_so_id, tieu_chi_id).';
  ELSE
    CREATE UNIQUE INDEX IF NOT EXISTS uq_minh_chung_ho_so_tieu_chi
      ON minh_chung(ho_so_id, tieu_chi_id);
  END IF;
END $$;

-- Kiểm tra bản ghi trùng (nếu NOTICE ở trên xuất hiện):
-- SELECT sinh_vien_id, ky_xet_duyet_id, loai_doi_tuong, COUNT(*) FROM ho_so
--   GROUP BY 1,2,3 HAVING COUNT(*) > 1;
-- SELECT ho_so_id, tieu_chi_id, COUNT(*) FROM minh_chung GROUP BY 1,2 HAVING COUNT(*) > 1;
