# 🏗️ Thiết kế Hệ thống & Cơ sở dữ liệu (ERD)

Tài liệu này mô tả luồng xử lý nghiệp vụ, sơ đồ quan hệ các bảng (ERD) và mã SQL khởi tạo cho dự án Scholastic Kinetic.

---

## 1. 🔄 Luồng xử lý chính (Workflow)

```mermaid
graph TD
    A[Admin: Tạo Kỳ xét duyệt & Tiêu chuẩn] --> B[Sinh viên/Lớp trưởng: Đăng nhập]
    B --> C{Chọn đối tượng}
    C -->|Cá nhân| D[Khai báo thành tích SV 5 Tốt]
    C -->|Tập thể| E[Khai báo thành tích Tập thể Tiên tiến]
    D --> F[Tải lên Minh chứng - PDF/Ảnh]
    E --> F
    F --> G[Nộp hồ sơ]
    G --> H[Cán bộ: Xem danh sách & Chấm điểm]
    H --> I{Kết quả?}
    I -->|Đạt| J[Cập nhật trạng thái: Đã duyệt]
    I -->|Thiếu| K[Yêu cầu bổ sung minh chứng]
    I -->|Không đạt| L[Cập nhật trạng thái: Từ chối]
    K --> F
    J --> M[Admin: Xem thống kê & Xuất báo cáo]
```

---

## 2. 🗄️ Sơ đồ Quan hệ Thực thể (ERD)

```mermaid
erDiagram
    %% 1. NGƯỜI DÙNG & PHÂN QUYỀN
    ROLES ||--o{ USERS : "phân quyền"
    USERS ||--|| STUDENT_PROFILES : "thông tin SV"
    USERS ||--|| STAFF_PROFILES : "thông tin Cán bộ"
    
    %% 2. CẤU HÌNH ĐỘNG (JSON-based)
    CRITERIA_CONFIGS ||--o{ APPLICATION_CONFIGS : "dùng cho"
    
    %% 3. HỒ SƠ & KỲ XÉT DUYỆT
    PERIODS ||--o{ APPLICATIONS : "có hồ sơ"
    APPLICATION_CONFIGS ||--o{ APPLICATIONS : "thuộc loại cấu hình"
    USERS ||--o{ APPLICATIONS : "nộp"
    
    %% 4. MINH CHỨNG & FILE METADATA
    APPLICATIONS ||--o{ PROOFS : "chứa tham chiếu"
    FILES ||--o{ PROOFS : "file đính kèm"
    
    %% ================= THUỘC TÍNH BẢNG =================

    ROLES {
        int id PK
        string role_name "Ten_Quyen"
        string permissions_json "Quyen_dang_JSON"
    }

    USERS {
        int id PK
        string username
        string password
        int role_id FK
    }

    STUDENT_PROFILES {
        int user_id PK, FK
        string student_code
        string full_name
        string class_name
        string department_name
    }

    STAFF_PROFILES {
        int user_id PK, FK
        string staff_code
        string full_name
        string job_title
    }

    CRITERIA_CONFIGS {
        int id PK
        string name "Ten_Bo_Tieu_Chi"
        string content_json "Cay_tieu_chuan_JSON"
    }

    APPLICATION_CONFIGS {
        int id PK
        string name "Ten_Loai_Ho_So"
        string type "Ca_nhan_hoac_Tap_the"
        string level "Khoa_hoac_Truong"
        int criteria_config_id FK
    }

    PERIODS {
        int id PK
        string name "Dot_Xet_Duyet"
        date start_date
        date end_date
        string status "Trang_thai_Mo_Dong"
    }
    
    APPLICATIONS {
        int id PK
        int user_id FK
        int period_id FK
        int app_config_id FK
        string target_code "Ma_SV_hoac_Tap_the"
        float total_score "Tong_Diem"
        string status "Trang_thai_Ho_so"
        datetime submitted_at
    }
    
    FILES {
        int id PK
        string original_name
        string server_name
        string file_path
        string file_type "Loai_File"
        int size_bytes
        string url
        string display_type "Kieu_Hien_thi"
    }

    PROOFS {
        int id PK
        int application_id FK
        int file_id FK "Co_the_NULL"
        string criteria_item_ref "Tham_chieu_cau_hoi"
        string answer_text "Cau_tra_loi"
        string status "Trang_thai_phai_duyet"
    }
```

