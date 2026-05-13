-- ========================================
-- Migration: Create lesson_labels table
-- ========================================

CREATE TABLE IF NOT EXISTS lesson_labels (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  lesson_id BIGINT UNSIGNED NOT NULL,
  teacher_id BIGINT UNSIGNED NOT NULL,
  content TEXT NOT NULL,
  label_type ENUM('note', 'warning', 'tip') NOT NULL DEFAULT 'note' COMMENT 'Label category for visual emphasis',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_lesson_labels_lesson
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
  CONSTRAINT fk_lesson_labels_teacher
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_lesson_labels_lesson_id (lesson_id),
  INDEX idx_lesson_labels_teacher_id (teacher_id),
  INDEX idx_lesson_labels_label_type (label_type)
);
