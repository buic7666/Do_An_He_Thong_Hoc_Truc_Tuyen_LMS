-- ========================================
-- Migration: Create lesson_segments table
-- ========================================

CREATE TABLE IF NOT EXISTS lesson_segments (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  lesson_id BIGINT UNSIGNED NOT NULL,
  start_time INT UNSIGNED NOT NULL COMMENT 'Start time in seconds',
  end_time INT UNSIGNED NOT NULL COMMENT 'End time in seconds',
  duration INT UNSIGNED NOT NULL COMMENT 'Duration in seconds (endTime - startTime)',
  title VARCHAR(255) COMMENT 'Optional segment title',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
  INDEX idx_lesson_id (lesson_id),
  INDEX idx_start_time (start_time)
);
