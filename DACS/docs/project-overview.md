# 📚 Tài Liệu Tổng Quan Dự Án (ĐACS)

> Cập nhật lần cuối: 2026-03-25

---

## 1. 🗺️ Kiến Trúc Tổng Quan

Dự án sử dụng mô hình **Full-stack Monolith phân tầng** với Frontend và Backend được tách biệt hoàn toàn.

```
d:\ĐACS\
├── frontend/         ← Next.js 15 (React 19 + TypeScript + Tailwind CSS)
├── backend/          ← Node.js + Express (REST API + Supabase SDK)
├── database/         ← Scripts khởi tạo Supabase (PostgreSQL)
└── docs/             ← Tài liệu dự án (file này)
```

---

## 2. 🖥️ Frontend (`/frontend`)

### Công Nghệ Cốt Lõi
| Công nghệ | Phiên bản | Mục đích |
|---|---|---|
| Next.js | 15.x | Framework chính (App Router) |
| React | 19.x | UI Library |
| TypeScript | 5.x | Type-safe JavaScript |
| Tailwind CSS | 4.x | Styling |

### Thư Viện Bổ Trợ Đã Cài
| Thư viện | Mục đích |
|---|---|
| `axios` | Gọi API đến Backend |
| `@tanstack/react-query` | Quản lý server state, cache, loading |
| `lucide-react` | Bộ icon đẹp và nhẹ |
| `framer-motion` | Animation, transition mượt mà |
| `clsx` + `tailwind-merge` | Gọp class Tailwind linh hoạt |
| `react-hook-form` | Quản lý Form, validate phía client |
| `zod` | Validate schema dữ liệu |
| `zustand` | Quản lý Global State đơn giản |

### Cấu Trúc Thư Mục (Hiện tại)
```
frontend/src/
├── app/
│   ├── (dashboard)/          ← Route Group: các trang trong Web App (có Sidebar/Header)
│   │   ├── layout.tsx        ← Layout dùng chung (Sidebar + Header)
│   │   ├── page.tsx          ← Trang chủ Dashboard (/)
│   │   ├── register-review/  ← Đăng ký xét duyệt (Sinh viên & Lớp trưởng)
│   │   ├── profile-records/  ← Hồ sơ đăng ký (theo dõi trạng thái)
│   │   ├── reviewer/
│   │   │   └── applications/ ← Xét duyệt hồ sơ (Cán bộ Đoàn-Hội)
│   │   └── admin/
│   │       ├── periods/      ← Quản lý kỳ xét duyệt (Admin)
│   │       ├── criteria/     ← Quản lý tiêu chí đánh giá (Admin)
│   │       └── system/       ← Quản lý tài khoản & phân quyền (Admin)
│   ├── login/
│   │   └── page.tsx          ← Trang đăng nhập (ngoài layout dashboard)
│   ├── layout.tsx            ← Root layout (font, metadata)
│   └── globals.css
└── components/
    └── layout/
        ├── Sidebar.tsx       ← Thanh điều hướng trái (3 nhóm: SV, Cán bộ, Admin)
        └── Header.tsx        ← Thanh header trên cùng (thông tin user, thông báo)
```

### Cách Chạy
```bash
cd frontend
npm install
npm run dev     # Chạy tại http://localhost:3000
npm run build   # Build production
```

---

## 3. ⚙️ Backend (`/backend`)

### Công Nghệ Cốt Lõi
| Công nghệ | Phiên bản | Mục đích |
|---|---|---|
| Node.js | LTS | Runtime |
| Express | 5.x | Web Framework |
| @supabase/supabase-js | 2.x | SDK kết nối Supabase (PostgreSQL) |
| dotenv | 17.x | Quản lý biến môi trường (.env) |
| cors | 2.x | Cho phép Frontend gọi API |
| nodemon | 3.x | Tự restart server khi đổi code (dev) |

### Cấu Trúc Thư Mục (Layered Architecture)
```
backend/
├── config/
│   └── db.js         ← Cấu hình kết nối Supabase (Service Role Client)
├── controllers/      ← Logic xử lý nghiệp vụ (gọi Model, trả Response)
├── models/           ← Các hàm truy vấn SQL tương ứng mỗi Entity
├── routes/           ← Định nghĩa API Endpoints (URL mapping)
├── .env              ← Biến môi trường (KHÔNG commit lên Git)
├── .env.example      ← Mẫu .env để chia sẻ với team
├── package.json      ← Khai báo thư viện và scripts
└── server.js         ← Điểm khởi chạy (import routes, middleware)
```

### Cách Chạy
```bash
cd backend
npm install
# Điền mật khẩu DB vào .env trước
npm run dev     # Chạy tại http://localhost:5000 (nodemon)
npm run start   # Chạy production
```

### Biến Môi Trường (`.env`)
```env
PORT=5000
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
```

---

## 4. 🗄️ Database (`/database`)

