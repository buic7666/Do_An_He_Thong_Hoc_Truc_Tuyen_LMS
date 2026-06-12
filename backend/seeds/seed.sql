-- ========================================
-- LMS Database Seed Data (MVP Week 1)
-- ========================================

-- Clear existing data (optional, comment out if you want to keep old data)
-- DELETE FROM progress;
-- DELETE FROM enrollments;
-- DELETE FROM lessons;
-- DELETE FROM courses;
-- DELETE FROM users;

-- ========================================
-- 1. SEED USERS (1 Admin, 1 Teacher, 2 Students)
-- ========================================
INSERT INTO users (name, email, password_hash, role, created_at, updated_at) VALUES
('Admin System', 'admin@lms.local', '$2a$10$/slaPN4C99IPkJ3myIJQw.WFO8RUx3VmOBsxG53NwlshluHmCVvH2', 'admin', NOW(), NOW()),
('Nguyễn Văn A (Teacher)', 'teacher@lms.local', '$2a$10$/slaPN4C99IPkJ3myIJQw.WFO8RUx3VmOBsxG53NwlshluHmCVvH2', 'teacher', NOW(), NOW()),
('Trần Văn B (Student)', 'student1@lms.local', '$2a$10$/slaPN4C99IPkJ3myIJQw.WFO8RUx3VmOBsxG53NwlshluHmCVvH2', 'student', NOW(), NOW()),
('Lê Thị C (Student)', 'student2@lms.local', '$2a$10$/slaPN4C99IPkJ3myIJQw.WFO8RUx3VmOBsxG53NwlshluHmCVvH2', 'student', NOW(), NOW());

-- Demo login password for all seeded users: password123
-- Always regenerate unique hashes in production.

-- ========================================
-- 2. SEED COURSES (2 Courses by Teacher)
-- ========================================
INSERT INTO courses (title, description, price, instructor_id, created_at, updated_at) VALUES
(
  'Lập trình Node.js cơ bản',
  'Khóa học giới thiệu Node.js, Express, MySQL từ đầu. Phù hợp với người mới bắt đầu.',
  0.00,
  2,
  NOW(),
  NOW()
),
(
  'React.js - Xây dựng giao diện web hiện đại',
  'Học React từ cơ bản đến nâng cao. Bao gồm hooks, state management, project thực tế.',
  0.00,
  2,
  NOW(),
  NOW()
);

-- ========================================
-- 3. SEED LESSONS (5 lessons cho mỗi course)
-- ========================================
-- Course 1: Node.js (id=1)
INSERT INTO lessons (course_id, title, video_url, content, order_index, created_at, updated_at) VALUES
(1, 'Giới thiệu Node.js và cài đặt môi trường', 'https://www.youtube.com/watch?v=TlB_eWDSMt4', 'Tìm hiểu Node.js là gì, cách cài đặt Node.js và npm trên Windows/Mac/Linux.', 1, NOW(), NOW()),
(1, 'Tạo server HTTP đầu tiên với Node.js', 'https://www.youtube.com/watch?v=Oe421EPjeBE', 'Viết code tạo server HTTP đơn giản, hiểu request/response, cách listen port.', 2, NOW(), NOW()),
(1, 'Giới thiệu Express Framework', 'https://www.youtube.com/watch?v=L72fhGm1tfE', 'Express là gì, tại sao sử dụng Express, cách setup Express project.', 3, NOW(), NOW()),
(1, 'Routing và Middleware trong Express', 'https://www.youtube.com/watch?v=SccSCuHhOw0', 'Hiểu về routes (GET/POST/PUT/DELETE), middleware, order của middleware.', 4, NOW(), NOW()),
(1, 'Kết nối MySQL và CRUD operations', 'https://www.youtube.com/watch?v=7S_tz1z_5bA', 'Cách kết nối Node.js với MySQL, viết các thao tác CRUD cơ bản.', 5, NOW(), NOW());

