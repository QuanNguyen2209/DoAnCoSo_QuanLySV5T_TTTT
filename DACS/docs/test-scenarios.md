# 📋 Kịch bản Test (Test Scenarios)

> **Cập nhật:** 21/04/2026
> **Dự án:** Quản lý Sinh viên 5 Tốt & Tập thể Tiên tiến

---

## 1. 🔑 Tài khoản Test

| Vai trò | Họ tên | Email | Mật khẩu | Ghi chú |
|---|---|---|---|---|
| **Sinh viên** | Sinh Vien Test | `sinhvien@test.edu.vn` | `Test1234@` | MSSV: SV_TEST_01, Lớp: CNTT01 |
| **Cán bộ Đoàn-Hội** | Cán bộ Test | `canbo@test.edu.vn` | `Test1234@` | Quản lý tất cả lớp hiện có |
| **Admin** | Admin Test | `admin@test.edu.vn` | `Test1234@` | Toàn quyền quản trị |
| **Sinh viên (chủ dự án)** | Nguyễn Lê Nguyên Quân | `nguyenlebaoquan1404@gmail.com` | `Quan2209@` | MSSV: 2380601830 |

### SQL Thiết lập Tài khoản
Chạy lần lượt các file SQL sau trong **Supabase Dashboard → SQL Editor**:
1. `database/setup_reviewer_test.sql` — Tạo bảng phân công + cấu hình cán bộ
2. `database/setup_test_accounts.sql` — Cập nhật role Admin + gán lớp cho SV test

---

## 2. 🧪 Kịch bản Test: Sinh viên

### TC-SV-01: Đăng nhập sinh viên
- **Mục tiêu:** Xác minh sinh viên đăng nhập thành công.
- **Bước thực hiện:**
  1. Truy cập `http://localhost:3000/login`
  2. Chọn vai trò "Sinh viên"
  3. Nhập email/mật khẩu → Click "Đăng nhập"
- **Kết quả mong đợi:** Chuyển hướng về Trang chủ Dashboard, sidebar hiện menu Sinh viên.

### TC-SV-02: Hồ sơ điện tử (E-Profile)
- **Mục tiêu:** Kiểm tra CRUD thông tin hồ sơ điện tử.
- **Bước thực hiện:**
  1. Đăng nhập SV → Click "Hồ sơ điện tử" trên sidebar
  2. Điền các khối thông tin: Cá nhân, Liên hệ, Đào tạo, Công việc, Đoàn-Đảng
  3. Nhập Điểm GPA, Điểm rèn luyện
  4. Click "Lưu hồ sơ"
  5. Tải lại trang (F5)
- **Kết quả mong đợi:** Dữ liệu được lưu và hiển thị lại chính xác sau khi reload.

### TC-SV-03: Đăng ký xét duyệt
- **Mục tiêu:** Kiểm tra luồng tạo hồ sơ đăng ký.
- **Bước thực hiện:**
  1. Click "Đăng ký xét duyệt" → Chọn "Sinh viên 5 Tốt"
  2. Điền thông tin thành tích, chọn tiêu chí, tải file minh chứng
  3. Tiếp tục → Nộp hồ sơ
- **Kết quả mong đợi:** Hồ sơ được tạo với trạng thái `pending` hoặc `draft`.

### TC-SV-04: Xem hồ sơ của tôi
- **Mục tiêu:** Kiểm tra danh sách hồ sơ đã nộp.
- **Bước thực hiện:**
  1. Click "Hồ sơ của tôi" trên sidebar
  2. Kiểm tra bảng hiển thị mã hồ sơ, danh hiệu, trạng thái
- **Kết quả mong đợi:** Hiển thị đúng danh sách hồ sơ của sinh viên đang đăng nhập.

---

## 3. 🧪 Kịch bản Test: Cán bộ Đoàn-Hội (Reviewer)

### TC-CB-01: Đăng nhập cán bộ
- **Mục tiêu:** Xác minh cán bộ đăng nhập và thấy đúng menu.
- **Bước thực hiện:**
  1. Truy cập `http://localhost:3000/login`
  2. Chọn vai trò "Cán bộ Đoàn - Hội"
  3. Nhập `canbo@test.edu.vn` / `Test1234@` → Đăng nhập
- **Kết quả mong đợi:** Sidebar hiện menu "Xét duyệt hồ sơ" và "Thống kê đơn vị".

