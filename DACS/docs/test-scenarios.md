# 🧪 Kịch Bản Kiểm Thử Chức Năng (Manual Test Scenarios)

Tài liệu này mô tả các kịch bản kiểm thử (Test Scenarios) cho hệ thống **Scholastic Kinetic**, bao gồm các luồng nghiệp vụ chính cho Sinh viên, Cán bộ xét duyệt và Quản trị viên.

---

## 1. 🎓 Nhóm Chức Năng: Sinh Viên & Lớp Trưởng

### TC-01: Đăng ký danh hiệu "Sinh viên 5 Tốt" (Cá nhân)
- **Mục tiêu**: Kiểm tra luồng đăng ký hồ sơ cá nhân.
- **Các bước**:
    1. Đăng nhập với vai trò Sinh viên.
    2. Truy cập trang "Đăng ký xét duyệt".
    3. Chọn đối tượng "Sinh viên 5 Tốt".
    4. Chọn kỳ xét duyệt đang mở (ví dụ: Học kỳ 2 2024-2025).
    5. Nhập thông tin minh chứng (Tên thành tích, Tiêu chí: Học tập tốt, File minh chứng).
    6. Nhấn "Lưu bản nháp".
- **Kết quả mong đợi**: Hồ sơ được tạo thành công ở trạng thái "Bản nháp", xuất hiện trong danh sách "Hồ sơ của tôi".

### TC-02: Nộp hồ sơ chính thức
- **Mục tiêu**: Chuyển trạng thái từ Bản nháp sang Chờ duyệt.
- **Các bước**:
    1. Truy cập "Hồ sơ của tôi".
    2. Chọn hồ sơ đang ở trạng thái "Bản nháp".
    3. Kiểm tra lại thông tin và minh chứng.
    4. Nhấn "Nộp hồ sơ ngay".
- **Kết quả mong đợi**: Trạng thái hồ sơ chuyển sang "Đang chờ duyệt". Sinh viên không được phép sửa/xóa hồ sơ này nữa.

### TC-03: Đăng ký "Tập thể Tiên tiến" (Lớp trưởng)
- **Mục tiêu**: Kiểm tra luồng đăng ký cho tập thể (Chi Đoàn/Lớp).
- **Các bước**:
    1. Đăng nhập với vai trò Lớp trưởng.
    2. Chọn đối tượng "Tập thể Tiên tiến".
    3. Chọn cấp xét duyệt (Cấp Khoa hoặc Cấp Trường).
    4. Nhập các minh chứng về hoạt động phong trào của lớp.
    5. Tiến hành nộp hồ sơ.
- **Kết quả mong đợi**: Hồ sơ tập thể được tạo đúng loại và cấp xét duyệt.

---

## 2. 🏛️ Nhóm Chức Năng: Cán Bộ Xét Duyệt (Reviewer)

### TC-04: Xét duyệt hồ sơ (Duyệt/Từ chối)
- **Mục tiêu**: Kiểm tra chức năng thẩm định hồ sơ của cán bộ.
- **Các bước**:
    1. Đăng nhập vai trò Cán bộ Đoàn - Hội.
    2. Truy cập "Xét duyệt hồ sơ".
    3. Mở xem chi tiết một hồ sơ "Đang chờ duyệt".
    4. Kiểm tra các file minh chứng đính kèm.
    5. Nhấn "Duyệt" hoặc "Từ chối" kèm ghi chú phản hồi.
- **Kết quả mong đợi**: Trạng thái hồ sơ cập nhật chính xác (Đã duyệt/Cần bổ sung). Sinh viên nhận được thông báo/cập nhật trạng thái.

### TC-05: Thống kê đơn vị
- **Mục tiêu**: Kiểm tra tính chính xác của dữ liệu thống kê.
- **Các bước**:
    1. Truy cập trang "Thống kê đơn vị".
    2. Chọn Khoa và Kỳ xét duyệt.
    3. Kiểm tra số lượng hồ sơ Đạt/Không đạt/Đang chờ.
- **Kết quả mong đợi**: Biểu đồ và bảng dữ liệu hiển thị đúng con số thực tế trong DB.

---

## 3. ⚙️ Nhóm Chức Năng: Quản Trị Viên (Admin)

### TC-06: Quản lý Kỳ xét duyệt
- **Mục tiêu**: Đóng/Mở đợt xét duyệt cho toàn trường.
- **Các bước**:
    1. Đăng nhập vai trò Admin.
    2. Truy cập "Quản lý Kỳ xét duyệt".
    3. Tạo kỳ mới: Nhập tên, thời gian bắt đầu/kết thúc.
    4. Chuyển trạng thái một kỳ cũ từ "Đang mở" (Active) sang "Đã đóng" (Closed).
- **Kết quả mong đợi**: Khi kỳ bị đóng, sinh viên không thể tạo mới hồ sơ cho kỳ đó.

### TC-07: Cấu hình Tiêu chí đánh giá
- **Mục tiêu**: Cập nhật bộ tiêu chuẩn 5 tốt.
- **Các bước**:
    1. Truy cập "Tiêu chí đánh giá".
    2. Chỉnh sửa mô tả của tiêu chí "Hội nhập tốt".
    3. Thêm một tiêu chí phụ mới.
- **Kết quả mong đợi**: Thay đổi hiển thị ngay lập tức trong select-box của trang đăng ký sinh viên.

---

## 4. 🛡️ Kiểm thử Trường hợp Ngoại lệ (Edge Cases)

| Mã TC | Kịch bản | Mong đợi |
|---|---|---|
| TC-08 | Tải file minh chứng > 10MB | Hệ thống báo lỗi "Dung lượng vượt quá giới hạn" |
| TC-09 | Tải file sai định dạng (ví dụ: .exe) | Hệ thống chỉ chấp nhận PDF, JPG, PNG |
| TC-10 | Nộp hồ sơ khi đã hết hạn kỳ xét duyệt | Nút "Nộp hồ sơ" bị ẩn hoặc báo lỗi "Kỳ xét duyệt đã đóng" |
| TC-11 | Sinh viên truy cập vào link Admin | Chuyển hướng về trang Dashboard hoặc báo lỗi "Không có quyền" |
| TC-12 | Xóa hồ sơ đã nộp thành công | Không cho phép xóa (nút xóa bị ẩn) |

---

## 5. 🛠️ Quy trình thực hiện (Checklist)

- [ ] Chuẩn bị dữ liệu mẫu (Seeding Database).
- [ ] Kiểm tra hiển thị giao diện trên Desktop & Mobile.
- [ ] Kiểm tra kết nối API và xử lý lỗi (Loading/Error handling).
- [ ] Kiểm tra lưu trữ file trên Supabase Storage.
