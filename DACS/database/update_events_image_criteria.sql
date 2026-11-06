-- ================================================================
-- MIGRATION: Bổ sung Cột Ảnh Sự kiện & Tiêu chí SV5T + Tập thể
-- Chạy trên Supabase Dashboard → SQL Editor
-- ================================================================

ALTER TABLE events ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS criteria_ids INT[] DEFAULT '{}';
