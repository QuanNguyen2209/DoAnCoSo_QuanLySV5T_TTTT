-- ================================================================
-- SUPABASE SCHEMA (PostgreSQL) — PHIÊN BẢN THỰC TẾ
-- Hệ thống Quản lý Sinh viên 5 Tốt & Tập thể Tiên tiến
--
-- HƯỚNG DẪN: Paste toàn bộ nội dung này vào
-- Supabase Dashboard → SQL Editor → New Query → Run
-- ================================================================

-- ----------------------------------------------------------------
-- 1. Khoa
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS khoa (
    id          SERIAL PRIMARY KEY,
    ma_khoa     VARCHAR NOT NULL UNIQUE,
    ten_khoa    VARCHAR NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- 2. Lớp học
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lop_hoc (
    id          SERIAL PRIMARY KEY,
    ma_lop      VARCHAR NOT NULL UNIQUE,
    ten_lop     VARCHAR NOT NULL,
    khoa_id     INT REFERENCES khoa(id),
    nien_khoa   VARCHAR,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- 3. Người dùng
-- Roles: sinh_vien, lop_truong, can_bo, admin
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id              SERIAL PRIMARY KEY,
    ho_ten          VARCHAR NOT NULL,
    email           VARCHAR NOT NULL UNIQUE,
    password_hash   VARCHAR NOT NULL,
    ma_sv           VARCHAR UNIQUE,
    role            VARCHAR DEFAULT 'sinh_vien'
                    CHECK (role IN ('sinh_vien','lop_truong','can_bo','admin')),
    lop_id          INT REFERENCES lop_hoc(id),
    avatar_url      TEXT,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- 4. Hồ sơ điện tử (E-Profile)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_profiles (
    id                      SERIAL PRIMARY KEY,
    user_id                 INT NOT NULL UNIQUE REFERENCES users(id),
    gioi_tinh               VARCHAR,
    ngay_sinh               DATE,
    dan_toc                 VARCHAR,
    ton_giao                VARCHAR,
    dia_chi_thuong_tru       TEXT,
    so_dien_thoai           VARCHAR,
    nam_hoc                 VARCHAR,
    trinh_do_dao_tao        VARCHAR,
    diem_tich_luy           NUMERIC,
    diem_ren_luyen          INT,
    ly_luan_chinh_tri       VARCHAR,
    ngoai_ngu               VARCHAR,
    tin_hoc                 VARCHAR,
    minh_chung_hoc_tap      TEXT,
    minh_chung_ngoai_ngu    TEXT,
    minh_chung_tin_hoc      TEXT,
    chuc_vu_doan_hoi        TEXT,
    don_vi_doan_truc_thuoc  VARCHAR,
    ngay_ket_nap_doan       DATE,
    thong_tin_chinh_tri     TEXT,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- 5. Kỳ xét duyệt
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ky_xet_duyet (
    id              SERIAL PRIMARY KEY,
    ten_ky          VARCHAR NOT NULL,
    mo_ta           TEXT,
    loai            VARCHAR NOT NULL
                    CHECK (loai IN ('hk1','hk2','ca_nam')),
    nam_hoc         VARCHAR NOT NULL,
    ngay_bat_dau    DATE NOT NULL,
    ngay_ket_thuc   DATE NOT NULL,
    trang_thai      VARCHAR DEFAULT 'upcoming'
                    CHECK (trang_thai IN ('upcoming','active','closed')),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- 6. Tiêu chí đánh giá (phân cấp cha-con)
-- loai_doi_tuong: individual (SV5T), collective (TTTT)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tieu_chi (
    id              SERIAL PRIMARY KEY,
    ten_tieu_chi    VARCHAR NOT NULL,
    mo_ta           TEXT,
    thu_tu          INT DEFAULT 0,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    parent_id       INT REFERENCES tieu_chi(id),
    loai_doi_tuong  TEXT DEFAULT 'individual'
);

-- ----------------------------------------------------------------
-- 7. Hồ sơ đăng ký
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ho_so (
    id                  SERIAL PRIMARY KEY,
    ma_ho_so            VARCHAR NOT NULL UNIQUE,
    sinh_vien_id        INT NOT NULL REFERENCES users(id),
    ky_xet_duyet_id     INT NOT NULL REFERENCES ky_xet_duyet(id),
    loai_doi_tuong      VARCHAR NOT NULL
                        CHECK (loai_doi_tuong IN ('individual','collective')),
    trang_thai          VARCHAR DEFAULT 'draft'
                        CHECK (trang_thai IN ('draft','pending','reviewing','approved','rejected')),
    ghi_chu_sv          TEXT,
    phan_hoi_duyet      TEXT,
    ngay_nop            TIMESTAMPTZ,
    ngay_duyet          TIMESTAMPTZ,
    nguoi_duyet_id      INT REFERENCES users(id),
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger tự động cập nhật updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_ho_so_updated_at ON ho_so;
CREATE TRIGGER update_ho_so_updated_at
    BEFORE UPDATE ON ho_so
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------
-- 8. Minh chứng
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS minh_chung (
    id              SERIAL PRIMARY KEY,
    ho_so_id        INT NOT NULL REFERENCES ho_so(id) ON DELETE CASCADE,
    tieu_chi_id     INT NOT NULL REFERENCES tieu_chi(id),
    ten_thanh_tich  TEXT NOT NULL,
    mo_ta           TEXT,
    cap_thanh_tich  VARCHAR DEFAULT 'khac'
                    CHECK (cap_thanh_tich IN ('truong','khoa','khac')),
    ngay_ghi_nhan   DATE,
    file_url        TEXT,
    file_name       TEXT,
    file_size       INT,
    file_type       VARCHAR,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- 9. File minh chứng (multi-file per minh_chung, tối đa 4)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS minh_chung_files (
    id              SERIAL PRIMARY KEY,
    minh_chung_id   INT NOT NULL REFERENCES minh_chung(id) ON DELETE CASCADE,
    file_url        TEXT NOT NULL,
    file_name       VARCHAR,
    file_size       INT,
    file_type       VARCHAR,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- 10. Lịch sử hồ sơ
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lich_su_ho_so (
    id                      SERIAL PRIMARY KEY,
    ho_so_id                INT NOT NULL REFERENCES ho_so(id) ON DELETE CASCADE,
    tu_trang_thai           VARCHAR,
    den_trang_thai          VARCHAR,
    ghi_chu                 TEXT,
    nguoi_thuc_hien_id      INT REFERENCES users(id),
    thoi_gian               TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- 11. Phân công cán bộ xét duyệt theo lớp
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reviewer_assignments (
    id              SERIAL PRIMARY KEY,
    reviewer_id     INT NOT NULL REFERENCES users(id),
    lop_id          INT NOT NULL REFERENCES lop_hoc(id),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================================
ALTER TABLE users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE ho_so           ENABLE ROW LEVEL SECURITY;
ALTER TABLE minh_chung      ENABLE ROW LEVEL SECURITY;
ALTER TABLE minh_chung_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE lich_su_ho_so   ENABLE ROW LEVEL SECURITY;
