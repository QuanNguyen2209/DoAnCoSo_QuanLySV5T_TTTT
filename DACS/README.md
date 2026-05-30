# 🚀 Hệ thống Quản lý Sinh viên 5 Tốt & Tập thể Tiên tiến

Hệ thống quản lý quy trình đăng ký, xét duyệt danh hiệu "Sinh viên 5 Tốt" và "Tập thể Tiên tiến" tích hợp Hồ sơ điện tử (E-Profile).

> **Cập nhật:** 21/04/2026
> **Trạng thái:** Đã hoàn thành Module Cán bộ xét duyệt (Reviewer).

---

## 🗺️ Tổng quan Hệ thống (System Overview)

Dự án được xây dựng theo kiến trúc **Full-stack Monolith tách biệt**:
- **Frontend**: Next.js 15 (App Router), Tailwind CSS, Lucide Icons, Framer Motion.
- **Backend**: Node.js + Express, Supabase SDK.
- **Database**: Supabase (PostgreSQL) với RLS (Row Level Security).

### Luồng hoạt động chính (Current Flow)
1. **Sinh viên**: 
   - Hoàn thiện **Hồ sơ điện tử (E-Profile)** (Thông tin cá nhân, đào tạo, Đoàn-Đảng, điểm GPA/ĐRL tự nhập).
   - Đăng ký hồ sơ xét duyệt (`ho_so`) theo từng kỳ.
   - Tải lên minh chứng (`minh_chung`) cho từng tiêu chí dưới dạng link file hoặc file upload.
2. **Cán bộ (Reviewer)**: 
   - Tiếp nhận hồ sơ từ các lớp/khoa được phân công.
   - Kiểm tra tính xác thực của minh chứng.
   - Phê duyệt, từ chối hoặc yêu cầu bổ sung thông tin.
3. **Admin**:
   - Quản lý kỳ xét duyệt, bộ tiêu chí đánh giá.
   - Quản lý danh mục Khoa/Lớp và tài khoản hệ thống.

---

## 📂 Cấu trúc Thư mục (For AI Agents)

### Backend (`/backend`)
- `server.js`: Điểm khởi chạy API.
- `routes/`: Định nghĩa endpoint (Auth, Users, HoSo, MinhChung, UserProfiles).
- `controllers/`: Xử lý logic nghiệp vụ và tương tác database.
- `middleware/`: Bảo mật (JWT Auth), phân quyền.
- `config/db.js`: Kết nối Supabase Service Role.

### Frontend (`/frontend`)
- `src/app/(dashboard)`: Chứa layout dashboard và các trang chức năng.
  - `student/profile`: Trang E-Profile sinh viên.
  - `reviewer/applications`: Trang danh sách xét duyệt của cán bộ.
- `src/services/`: Các API call wrapper (axios).
- `src/lib/authStore.ts`: Quản lý trạng thái đăng nhập (Zustand).

---

## 🛠️ Đề xuất chức năng Cán bộ xét duyệt (Reviewer Module)

Để hỗ trợ Cán bộ quản lý theo từng lớp/sinh viên hiệu quả, luồng xử lý được đề xuất như sau:

### 1. Phân quyền quản lý (Assignment)
- **Cơ chế**: Thêm bảng `reviewer_assignments (reviewer_id, lop_id)` để xác định cán bộ nào quản lý lớp nào.
- **API**: Backend sẽ lọc danh sách hồ sơ (`ho_so`) dựa trên `lop_id` mà cán bộ đó được phân công trong bảng quản lý.

### 2. Luồng xét duyệt chi tiết (Review Flow)
- **Bước 1 (Dashboard)**: Cán bộ thấy danh sách hồ sơ "Chờ duyệt" thuộc các lớp mình quản lý.
- **Bước 2 (Kiểm tra)**: 
  - Xem chi tiết hồ sơ sinh viên (E-Profile).
  - Duyệt qua từng minh chứng (Mở link file, đối chiếu thông tin).
- **Bước 3 (Ra quyết định)**: 
  - **Duyệt**: Chuyển trạng thái `approved`.
  - **Từ chối**: Chuyển trạng thái `rejected` + Ghi chú lý do.
  - **Yêu cầu bổ sung**: Chuyển trạng thái `rejected` (hoặc `need_info`) + Phản hồi chi tiết phần cần sửa.

### 3. Ghi vết (Auditing)
- Mọi hành động duyệt/từ chối phải được ghi vào bảng `lich_su_ho_so` kèm `nguoi_thuc_hien_id`.

---

## 🤖 Hướng dẫn dành cho Agent AI phát triển tiếp
1. **Kiểm tra Database**: Đảm bảo bảng `ho_so` và `minh_chung` đã có dữ liệu mẫu.
2. **Logic Backend**:
   - Cập nhật `hoSoController.js` để hỗ trợ lọc theo danh sách lớp được phân công.
   - Tạo endpoint `PUT /api/ho-so/:id/review` để cập nhật trạng thái và ghi log.
3. **Giao diện Frontend**:
   - Sử dụng trang `src/app/(dashboard)/reviewer/applications/page.tsx`.
   - Thay thế dữ liệu mock bằng API call thật.
   - Xây dựng Modal hoặc trang chi tiết để xem minh chứng và nhập phản hồi.

---
*Dự án đang được phát triển tích cực. Vui lòng cập nhật tài liệu này khi có thay đổi lớn về kiến trúc.*