- **Hệ quản trị**: Supabase (PostgreSQL)
- **Script khởi tạo**: `database/supabase_schema.sql`
- **Bảng chính**: `users`, `khoa`, `lop_hoc`, `ky_xet_duyet`, `tieu_chi`, `ho_so`, `minh_chung`

### Cách Khởi Tạo DB
```sql
-- Chạy file này trong MySQL Workbench hoặc terminal mysql
source d:/ĐACS/database/init.sql;
```

---

## 5. 🎨 UI/UX Đã Xây Dựng

### Phân Quyền Giao Diện
Hệ thống phân quyền giao diện theo 4 vai trò chính:

| Vai trò | Trang có thể truy cập |
|---|---|
| **Sinh viên** | Trang chủ, Đăng ký xét duyệt (Cá nhân), Hồ sơ của tôi |
| **Lớp trưởng / Bí thư** | Trang chủ, Đăng ký xét duyệt (Tập thể - có thêm chọn Cấp Khoa/Trường), Hồ sơ của tôi |
| **Cán bộ Đoàn - Hội** | Xét duyệt hồ sơ (Bảng danh sách, Duyệt/Từ chối/Yêu cầu bổ sung) |
| **Quản trị viên (Admin)** | Kỳ xét duyệt, Tiêu chí đánh giá, Quản lý hệ thống (tài khoản, phân quyền) |

### Các Trang Đã Hoàn Thành
| Đường dẫn | Trang | Vai trò |
|---|---|---|
| `/login` | Đăng nhập (4 vai trò) | Tất cả |
| `/` | Trang chủ Dashboard (banner, tiến độ) | SV, Lớp trưởng |
| `/register-review` | Đăng ký xét duyệt (Step 1→2→3) | SV, Lớp trưởng |
| `/profile-records` | Hồ sơ của tôi (bảng trạng thái) | SV, Lớp trưởng |
| `/reviewer/applications` | Xét duyệt hồ sơ + thống kê | Cán bộ Đoàn-Hội |
| `/admin/periods` | Quản lý kỳ xét duyệt | Admin |
| `/admin/criteria` | Cấu hình tiêu chí đánh giá | Admin |
| `/admin/system` | Quản lý tài khoản & phân quyền | Admin |

---

## 6. 🔗 Kết Nối Frontend ↔ Backend

- Frontend gọi API qua `axios` đến `http://localhost:5000`
- Cấu hình base URL trong `frontend/src/lib/` (tạo file `axios.ts`)
- Backend bật CORS để chấp nhận request từ `http://localhost:3000`

---

## 7. 📋 Kế Hoạch Phát Triển Tiếp Theo

### Giai đoạn 1 – Nền tảng (Đã xong ✅)
- [x] Khởi tạo Next.js Frontend
- [x] Cài đặt thư viện UI và State Management
- [x] Khởi tạo Express Backend
- [x] Cấu hình kết nối Database

### Giai đoạn 2 – Giao Diện (Đã xong ✅)
- [x] Trang Đăng nhập (4 vai trò)
- [x] Dashboard chính sau khi login (Sidebar + Header + Layout)
- [x] Trang Đăng ký xét duyệt (Cá nhân & Tập thể, form đa bước)
- [x] Trang Hồ sơ đăng ký (bảng theo dõi trạng thái)
- [x] Trang Xét duyệt hồ sơ (Cán bộ Đoàn-Hội)
- [x] Các trang Admin: Kỳ xét duyệt, Tiêu chí, Quản lý hệ thống

### Giai đoạn 3 – Core API & Supabase Integration (Đang thực hiện 🔄)
- [x] Chuyển đổi MySQL sang Supabase (PostgreSQL)
- [x] Xây dựng Controllers & Routes cho các thực thể chính
- [ ] API Auth: Đăng ký / Đăng nhập (Sử dụng Supabase Auth hoặc JWT)
- [ ] API Hồ sơ: CRUD hoàn chỉnh
- [ ] API Minh chứng: Tải lên trực tiếp Supabase Storage qua Signed URL
- [ ] API Xét duyệt: Workflow duyệt hồ sơ

### Giai đoạn 4 – Tích hợp & Hoàn thiện
- [ ] Tích hợp React Query để fetch dữ liệu thật từ API
- [ ] Quản lý State đăng nhập bằng Zustand (lưu token)
- [ ] Phân quyền động theo vai trò (Route Protection)
- [ ] Validation form với `zod` + `react-hook-form`
- [ ] Responsive Design cho mobile

---

## 8. 💡 Ghi Chú Kỹ Thuật

- **Port mặc định**: Frontend `:3000`, Backend `:5000`
- **Tất cả code Backend dùng CommonJS** (`require/module.exports`) vì Express 5 không yêu cầu ESM.
- **Frontend dùng ESM** (`import/export`) theo chuẩn Next.js.
- File `.env` KHÔNG được commit lên Git, chỉ commit `.env.example`.
- Cấu trúc Route Group `(dashboard)` cho phép Sidebar/Header render chung mà không ảnh hưởng đến URL path.
