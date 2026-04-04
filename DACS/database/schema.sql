-- ================================================================
-- SCHEMA: Hệ thống Quản lý Sinh viên 5 Tốt & Tập thể Tiên tiến
-- ================================================================
CREATE DATABASE IF NOT EXISTS dacs_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dacs_db;

-- ----------------------------------------------------------------
-- 1. Khoa
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS khoa (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ma_khoa VARCHAR(20) NOT NULL UNIQUE,
    ten_khoa VARCHAR(200) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------
-- 2. Lớp học
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lop_hoc (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ma_lop VARCHAR(20) NOT NULL UNIQUE,
    ten_lop VARCHAR(100) NOT NULL,
    khoa_id INT,
    nien_khoa VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (khoa_id) REFERENCES khoa(id)
);

-- ----------------------------------------------------------------
-- 3. Người dùng (Sinh viên / Cán bộ / Admin)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ho_ten VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    ma_sv VARCHAR(20) UNIQUE,             -- Mã sinh viên
    role ENUM('student','monitor','reviewer','admin') DEFAULT 'student',
    lop_id INT,
    avatar_url VARCHAR(500),
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lop_id) REFERENCES lop_hoc(id)
);

-- ----------------------------------------------------------------
-- 4. Kỳ xét duyệt
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ky_xet_duyet (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ten_ky VARCHAR(200) NOT NULL,
    mo_ta TEXT,
    loai ENUM('hk1','hk2','ca_nam') NOT NULL,
    nam_hoc VARCHAR(20) NOT NULL,
    ngay_bat_dau DATE NOT NULL,
    ngay_ket_thuc DATE NOT NULL,
    trang_thai ENUM('upcoming','active','closed') DEFAULT 'upcoming',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------
-- 5. Tiêu chí đánh giá
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tieu_chi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ten_tieu_chi VARCHAR(200) NOT NULL,
    mo_ta TEXT,
    loai_doi_tuong ENUM('individual','collective','both') DEFAULT 'both',
    thu_tu INT DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------
-- 6. Hồ sơ đăng ký
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ho_so (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ma_ho_so VARCHAR(20) NOT NULL UNIQUE,
    sinh_vien_id INT NOT NULL,
    ky_xet_duyet_id INT NOT NULL,
    loai_doi_tuong ENUM('individual','collective') NOT NULL,
    trang_thai ENUM('draft','pending','reviewing','approved','rejected') DEFAULT 'draft',
    ghi_chu_sv TEXT,                                   -- Ghi chú của sinh viên
    phan_hoi_duyet TEXT,                               -- Phản hồi của người duyệt
    ngay_nop TIMESTAMP,
    ngay_duyet TIMESTAMP,
    nguoi_duyet_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (sinh_vien_id) REFERENCES users(id),
    FOREIGN KEY (ky_xet_duyet_id) REFERENCES ky_xet_duyet(id),
    FOREIGN KEY (nguoi_duyet_id) REFERENCES users(id)
);

-- ----------------------------------------------------------------
-- 7. Minh chứng trong hồ sơ
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS minh_chung (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ho_so_id INT NOT NULL,
    tieu_chi_id INT NOT NULL,
    ten_thanh_tich VARCHAR(500) NOT NULL,
    mo_ta TEXT,
    cap_thanh_tich ENUM('truong','khoa','khac') DEFAULT 'khac',
    ngay_ghi_nhan DATE,
    file_url VARCHAR(1000),
    file_name VARCHAR(500),
    file_size INT,
    file_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ho_so_id) REFERENCES ho_so(id) ON DELETE CASCADE,
    FOREIGN KEY (tieu_chi_id) REFERENCES tieu_chi(id)
);

-- ----------------------------------------------------------------
-- 8. Lịch sử trạng thái hồ sơ
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lich_su_ho_so (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ho_so_id INT NOT NULL,
    tu_trang_thai VARCHAR(50),
    den_trang_thai VARCHAR(50),
    ghi_chu TEXT,
    nguoi_thuc_hien_id INT,
    thoi_gian TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ho_so_id) REFERENCES ho_so(id) ON DELETE CASCADE,
    FOREIGN KEY (nguoi_thuc_hien_id) REFERENCES users(id)
);

-- ================================================================
-- DỮ LIỆU MẪU
-- ================================================================

-- Khoa
INSERT IGNORE INTO khoa (ma_khoa, ten_khoa) VALUES
('CNTT', 'Công nghệ Thông tin'),
('KT', 'Kinh tế'),
('QTKD', 'Quản trị Kinh doanh'),
('NN', 'Ngôn ngữ'),
('KH', 'Khoa học Tự nhiên');

-- Lớp học
INSERT IGNORE INTO lop_hoc (ma_lop, ten_lop, khoa_id, nien_khoa) VALUES
('CNTT01', 'CNTT K22A', 1, '2022-2026'),
('CNTT02', 'CNTT K22B', 1, '2022-2026'),
('KT01', 'Kinh tế K22A', 2, '2022-2026'),
('QTKD01', 'QTKD K22A', 3, '2022-2026');