---

## 3. 📜 SQL Script cho Supabase (PostgreSQL)

Dưới đây là mã SQL khởi tạo cho Supabase, bao gồm các bảng, ràng buộc và dữ liệu mẫu:

```sql
-- 1. Khoa & Lớp học
CREATE TABLE khoa (
    id SERIAL PRIMARY KEY,
    ma_khoa VARCHAR(20) UNIQUE NOT NULL,
    ten_khoa VARCHAR(200) NOT NULL
);

CREATE TABLE lop_hoc (
    id SERIAL PRIMARY KEY,
    ma_lop VARCHAR(20) UNIQUE NOT NULL,
    ten_lop VARCHAR(100) NOT NULL,
    khoa_id INT REFERENCES khoa(id)
);

-- 2. Người dùng & Hồ sơ
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    ho_ten VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    ma_sv VARCHAR(20) UNIQUE,
    role VARCHAR(20) CHECK (role IN ('student','monitor','reviewer','admin')),
    lop_id INT REFERENCES lop_hoc(id)
);

-- 3. Kỳ xét duyệt & Tiêu chí
CREATE TABLE ky_xet_duyet (
    id SERIAL PRIMARY KEY,
    ten_ky VARCHAR(200) NOT NULL,
    loai VARCHAR(20) CHECK (loai IN ('hk1','hk2','ca_nam')),
    trang_thai VARCHAR(20) CHECK (trang_thai IN ('upcoming','active','closed'))
);

CREATE TABLE tieu_chi (
    id SERIAL PRIMARY KEY,
    ten_tieu_chi VARCHAR(200) NOT NULL,
    loai_doi_tuong VARCHAR(20) CHECK (loai_doi_tuong IN ('individual','collective','both')),
    thu_tu INT DEFAULT 0
);

-- 4. Hồ sơ & Minh chứng
CREATE TABLE ho_so (
    id SERIAL PRIMARY KEY,
    ma_ho_so VARCHAR(20) UNIQUE NOT NULL,
    sinh_vien_id INT REFERENCES users(id),
    ky_xet_duyet_id INT REFERENCES ky_xet_duyet(id),
    trang_thai VARCHAR(20) DEFAULT 'draft'
);

CREATE TABLE minh_chung (
    id SERIAL PRIMARY KEY,
    ho_so_id INT REFERENCES ho_so(id) ON DELETE CASCADE,
    tieu_chi_id INT REFERENCES tieu_chi(id),
    ten_thanh_tich TEXT NOT NULL,
    file_url TEXT -- Đường dẫn file lưu trên Supabase Storage
);
```

---

## 4. 📁 Lưu trữ File (Supabase Storage)

- **Bucket**: `minh-chung`
- **Quy tắc**:
  - File được tổ chức theo cấu trúc: `ho-so/{ho_so_id}/{timestamp}_{filename}`
  - Truy cập thông qua **Signed Upload URL** để đảm bảo bảo mật.
  - File công khai (Public URL) chỉ cấp cho các hồ sơ đã được duyệt hoặc đang trong quá trình xét duyệt.

---

## 4. 🛠️ Công cụ đề xuất

1.  **Xem Sơ đồ (Mermaid)**:
    *   Sử dụng **VS Code** và cài Extension: **"Markdown Preview Mermaid Support"**.
    *   Hoặc dán code vào [Mermaid Live Editor](https://mermaid.live/).

2.  **Quản lý Cơ sở dữ liệu**:
    *   **MySQL Workbench**: Vẽ ERD tự động từ Database và chạy SQL.
    *   **DBeaver**: Giao diện đẹp, dễ dùng cho người mới.

3.  **Vẽ quy trình (Workflow)**:
    *   **Draw.io (diagrams.net)**: Miễn phí và cực kỳ chuyên nghiệp.
