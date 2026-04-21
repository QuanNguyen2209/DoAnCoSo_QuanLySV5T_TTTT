# 📋 Tổng quan Dự án — Hệ thống Quản lý SV5T & TTTT

> **Cập nhật lần cuối:** 21/04/2026  
> **Phiên bản:** 2.0

---

## 1. Giới thiệu

Hệ thống quản lý danh hiệu **Sinh viên 5 Tốt (SV5T)** và **Tập thể Sinh viên Tiên tiến (TTTT)** dành cho trường Đại học HUTECH. Hỗ trợ quy trình nộp hồ sơ → xét duyệt → phê duyệt trực tuyến hoàn chỉnh.

---

## 2. Công nghệ

| Layer | Công nghệ |
|-------|-----------|
| **Frontend** | Next.js 15, React, TypeScript, TailwindCSS, Framer Motion |
| **Backend** | Express.js (Node.js), REST API |
| **Database** | Supabase (PostgreSQL) |
| **Storage** | Supabase Storage (bucket: `minh-chung`) |
| **Auth** | JWT Token + bcrypt |

---

## 3. Kiến trúc hệ thống

```
DACS/
├── backend/                    # Express API Server (port 5000)
│   ├── config/db.js            # Kết nối Supabase
│   ├── middleware/              # authMiddleware (JWT verify)
│   ├── controllers/            # Business logic
│   │   ├── authController.js       # Đăng nhập/Đăng ký
│   │   ├── hoSoController.js       # CRUD hồ sơ
│   │   ├── minhChungController.js  # Minh chứng + Multi-file upload
│   │   ├── reviewerController.js   # Xét duyệt cán bộ
│   │   ├── tieuChiController.js    # Tiêu chí (cha-con, phân loại)
│   │   ├── userProfileController.js # E-Profile sinh viên
│   │   ├── khoaController.js       # Quản lý khoa
│   │   ├── lopHocController.js     # Quản lý lớp
│   │   ├── kyXetDuyetController.js # Kỳ xét duyệt
│   │   └── usersController.js      # Quản lý người dùng
│   ├── routes/                 # Route definitions
│   └── server.js               # Entry point
│
├── frontend/                   # Next.js 15 App (port 3000)
│   └── src/app/(dashboard)/
│       ├── page.tsx                # Trang chủ Dashboard
│       ├── student/                # Module Sinh viên
│       │   ├── profile/            # Hồ sơ điện tử (E-Profile)
│       │   ├── register/           # Đăng ký xét duyệt
│       │   └── records/            # Danh sách + Chi tiết hồ sơ
│       │       └── [id]/           # Chi tiết: textbox + multi-file upload
│       ├── reviewer/               # Module Cán bộ xét duyệt
│       │   ├── applications/       # Danh sách hồ sơ cần duyệt
│       │   │   └── [id]/           # Chi tiết xét duyệt (mô tả + gallery ảnh)
│       │   └── statistics/         # Thống kê theo lớp
│       └── admin/                  # Module Admin
│           ├── criteria/           # Quản lý tiêu chí
│           ├── periods/            # Quản lý kỳ xét duyệt
│           ├── classes/            # Quản lý lớp/khoa
│           ├── statistics/         # Thống kê tổng
│           └── system/             # Cấu hình hệ thống
│
├── database/                   # SQL scripts
│   ├── supabase_schema.sql         # Schema chính (11 bảng)
│   ├── add_user_profiles.sql       # Bảng E-Profile
│   ├── add_reviewer_assignments.sql # Phân công cán bộ
│   ├── add_collective_criteria.sql  # Tiêu chí Tập thể Tiên tiến
│   ├── setup_test_accounts.sql      # Tài khoản test
│   └── seed_test_data.sql           # Dữ liệu mẫu
│
└── docs/                       # Tài liệu
    ├── project-overview.md         # File này
    ├── architecture-and-db.md      # Kiến trúc & DB
    └── test-scenarios.md           # Kịch bản test
```

---

## 4. Database Schema (11 bảng)

| # | Bảng | Mô tả |
|---|------|-------|
| 1 | `khoa` | Danh sách khoa |
| 2 | `lop_hoc` | Danh sách lớp (FK → khoa) |
| 3 | `users` | Người dùng (4 roles: sinh_vien, lop_truong, can_bo, admin) |
| 4 | `user_profiles` | E-Profile sinh viên (GPA, rèn luyện, ngoại ngữ...) |
| 5 | `ky_xet_duyet` | Kỳ xét duyệt (HK1, HK2, cả năm) |
| 6 | `tieu_chi` | Tiêu chí đánh giá (phân cấp cha-con, phân loại individual/collective) |
| 7 | `ho_so` | Hồ sơ đăng ký (trạng thái: draft → pending → approved/rejected) |
| 8 | `minh_chung` | Minh chứng (text mô tả + metadata file) |
| 9 | `minh_chung_files` | File minh chứng (multi-file, tối đa 4 file/minh chứng) |
| 10 | `lich_su_ho_so` | Lịch sử xử lý hồ sơ |
| 11 | `reviewer_assignments` | Phân công cán bộ quản lý lớp |

