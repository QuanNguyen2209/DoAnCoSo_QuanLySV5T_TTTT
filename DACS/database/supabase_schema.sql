-- ================================================================
-- SUPABASE SCHEMA (PostgreSQL)
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
    ma_khoa     VARCHAR(20) NOT NULL UNIQUE,
    ten_khoa    VARCHAR(200) NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- 2. Lớp học
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lop_hoc (
    id          SERIAL PRIMARY KEY,
    ma_lop      VARCHAR(20) NOT NULL UNIQUE,
    ten_lop     VARCHAR(100) NOT NULL,
    khoa_id     INT REFERENCES khoa(id),
    nien_khoa   VARCHAR(20),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- 3. Người dùng
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id              SERIAL PRIMARY KEY,
    ho_ten          VARCHAR(100) NOT NULL,
    email           VARCHAR(100) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    ma_sv           VARCHAR(20) UNIQUE,
    role            VARCHAR(20) DEFAULT 'student'
                    CHECK (role IN ('student','monitor','reviewer','admin')),
    lop_id          INT REFERENCES lop_hoc(id),
    avatar_url      TEXT,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- 4. Kỳ xét duyệt
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ky_xet_duyet (
    id              SERIAL PRIMARY KEY,
    ten_ky          VARCHAR(200) NOT NULL,
    mo_ta           TEXT,
    loai            VARCHAR(20) NOT NULL
                    CHECK (loai IN ('hk1','hk2','ca_nam')),
    nam_hoc         VARCHAR(20) NOT NULL,
    ngay_bat_dau    DATE NOT NULL,
    ngay_ket_thuc   DATE NOT NULL,
    trang_thai      VARCHAR(20) DEFAULT 'upcoming'
                    CHECK (trang_thai IN ('upcoming','active','closed')),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- 5. Tiêu chí đánh giá
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tieu_chi (
    id              SERIAL PRIMARY KEY,
    ten_tieu_chi    VARCHAR(200) NOT NULL,
    mo_ta           TEXT,
    loai_doi_tuong  VARCHAR(20) DEFAULT 'both'
                    CHECK (loai_doi_tuong IN ('individual','collective','both')),
    thu_tu          INT DEFAULT 0,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- 6. Hồ sơ đăng ký
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ho_so (
    id                  SERIAL PRIMARY KEY,
    ma_ho_so            VARCHAR(20) NOT NULL UNIQUE,
    sinh_vien_id        INT NOT NULL REFERENCES users(id),
    ky_xet_duyet_id     INT NOT NULL REFERENCES ky_xet_duyet(id),
    loai_doi_tuong      VARCHAR(20) NOT NULL
                        CHECK (loai_doi_tuong IN ('individual','collective')),
    trang_thai          VARCHAR(20) DEFAULT 'draft'
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
-- 7. Minh chứng
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS minh_chung (
    id              SERIAL PRIMARY KEY,
    ho_so_id        INT NOT NULL REFERENCES ho_so(id) ON DELETE CASCADE,
    tieu_chi_id     INT NOT NULL REFERENCES tieu_chi(id),
    ten_thanh_tich  TEXT NOT NULL,
    mo_ta           TEXT,
    cap_thanh_tich  VARCHAR(20) DEFAULT 'khac'
                    CHECK (cap_thanh_tich IN ('truong','khoa','khac')),
    ngay_ghi_nhan   DATE,
    file_url        TEXT,
    file_name       TEXT,
    file_size       INT,
    file_type       VARCHAR(100),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- 8. Lịch sử hồ sơ
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lich_su_ho_so (
    id                      SERIAL PRIMARY KEY,
    ho_so_id                INT NOT NULL REFERENCES ho_so(id) ON DELETE CASCADE,
    tu_trang_thai           VARCHAR(50),
    den_trang_thai          VARCHAR(50),
    ghi_chu                 TEXT,
    nguoi_thuc_hien_id      INT REFERENCES users(id),
    thoi_gian               TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- ROW LEVEL SECURITY (RLS) - Bảo mật dữ liệu
-- ================================================================

ALTER TABLE users        ENABLE ROW LEVEL SECURITY;
ALTER TABLE ho_so        ENABLE ROW LEVEL SECURITY;
ALTER TABLE minh_chung   ENABLE ROW LEVEL SECURITY;
ALTER TABLE lich_su_ho_so ENABLE ROW LEVEL SECURITY;

-- Policy: service_role (backend) có toàn quyền bypass RLS
-- Các bảng khác (ky_xet_duyet, tieu_chi, khoa, lop_hoc) không cần RLS vì ai cũng đọc được

-- ================================================================
-- DỮ LIỆU MẪU (SEED DATA)
-- ================================================================

-- Khoa
INSERT INTO khoa (ma_khoa, ten_khoa) VALUES
('CNTT', 'Công nghệ Thông tin'),
('KT',   'Kinh tế'),
('QTKD', 'Quản trị Kinh doanh'),
('NN',   'Ngôn ngữ'),
('KH',   'Khoa học Tự nhiên')
ON CONFLICT (ma_khoa) DO NOTHING;

-- Lớp học
INSERT INTO lop_hoc (ma_lop, ten_lop, khoa_id, nien_khoa) VALUES
('CNTT01', 'CNTT K22A', 1, '2022-2026'),
('CNTT02', 'CNTT K22B', 1, '2022-2026'),
('KT01',   'Kinh tế K22A', 2, '2022-2026'),
('QTKD01', 'QTKD K22A', 3, '2022-2026')
ON CONFLICT (ma_lop) DO NOTHING;

-- Kỳ xét duyệt
INSERT INTO ky_xet_duyet (ten_ky, mo_ta, loai, nam_hoc, ngay_bat_dau, ngay_ket_thuc, trang_thai) VALUES
('Học kỳ 1 (2024-2025)', 'Kỳ xét duyệt Sinh viên 5 tốt HK1 năm học 2024-2025', 'hk1', '2024-2025', '2025-01-01', '2025-02-28', 'closed'),
('Học kỳ 2 (2024-2025)', 'Kỳ xét duyệt Sinh viên 5 tốt HK2 năm học 2024-2025', 'hk2', '2024-2025', '2026-03-01', '2026-04-30', 'active'),
('Cả năm (2025-2026)',   'Kỳ xét duyệt Tập thể Tiên tiến năm học 2025-2026',    'ca_nam', '2025-2026', '2026-06-01', '2026-07-31', 'upcoming');

-- Tiêu chí
INSERT INTO tieu_chi (ten_tieu_chi, mo_ta, loai_doi_tuong, thu_tu) VALUES
('Học tập tốt',       'Đạt thành tích học tập xuất sắc, GPA từ 3.2 trở lên',              'individual', 1),
('Đạo đức tốt',       'Có lối sống lành mạnh, chấp hành tốt nội quy nhà trường',           'individual', 2),
('Thể lực tốt',       'Tham gia các hoạt động thể dục thể thao, đạt chuẩn sức khỏe',       'individual', 3),
('Tình nguyện tốt',   'Tích cực tham gia hoạt động tình nguyện, cộng đồng',                'individual', 4),
('Hội nhập tốt',      'Hội nhập tốt và kỹ năng mềm, ngoại ngữ, tin học',                  'individual', 5),
('Phong trào thể thao','Tổ chức và tham gia tích cực các hoạt động thể thao',              'collective', 6),
('Hoạt động văn hóa', 'Tổ chức hoạt động văn hóa - nghệ thuật nổi bật',                   'collective', 7),
('Tình nguyện cộng đồng','Có nhiều đóng góp cho cộng đồng và xã hội',                     'collective', 8);

-- ================================================================
-- SUPABASE STORAGE — Tạo bucket cho file minh chứng
-- (Chạy lệnh này qua Supabase Dashboard → Storage → New Bucket)
-- Hoặc chạy SQL sau nếu extension storage đã được enable:
-- ================================================================
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('minh-chung', 'minh-chung', false)
-- ON CONFLICT (id) DO NOTHING;