-- Course 2: React (id=2)
INSERT INTO lessons (course_id, title, video_url, content, order_index, created_at, updated_at) VALUES
(2, 'React là gì? Cấu trúc một React App', 'https://www.youtube.com/watch?v=Ke90Tje7VS0', 'Giới thiệu tổng quan về React, JSX, virtual DOM, cách cài đặt create-react-app.', 1, NOW(), NOW()),
(2, 'Components và Props trong React', 'https://www.youtube.com/watch?v=IYvD9oBCuJI', 'Hiểu về functional components, class components, props, cách truyền dữ liệu giữa components.', 2, NOW(), NOW()),
(2, 'State và Hooks (useState, useEffect)', 'https://www.youtube.com/watch?v=O6P86uwfdR0', 'Quản lý state trong React, các hooks cơ bản, side effects, cleanup.', 3, NOW(), NOW()),
(2, 'Conditional Rendering và Lists', 'https://www.youtube.com/watch?v=9U3IhLAnSxM', 'Cách render theo điều kiện, render danh sách với map(), key prop.', 4, NOW(), NOW()),
(2, 'Gọi API từ React Component', 'https://www.youtube.com/watch?v=cuEtnrL9-H0', 'Fetch API, axios, useEffect để gọi API, xử lý loading, error states.', 5, NOW(), NOW());

-- ========================================
-- 4. SEED ENROLLMENTS (Student đăng ký khóa học)
-- ========================================
INSERT INTO enrollments (user_id, course_id, status, created_at, updated_at) VALUES
-- Student 1 đăng ký 2 khóa học
(3, 1, 'active', NOW(), NOW()),
(3, 2, 'active', NOW(), NOW()),
-- Student 2 đăng ký 1 khóa học
(4, 1, 'active', NOW(), NOW());

-- ========================================
-- 5. SEED PROGRESS (Tiến độ học của student)
-- ========================================
-- Student 1 (id=3) progress trong Course 1 (Node.js)
INSERT INTO progress (user_id, lesson_id, is_completed, completed_at, created_at, updated_at) VALUES
(3, 1, 1, NOW(), NOW(), NOW()),
(3, 2, 1, NOW(), NOW(), NOW()),
(3, 3, 0, NULL, NOW(), NOW()),
(3, 4, 0, NULL, NOW(), NOW()),
(3, 5, 0, NULL, NOW(), NOW());

-- Student 1 (id=3) progress trong Course 2 (React)
INSERT INTO progress (user_id, lesson_id, is_completed, completed_at, created_at, updated_at) VALUES
(3, 6, 1, NOW(), NOW(), NOW()),
(3, 7, 0, NULL, NOW(), NOW()),
(3, 8, 0, NULL, NOW(), NOW()),
(3, 9, 0, NULL, NOW(), NOW()),
(3, 10, 0, NULL, NOW(), NOW());

-- Student 2 (id=4) progress trong Course 1 (Node.js)
INSERT INTO progress (user_id, lesson_id, is_completed, completed_at, created_at, updated_at) VALUES
(4, 1, 1, NOW(), NOW(), NOW()),
(4, 2, 0, NULL, NOW(), NOW()),
(4, 3, 0, NULL, NOW(), NOW()),
(4, 4, 0, NULL, NOW(), NOW()),
(4, 5, 0, NULL, NOW(), NOW());

-- ========================================
-- VERIFICATION QUERIES (Kiểm tra dữ liệu)
-- ========================================
-- Xem toàn bộ users
SELECT 'Users:' as Info;
SELECT id, name, email, role FROM users;

-- Xem toàn bộ courses
SELECT 'Courses:' as Info;
SELECT id, title, instructor_id, price FROM courses;

-- Xem toàn bộ lessons
SELECT 'Lessons:' as Info;
SELECT id, course_id, title, order_index FROM lessons;

-- Xem toàn bộ enrollments
SELECT 'Enrollments:' as Info;
SELECT id, user_id, course_id, status FROM enrollments;

-- Xem tiến độ
SELECT 'Progress:' as Info;
SELECT u.name, c.title, l.title as lesson_title, p.is_completed 
FROM progress p
JOIN users u ON p.user_id = u.id
JOIN lessons l ON p.lesson_id = l.id
JOIN courses c ON l.course_id = c.id
ORDER BY u.id, c.id, l.order_index;

-- ========================================
-- CALCULATE COMPLETION PERCENTAGE
-- ========================================
SELECT 'Progress Percentage:' as Info;
SELECT 
  u.name as Student,
  c.title as Course,
  ROUND(COUNT(CASE WHEN p.is_completed = 1 THEN 1 END) * 100 / COUNT(*), 2) as completion_percent
FROM progress p
JOIN users u ON p.user_id = u.id
JOIN lessons l ON p.lesson_id = l.id
JOIN courses c ON l.course_id = c.id
GROUP BY u.id, c.id
ORDER BY u.id, c.id;