### TC-CB-02: Xem danh sách hồ sơ cần xét duyệt
- **Mục tiêu:** Cán bộ thấy danh sách hồ sơ từ các lớp được phân công.
- **Bước thực hiện:**
  1. Click "Xét duyệt hồ sơ" trên sidebar
  2. Kiểm tra bảng hiển thị tên SV, mã hồ sơ, lớp, trạng thái
  3. Thử lọc theo trạng thái: "Chờ duyệt", "Đã duyệt", "Từ chối"
  4. Thử tìm kiếm theo tên hoặc MSSV
- **Kết quả mong đợi:** Hiển thị đúng hồ sơ thuộc lớp được phân công, bộ lọc hoạt động chính xác.

### TC-CB-03: Xem chi tiết và duyệt hồ sơ
- **Mục tiêu:** Kiểm tra luồng duyệt hồ sơ từ A-Z.
- **Bước thực hiện:**
  1. Click "Chấm hồ sơ" trên 1 dòng bất kỳ
  2. Kiểm tra trang chi tiết: E-Profile SV, danh sách minh chứng, lịch sử
  3. Click "Phê duyệt" → Nhập nhận xét → Xác nhận
  4. Quay lại danh sách, kiểm tra trạng thái đã đổi
- **Kết quả mong đợi:** Trạng thái hồ sơ đổi thành "Đã phê duyệt", lịch sử ghi nhận hành động.

### TC-CB-04: Từ chối hồ sơ
- **Mục tiêu:** Kiểm tra luồng từ chối hồ sơ.
- **Bước thực hiện:**
  1. Mở chi tiết 1 hồ sơ đang chờ duyệt
  2. Click "Từ chối" → Nhập lý do (bắt buộc) → Xác nhận
- **Kết quả mong đợi:** Trạng thái đổi thành "Đã từ chối", phản hồi hiển thị đúng.

### TC-CB-05: Thống kê đơn vị
- **Mục tiêu:** Kiểm tra trang thống kê theo lớp.
- **Bước thực hiện:**
  1. Click "Thống kê đơn vị" trên sidebar
  2. Kiểm tra số liệu tổng (Tổng hồ sơ, Đã duyệt, Không đạt)
  3. Kiểm tra tiến độ từng lớp (progress bar)
- **Kết quả mong đợi:** Số liệu phản ánh đúng trạng thái thực tế trong CSDL.

---

## 4. 🧪 Kịch bản Test: Admin

### TC-AD-01: Đăng nhập Admin
- **Mục tiêu:** Xác minh admin đăng nhập và thấy đúng menu.
- **Bước thực hiện:**
  1. Đăng nhập `admin@test.edu.vn` / `Test1234@`
- **Kết quả mong đợi:** Sidebar hiện đầy đủ: Kỳ xét duyệt, Tiêu chí, Lớp & Khoa, Hệ thống, Thống kê.

### TC-AD-02: Quản lý kỳ xét duyệt
- **Mục tiêu:** CRUD kỳ xét duyệt.
- **Bước thực hiện:**
  1. Click "Kỳ xét duyệt" → Thêm mới → Điền thông tin → Lưu
  2. Sửa 1 kỳ → Lưu
  3. Xóa 1 kỳ
- **Kết quả mong đợi:** Các thao tác CRUD hoạt động chính xác.

### TC-AD-03: Quản lý tiêu chí đánh giá
- **Mục tiêu:** CRUD tiêu chí.
- **Bước thực hiện:**
  1. Click "Tiêu chí đánh giá" → Thêm/Sửa/Xóa tiêu chí
- **Kết quả mong đợi:** Tiêu chí cập nhật đúng trong CSDL.

### TC-AD-04: Quản lý Khoa/Lớp
- **Mục tiêu:** CRUD Khoa và Lớp.
- **Bước thực hiện:**
  1. Click "Quản lý Lớp & Khoa" → Thêm/Sửa/Xóa
- **Kết quả mong đợi:** Dữ liệu cập nhật đúng.

---

## 5. 🔄 Kịch bản Test Tích hợp (End-to-End)

### TC-E2E-01: Luồng hoàn chỉnh: SV nộp → CB duyệt
1. Đăng nhập SV → Cập nhật E-Profile → Tạo hồ sơ đăng ký → Nộp hồ sơ
2. Đăng nhập CB → Xem danh sách → Mở chi tiết → Phê duyệt
3. Đăng nhập lại SV → Kiểm tra hồ sơ đã chuyển sang "Đã duyệt"
- **Kết quả mong đợi:** Toàn bộ luồng hoạt động mượt mà, dữ liệu đồng bộ chính xác giữa các vai trò.

---

*File này sẽ được cập nhật khi có thêm tính năng mới hoặc kịch bản test bổ sung.*
