-- ================================================================
-- MIGRATION: Quản lý Sự kiện & Điểm danh
-- Paste vào Supabase Dashboard → SQL Editor → New Query → Run
-- ================================================================

-- ----------------------------------------------------------------
-- 1. Bảng Sự kiện (Events)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS events (
    id                  SERIAL PRIMARY KEY,
    title               VARCHAR(500) NOT NULL,
    description         TEXT,
    location            VARCHAR(500),
    image_url           TEXT,                    -- Link ảnh banner sự kiện
    criteria_ids        INT[] DEFAULT '{}',      -- Danh sách ID tiêu chí SV5T & Tập thể
    start_time          TIMESTAMPTZ NOT NULL,
    end_time            TIMESTAMPTZ NOT NULL,
    max_participants    INT DEFAULT 0,           -- 0 = không giới hạn
    status              VARCHAR DEFAULT 'draft'
                        CHECK (status IN ('draft','published','closed')),
    attendance_code     VARCHAR(100),            -- Mã điểm danh (plain text, sinh ngẫu nhiên)
    is_attendance_open  BOOLEAN DEFAULT FALSE,
    attendance_expires_at TIMESTAMPTZ,
    created_by          INT REFERENCES users(id),
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger tự động cập nhật updated_at
DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------
-- 2. Bảng Đăng ký sự kiện (Event Registrations)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS event_registrations (
    id              SERIAL PRIMARY KEY,
    event_id        INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    student_id      INT NOT NULL REFERENCES users(id),
    registered_at   TIMESTAMPTZ DEFAULT NOW(),
    status          VARCHAR DEFAULT 'registered'
                    CHECK (status IN ('registered','attended','cancelled')),
    attended_at     TIMESTAMPTZ,
    UNIQUE (event_id, student_id)
);

-- Index để tăng tốc truy vấn
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_student_id ON event_registrations(student_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);

-- RLS (tùy chọn, backend dùng service_role_key nên bypass RLS)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
