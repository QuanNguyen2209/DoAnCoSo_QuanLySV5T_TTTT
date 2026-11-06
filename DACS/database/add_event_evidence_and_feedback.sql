-- ================================================================
-- NÂNG CẤP (2026-11-06): Sự kiện làm minh chứng + Góp ý theo từng tiêu chí
-- Chạy trong Supabase Dashboard → SQL Editor. Chạy lại nhiều lần vẫn an toàn.
-- ================================================================

-- 1. Liên kết "sự kiện đã điểm danh" ↔ minh chứng của 1 tiêu chí
CREATE TABLE IF NOT EXISTS minh_chung_su_kien (
    id              SERIAL PRIMARY KEY,
    minh_chung_id   INT NOT NULL REFERENCES minh_chung(id) ON DELETE CASCADE,
    event_id        INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (minh_chung_id, event_id)
);
CREATE INDEX IF NOT EXISTS idx_mc_su_kien_minh_chung ON minh_chung_su_kien(minh_chung_id);
CREATE INDEX IF NOT EXISTS idx_mc_su_kien_event      ON minh_chung_su_kien(event_id);
ALTER TABLE minh_chung_su_kien ENABLE ROW LEVEL SECURITY; -- backend dùng service role nên vẫn truy cập được

-- 2. Góp ý của cán bộ cho từng tiêu chí
ALTER TABLE minh_chung ADD COLUMN IF NOT EXISTS nhan_xet    TEXT;
ALTER TABLE minh_chung ADD COLUMN IF NOT EXISTS can_bo_sung BOOLEAN DEFAULT FALSE;

-- 3. Index phục vụ gợi ý sự kiện (tìm các sự kiện SV đã điểm danh)
CREATE INDEX IF NOT EXISTS idx_event_reg_student_status ON event_registrations(student_id, status);