-- Users (password_hash = bcrypt of "password123")
INSERT IGNORE INTO users (ho_ten, email, password_hash, ma_sv, role, lop_id) VALUES
('Nguyễn Lê Nguyên Quân', 'quan@student.edu.vn', '$2b$10$abcdefghijklmnopqrstuuVGZzZ.8GJ2.kTMh8r.YdD9b4M9qLDLi', 'SV22001', 'student', 1),
('Trần Thị Mai', 'mai@student.edu.vn', '$2b$10$abcdefghijklmnopqrstuuVGZzZ.8GJ2.kTMh8r.YdD9b4M9qLDLi', 'SV22002', 'student', 1),
('Lê Văn Hùng', 'hung@student.edu.vn', '$2b$10$abcdefghijklmnopqrstuuVGZzZ.8GJ2.kTMh8r.YdD9b4M9qLDLi', 'SV22003', 'monitor', 1),
('Nguyễn Thị Lan', 'lan@reviewer.edu.vn', '$2b$10$abcdefghijklmnopqrstuuVGZzZ.8GJ2.kTMh8r.YdD9b4M9qLDLi', NULL, 'reviewer', NULL),
('Admin System', 'admin@edu.vn', '$2b$10$abcdefghijklmnopqrstuuVGZzZ.8GJ2.kTMh8r.YdD9b4M9qLDLi', NULL, 'admin', NULL);

-- Kỳ xét duyệt
INSERT IGNORE INTO ky_xet_duyet (ten_ky, mo_ta, loai, nam_hoc, ngay_bat_dau, ngay_ket_thuc, trang_thai) VALUES
('Học kỳ 1 (2024-2025)', 'Kỳ xét duyệt Sinh viên 5 tốt HK1 năm học 2024-2025', 'hk1', '2024-2025', '2025-01-01', '2025-02-28', 'closed'),
('Học kỳ 2 (2024-2025)', 'Kỳ xét duyệt Sinh viên 5 tốt HK2 năm học 2024-2025', 'hk2', '2024-2025', '2026-03-01', '2026-04-30', 'active'),
('Cả năm (2025-2026)', 'Kỳ xét duyệt Tập thể Tiên tiến năm học 2025-2026', 'ca_nam', '2025-2026', '2026-06-01', '2026-07-31', 'upcoming');

-- Tiêu chí
INSERT IGNORE INTO tieu_chi (ten_tieu_chi, mo_ta, loai_doi_tuong, thu_tu) VALUES
('Học tập tốt', 'Đạt thành tích học tập xuất sắc, GPA từ 3.2 trở lên', 'individual', 1),
('Đạo đức tốt', 'Có lối sống lành mạnh, chấp hành tốt nội quy nhà trường', 'individual', 2),
('Thể lực tốt', 'Tham gia các hoạt động thể dục thể thao, đạt chuẩn sức khỏe', 'individual', 3),
('Tình nguyện tốt', 'Tích cực tham gia hoạt động tình nguyện, cộng đồng', 'individual', 4),
('Hội nhập tốt', 'Hội nhập tốt và kỹ năng mềm, ngoại ngữ, tin học', 'individual', 5),
('Phong trào thể thao', 'Tổ chức và tham gia tích cực các hoạt động thể thao', 'collective', 6),
('Hoạt động văn hóa', 'Tổ chức hoạt động văn hóa - nghệ thuật nổi bật', 'collective', 7),
('Tình nguyện cộng đồng', 'Có nhiều đóng góp cho cộng đồng và xã hội', 'collective', 8);

-- Hồ sơ mẫu
INSERT IGNORE INTO ho_so (ma_ho_so, sinh_vien_id, ky_xet_duyet_id, loai_doi_tuong, trang_thai, ghi_chu_sv, ngay_nop) VALUES
('HS-2025-001', 1, 2, 'individual', 'pending', 'Tôi đã cố gắng hết sức trong học kỳ này', '2026-03-24 08:00:00'),
('HS-2025-002', 1, 1, 'individual', 'approved', 'Hồ sơ đăng ký HK1', '2025-02-15 09:00:00'),
('HS-2025-003', 1, 1, 'individual', 'rejected', 'Thành tích NCKH', '2025-01-10 10:00:00'),
('HS-2025-004', 1, 2, 'individual', 'draft', NULL, NULL);

-- Minh chứng mẫu
INSERT IGNORE INTO minh_chung (ho_so_id, tieu_chi_id, ten_thanh_tich, mo_ta, cap_thanh_tich, ngay_ghi_nhan) VALUES
(1, 1, 'Đạt học bổng Odon Vallet 2025', 'Học bổng dành cho sinh viên xuất sắc', 'truong', '2025-12-01'),
(1, 4, 'Tham gia Mùa hè xanh 2025', 'Chiến dịch tình nguyện 10 ngày tại vùng sâu', 'truong', '2025-08-15'),
(2, 1, 'GPA 3.8/4.0 HK1 2024-2025', 'Kết quả học tập xuất sắc', 'truong', '2025-02-01'),
(3, 1, 'Giải nhì Olympic Toán cấp Khoa', 'Cuộc thi Olympic Toán', 'khoa', '2025-01-08');
