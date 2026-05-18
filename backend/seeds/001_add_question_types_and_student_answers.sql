-- ========================================================================
-- MIGRATION: Thêm 4 loại câu hỏi + StudentAnswer table
-- ========================================================================
-- Ngày: 2026-04-30
-- Mục đích: Hỗ trợ 4 loại câu hỏi (MC, T/F, SA, ESSAY) + AI chấm ESSAY
-- ========================================================================

-- ============ BƯỚC 1: Cập nhật bảng questions ============

-- 1.1: Sửa ENUM 'type' để thêm TRUE_FALSE, SHORT_ANSWER (bỏ SOURCE_CODE)
ALTER TABLE questions 
MODIFY COLUMN type ENUM('MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'ESSAY') 
DEFAULT 'MULTIPLE_CHOICE' 
COMMENT 'Loại câu hỏi: trắc nghiệm, đúng/sai, trả lời ngắn, tự luận';

-- 1.2: Thêm column 'is_published' để track trạng thái công khai
ALTER TABLE questions 
ADD COLUMN is_published BOOLEAN DEFAULT FALSE 
COMMENT 'Câu hỏi đã được công khai cho học viên chưa?' 
AFTER type;

-- 1.3: Thêm index cho is_published
CREATE INDEX idx_questions_is_published ON questions(is_published);

-- 1.4: Thêm index cho type (để query các câu hỏi theo loại nhanh hơn)
CREATE INDEX idx_questions_type ON questions(type);

-- ============ BƯỚC 2: Tạo bảng student_answers (MỚI) ============

CREATE TABLE IF NOT EXISTS student_answers (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'ID duy nhất',
  
  -- Foreign Keys
  attempt_id BIGINT UNSIGNED NOT NULL COMMENT 'ID lần làm quiz (FK → student_quiz_attempts)',
  question_id BIGINT UNSIGNED NOT NULL COMMENT 'ID câu hỏi (FK → questions)',
  
  -- Loại và giá trị trả lời
  answer_type ENUM('MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'ESSAY') NOT NULL 
    COMMENT 'Loại câu hỏi',
  answer_value JSON COMMENT 'Giá trị trả lời (tuỳ theo type)',
  
  -- Kết quả chấm
  score DECIMAL(5, 2) DEFAULT NULL COMMENT 'Điểm số (0-100). Null nếu chưa chấm.',
  grading_details JSON COMMENT 'Chi tiết chấm điểm từ AI (dành cho ESSAY)',
  ai_feedback TEXT COMMENT 'Feedback từ AI (dành cho ESSAY)',
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian tạo',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Lần cập nhật cuối cùng',
  
  -- Constraints
  FOREIGN KEY (attempt_id) REFERENCES student_quiz_attempts(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  
  -- Indexes
  INDEX idx_attempt_id (attempt_id),
  INDEX idx_question_id (question_id),
  INDEX idx_answer_type (answer_type),
  UNIQUE INDEX unique_attempt_question (attempt_id, question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Lưu trữ câu trả lời của học viên khi làm quiz (hỗ trợ 4 loại)';

-- ============ BƯỚC 3: Xóa column cũ (nếu có) ============
-- Nếu bảng student_quiz_attempts có column 'answers_json' cũ, có thể xóa:
-- ALTER TABLE student_quiz_attempts DROP COLUMN answers_json;

-- ============ HOÀN TẤT ============
-- Kiểm tra:
-- SELECT * FROM questions LIMIT 1; -- Verify type ENUM và is_published
-- SELECT * FROM student_answers LIMIT 1; -- Verify bảng mới
-- SHOW COLUMNS FROM student_answers; -- Xem cấu trúc