### Sơ đồ quan hệ

```
khoa ──< lop_hoc ──< users ──< ho_so ──< minh_chung ──< minh_chung_files
                        │          │          │
                        │          │          └── tieu_chi (cha-con)
                        │          │
                        │          └── ky_xet_duyet
                        │          └── lich_su_ho_so
                        │
                        └── user_profiles
                        └── reviewer_assignments
```

---

## 5. Hệ thống phân quyền (RBAC)

| Role | Mã DB | Quyền hạn |
|------|-------|-----------|
| **Sinh viên** | `sinh_vien` | Xem E-Profile, đăng ký xét duyệt SV5T, nộp minh chứng |
| **Lớp trưởng** | `lop_truong` | Tất cả quyền SV + nộp hồ sơ Tập thể Tiên tiến |
| **Cán bộ** | `can_bo` | Xem/duyệt/từ chối hồ sơ các lớp được phân công, thống kê |
| **Admin** | `admin` | Quản lý tiêu chí, kỳ xét duyệt, lớp/khoa, thống kê toàn hệ thống |

---

## 6. API Endpoints

### Auth
| Method | Path | Mô tả |
|--------|------|-------|
| POST | `/api/auth/register` | Đăng ký |
| POST | `/api/auth/login` | Đăng nhập → JWT token |

### Hồ sơ
| Method | Path | Mô tả |
|--------|------|-------|
| GET | `/api/ho-so?sinh_vien_id=x` | Lấy danh sách hồ sơ |
| GET | `/api/ho-so/:id` | Chi tiết (kèm minh_chung + minh_chung_files) |
| POST | `/api/ho-so` | Tạo hồ sơ nháp |
| POST | `/api/ho-so/:id/submit` | Nộp hồ sơ |
| GET | `/api/ho-so/stats/:userId` | Thống kê cá nhân |

### Minh chứng & Multi-file
| Method | Path | Mô tả |
|--------|------|-------|
| POST | `/api/minh-chung/upsert-criteria` | Tạo/cập nhật mô tả theo tiêu chí |
| POST | `/api/minh-chung/upload-url` | Lấy signed URL upload Supabase |
| POST | `/api/minh-chung/:id/files` | Thêm file (tối đa 4) |
| DELETE | `/api/minh-chung/files/:fileId` | Xóa 1 file |
| DELETE | `/api/minh-chung/:id` | Xóa minh chứng |

### Cán bộ xét duyệt
| Method | Path | Mô tả |
|--------|------|-------|
| GET | `/api/reviewer/applications` | Danh sách hồ sơ được phân công |
| GET | `/api/reviewer/applications/:id` | Chi tiết (kèm E-Profile + gallery ảnh) |
| PUT | `/api/reviewer/applications/:id/review` | Duyệt/từ chối |
| GET | `/api/reviewer/stats` | Thống kê theo lớp |

### Tiêu chí
| Method | Path | Mô tả |
|--------|------|-------|
| GET | `/api/tieu-chi?loai_doi_tuong=x` | Lấy cây tiêu chí (lọc individual/collective) |
| POST | `/api/tieu-chi` | Tạo tiêu chí |
| PUT | `/api/tieu-chi/:id` | Cập nhật |
| DELETE | `/api/tieu-chi/:id` | Vô hiệu hóa (soft delete) |

### Khác
| Method | Path | Mô tả |
|--------|------|-------|
| CRUD | `/api/khoa` | Quản lý khoa |
| CRUD | `/api/lop-hoc` | Quản lý lớp |
| CRUD | `/api/ky-xet-duyet` | Quản lý kỳ xét duyệt |
| CRUD | `/api/user-profiles` | E-Profile sinh viên |
| GET | `/api/users` | Danh sách người dùng |

---

## 7. Tiêu chí đánh giá

### Sinh viên 5 Tốt (individual) — 5 tiêu chuẩn × 3 tiêu chí con

| # | Tiêu chuẩn | Tiêu chí con |
|---|------------|--------------|
| 1 | Đạo đức tốt | Chấp hành pháp luật, Tham gia NQ chính trị, Đấu tranh tiêu cực |
| 2 | Học tập tốt | ĐTB ≥ 2.0, Không liệt môn, Tham gia NCKH |
| 3 | Thể lực tốt | Đạt chuẩn GDTC, Tham gia TDTT, Không chất cấm |
| 4 | Tình nguyện tốt | Chiến dịch tình nguyện, Hiến máu, Hoạt động cộng đồng |
| 5 | Hội nhập tốt | Chứng chỉ ngoại ngữ/tin học, CLB kỹ năng, Giao lưu quốc tế |

