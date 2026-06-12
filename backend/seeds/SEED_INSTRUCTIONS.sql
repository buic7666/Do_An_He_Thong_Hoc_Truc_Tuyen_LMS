-- ========================================
-- HƯỚNG DẪN: Cách chạy Seed Data
-- ========================================

-- Cách 1: Copy toàn bộ nội dung file seed.sql vào phpMyAdmin
-- 1. Mở phpMyAdmin -> chọn database lms_db
-- 2. Vào tab SQL
-- 3. Copy toàn bộ nội dung file này vào text area
-- 4. Click "Go" để chạy

-- Cách 2: Chạy từ command line (nếu có MySQL CLI)
-- mysql -u root -p lms_db < seed.sql

-- ========================================
-- PASSWORD HASH NOTE
-- ========================================
-- Password hash trong file này là placeholder: 
-- $2b$10$abcdefghijklmnopqrstuvwxyz1234567890

-- Để dùng password thực tế, tạo bcrypt hash từ "password123" 
-- Sử dụng trong Node.js:
-- const bcrypt = require('bcryptjs');
-- const hashedPassword = await bcrypt.hash('password123', 10);
-- Copy hash vào file seed.sql

-- Hoặc online tool: https://bcrypt-generator.com/
-- Input: password123
-- Output sẽ là một hash dạng: $2b$10$...(60 ký tự)

-- ========================================
-- TEST DATA SUMMARY
-- ========================================
-- Users:
--   - admin@lms.local (role: admin)
--   - teacher@lms.local (role: teacher)
--   - student1@lms.local (role: student) - đăng ký 2 khóa học
--   - student2@lms.local (role: student) - đăng ký 1 khóa học

-- Courses:
--   1. "Lập trình Node.js cơ bản" - 5 lessons
--   2. "React.js - Xây dựng giao diện web hiện đại" - 5 lessons

-- Enrollments:
--   - student1 đang học (active) cả 2 khóa
--   - student2 đang học (active) khóa Node.js

-- Progress:
--   - student1: hoàn thành 2/5 lessons trong Node.js, 1/5 lessons trong React
--   - student2: hoàn thành 1/5 lessons trong Node.js

-- ========================================
-- VERIFICATION QUERIES
-- ========================================
-- Sau khi chạy seed, chạy những query này để kiểm tra:

-- 1. Kiểm tra users
SELECT id, name, email, password_hash, role FROM users;

-- 2. Kiểm tra courses của teacher
SELECT c.id, c.title, u.name as instructor, c.price 
FROM courses c
JOIN users u ON c.instructor_id = u.id;

-- 3. Kiểm tra lessons của mỗi course
SELECT c.title as course, l.order_index, l.title as lesson_title
FROM lessons l
JOIN courses c ON l.course_id = c.id
ORDER BY c.id, l.order_index;

-- 4. Kiểm tra ai đã đăng ký khóa nào
SELECT u.name as student, c.title as course, e.status
FROM enrollments e
JOIN users u ON e.user_id = u.id
JOIN courses c ON e.course_id = c.id;

-- 5. Kiểm tra tiến độ học của mỗi student
SELECT 
  u.name as student,
  c.title as course,
  COUNT(CASE WHEN p.is_completed = 1 THEN 1 END) as completed_lessons,
  COUNT(*) as total_lessons,
  ROUND(COUNT(CASE WHEN p.is_completed = 1 THEN 1 END) * 100 / COUNT(*), 2) as progress_percent
FROM progress p
JOIN users u ON p.user_id = u.id
JOIN lessons l ON p.lesson_id = l.id
JOIN courses c ON l.course_id = c.id
GROUP BY u.id, c.id
ORDER BY u.id, c.id;

-- ========================================
-- QUICK TEST FOR DAY 2 API
-- ========================================
-- Khi backend đã chạy, test những API này bằng Postman:

-- 1. Login student1
-- POST http://localhost:3000/auth/login
-- Body: {"email": "student1@lms.local", "password": "password123"}
-- Expected: token trả về

-- 2. Get courses (không cần login)
-- GET http://localhost:3000/courses
-- Expected: danh sách 2 courses

-- 3. Get course detail
-- GET http://localhost:3000/courses/1
-- Expected: chi tiết course 1 + list 5 lessons

-- 4. Get my enrollments (cần token)
-- GET http://localhost:3000/me/enrollments
-- Header: Authorization: Bearer [token từ login]
-- Expected: danh sách 2 khóa học đã đăng ký

-- 5. Get progress of course
-- GET http://localhost:3000/courses/1/progress
-- Header: Authorization: Bearer [token từ login]
-- Expected: progress percentage của student1 trong course 1

-- ========================================
-- RESET DATABASE (nếu muốn làm lại)
-- ========================================
-- DELETE FROM progress;
-- DELETE FROM enrollments;
-- DELETE FROM lessons;
-- DELETE FROM courses;
-- DELETE FROM users;
-- ALTER TABLE users AUTO_INCREMENT = 1;
-- ALTER TABLE courses AUTO_INCREMENT = 1;
-- ALTER TABLE lessons AUTO_INCREMENT = 1;
-- ALTER TABLE enrollments AUTO_INCREMENT = 1;
-- ALTER TABLE progress AUTO_INCREMENT = 1;
