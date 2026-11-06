-- ================================================================
-- CẬP NHẬT: THÊM BẢNG REVIEWER_ASSIGNMENTS
-- Bảng phân công cán bộ quản lý theo lớp
-- Chạy lệnh này trong Supabase Dashboard → SQL Editor
-- ================================================================

CREATE TABLE IF NOT EXISTS reviewer_assignments (
    id              SERIAL PRIMARY KEY,
    reviewer_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lop_id          INT NOT NULL REFERENCES lop_hoc(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(reviewer_id, lop_id)
);

-- Bật RLS
ALTER TABLE reviewer_assignments ENABLE ROW LEVEL SECURITY;

-- Index để tăng tốc truy vấn
CREATE INDEX IF NOT EXISTS idx_reviewer_assignments_reviewer ON reviewer_assignments(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviewer_assignments_lop ON reviewer_assignments(lop_id);