### Tập thể Tiên tiến (collective) — 3 tiêu chuẩn (theo HUTECH 2024-2025)

| # | Tiêu chuẩn | Điểm | Số tiêu chí con |
|---|------------|------|-----------------|
| 1 | Học tập | 40 điểm | 5 (ĐTBNH, sinh hoạt chuyên đề, NCKH, SV5T Trường, SV5T Thành) |
| 2 | Rèn luyện | 35 điểm | 4 (rèn luyện tốt, tình nguyện, hiến máu, VHVN-TDTT) |
| 3 | Kỹ năng | 25 điểm | 3 (hội thảo, ngoại khóa, khởi nghiệp) |

---

## 8. Quy trình nghiệp vụ

### Sinh viên nộp hồ sơ
```
[Chọn kỳ + loại danh hiệu] → [Tạo hồ sơ nháp] → [Mô tả thành tích từng tiêu chí]
  → [Upload 3-4 ảnh/file minh chứng mỗi tiêu chí] → [Nộp hồ sơ] → Trạng thái: pending
```

### Cán bộ xét duyệt
```
[Xem danh sách hồ sơ theo lớp] → [Mở chi tiết: E-Profile + mô tả + gallery ảnh]
  → [Phê duyệt / Từ chối (kèm nhận xét)] → Ghi log lịch sử
```

---

## 9. Tài khoản Test

| Vai trò | Email | Mật khẩu |
|---------|-------|----------|
| Sinh viên | `sinhvien@test.edu.vn` | `Test1234@` |
| Cán bộ | `canbo@test.edu.vn` | `Test1234@` |
| Admin | `admin@test.edu.vn` | `Test1234@` |
| SV chính | `nguyenlebaoquan1404@gmail.com` | `Quan2209@` |

> Chi tiết kịch bản test: xem `docs/test-scenarios.md`

---

## 10. Lịch sử thay đổi

### Phiên 1 (20/04/2026)
- Khôi phục kết nối Supabase mới
- Chạy lại schema, seed data
- Kiểm tra Admin Dashboard: quản lý khoa, lớp, kỳ xét duyệt, tiêu chí

### Phiên 2 (21/04/2026 — Sáng)
- Xây dựng hệ thống tiêu chí phân cấp cha-con (`parent_id`)
- Hỗ trợ phân loại tiêu chí theo `loai_doi_tuong` (individual/collective)
- Giao diện quản lý tiêu chí Admin với drag-drop tree

### Phiên 3 (21/04/2026 — Chiều)
- **Module Reviewer (Cán bộ):** Backend + Frontend hoàn chỉnh
  - Bảng `reviewer_assignments` phân công cán bộ theo lớp
  - API: danh sách, chi tiết, phê duyệt/từ chối, thống kê
  - UI: danh sách hồ sơ (bộ lọc, tìm kiếm), chi tiết (E-Profile, minh chứng, lịch sử)
- Tạo tài khoản test (SV, CB, Admin) + dữ liệu mẫu
- Test E2E: xem danh sách → chi tiết → phê duyệt → cập nhật thống kê ✅

### Phiên 4 (21/04/2026 — Tối)
- **Multi-file upload per criteria:**
  - Bảng `minh_chung_files` (tối đa 4 file/minh chứng)
  - API: `upsert-criteria`, `POST /:id/files`, `DELETE /files/:fileId`
  - UI sinh viên: textbox mô tả inline + kéo thả multi-file cho từng tiêu chí con
  - UI reviewer: hiển thị mô tả text + gallery ảnh thumbnail
- **Tiêu chí Tập thể Tiên tiến:**
  - Thêm 3 tiêu chuẩn + 12 tiêu chí con theo HUTECH 2024-2025
  - Phân loại `collective` trong `tieu_chi.loai_doi_tuong`
- **Sửa lỗi:**
  - Fix `loai_doi_tuong` mapping: thống nhất `individual`/`collective` xuyên suốt
  - Fix API tiêu chí: bộ lọc `loai_doi_tuong` hoạt động đúng
  - Cập nhật `supabase_schema.sql` theo schema thực tế (11 bảng)

---

## 11. Hướng phát triển tiếp theo

- [ ] Dashboard Admin: quản lý phân công cán bộ (gán reviewer → lớp)
- [ ] Thông báo: push notification khi hồ sơ được duyệt/từ chối
- [ ] Xuất báo cáo: Excel/PDF danh sách SV đạt danh hiệu
- [ ] Xem ảnh minh chứng fullscreen (lightbox gallery)
- [ ] Chức năng bình luận giữa cán bộ và sinh viên trên hồ sơ
