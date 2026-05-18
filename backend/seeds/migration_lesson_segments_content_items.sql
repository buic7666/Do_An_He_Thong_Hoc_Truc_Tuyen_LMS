-- ========================================
-- Migration: Extend lesson_segments for custom ordering and mixed content blocks
-- ========================================

ALTER TABLE lesson_segments
  ADD COLUMN IF NOT EXISTS order_index INT UNSIGNED NOT NULL DEFAULT 1 AFTER duration,
  ADD COLUMN IF NOT EXISTS content_items JSON NULL AFTER title;

-- Backfill existing rows
UPDATE lesson_segments
SET order_index = id
WHERE order_index IS NULL OR order_index = 0;

UPDATE lesson_segments
SET content_items = JSON_ARRAY()
WHERE content_items IS NULL;

ALTER TABLE lesson_segments
  MODIFY COLUMN content_items JSON NOT NULL;

CREATE INDEX idx_lesson_segments_lesson_order ON lesson_segments (lesson_id, order_index);
