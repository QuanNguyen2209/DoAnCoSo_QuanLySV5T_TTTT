-- ================================================================
-- CẬP NHẬT: THÊM BẢNG USER_PROFILES (Hồ sơ điện tử sinh viên)
-- Chạy lệnh này trong Supabase Dashboard → SQL Editor
-- ================================================================

CREATE TABLE IF NOT EXISTS user_profiles (
    id                      SERIAL PRIMARY KEY,
    user_id                 INT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    
    -- Khối 1: Thông tin cá nhân
    gioi_tinh               VARCHAR(20),
    ngay_sinh               DATE,
    dan_toc                 VARCHAR(50),
    ton_giao                VARCHAR(50),
    dia_chi_thuong_tru      TEXT,
    
    -- Khối 2: Thông tin liên hệ
    so_dien_thoai           VARCHAR(20),
    
    -- Khối 3: Thông tin đào tạo
    nam_hoc                 VARCHAR(50),
    trinh_do_dao_tao        VARCHAR(100),
    diem_tich_luy           DECIMAL(4,2), -- Thêm điểm GPA tự nhập
    diem_ren_luyen          INT,          -- Thêm điểm rèn luyện tự nhập
    ly_luan_chinh_tri       VARCHAR(200),
    ngoai_ngu               VARCHAR(200),
    tin_hoc                 VARCHAR(200),
    minh_chung_hoc_tap      TEXT,         -- Link file minh chứng (GPA/ĐRL)
    minh_chung_ngoai_ngu    TEXT,         -- Link file minh chứng
    minh_chung_tin_hoc      TEXT,         -- Link file minh chứng
    
    -- Khối 4: Thông tin công việc
    chuc_vu_doan_hoi        TEXT,
    
    -- Khối 5: Thông tin Đoàn – Đảng
    don_vi_doan_truc_thuoc  VARCHAR(200),
    ngay_ket_nap_doan       DATE,
    thong_tin_chinh_tri     TEXT,
    
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- Bật bảo mật RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Trigger cập nhật updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
