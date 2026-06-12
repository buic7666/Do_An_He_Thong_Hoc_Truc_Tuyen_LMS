-- ========================================
-- Seed: lesson_segments (YouTube video segments)
-- ========================================

-- Course 1: Node.js - Lesson 1 (Giới thiệu Node.js và cài đặt môi trường)
INSERT INTO lesson_segments (lesson_id, start_time, end_time, duration, title, created_at, updated_at) VALUES
(1, 0, 300, 300, 'Introduction: Node.js là gì?', NOW(), NOW()),
(1, 300, 600, 300, 'Installation on Windows', NOW(), NOW()),
(1, 600, 900, 300, 'Installation on Mac', NOW(), NOW()),
(1, 900, 1200, 300, 'Installation on Linux', NOW(), NOW()),
(1, 1200, 1500, 300, 'Verify Installation & Setup', NOW(), NOW());

-- Course 1: Node.js - Lesson 2 (Tạo server HTTP đầu tiên)
INSERT INTO lesson_segments (lesson_id, start_time, end_time, duration, title, created_at, updated_at) VALUES
(2, 0, 300, 300, 'HTTP Protocol Basics', NOW(), NOW()),
(2, 300, 600, 300, 'Create First HTTP Server', NOW(), NOW()),
(2, 600, 900, 300, 'Request & Response Objects', NOW(), NOW()),
(2, 900, 1200, 300, 'Listen on Port', NOW(), NOW());

-- Course 1: Node.js - Lesson 3 (Giới thiệu Express)
INSERT INTO lesson_segments (lesson_id, start_time, end_time, duration, title, created_at, updated_at) VALUES
(3, 0, 240, 240, 'Why Express?', NOW(), NOW()),
(3, 240, 480, 240, 'Install Express', NOW(), NOW()),
(3, 480, 720, 240, 'Hello World with Express', NOW(), NOW()),
(3, 720, 960, 240, 'Server Configuration', NOW(), NOW());

-- Course 1: Node.js - Lesson 4 (Routing & Middleware)
INSERT INTO lesson_segments (lesson_id, start_time, end_time, duration, title, created_at, updated_at) VALUES
(4, 0, 360, 360, 'HTTP Methods (GET/POST/PUT/DELETE)', NOW(), NOW()),
(4, 360, 720, 360, 'Route Parameters', NOW(), NOW()),
(4, 720, 1080, 360, 'Middleware Concept', NOW(), NOW()),
(4, 1080, 1440, 360, 'Custom Middleware', NOW(), NOW());

-- Course 1: Node.js - Lesson 5 (MySQL & CRUD)
INSERT INTO lesson_segments (lesson_id, start_time, end_time, duration, title, created_at, updated_at) VALUES
(5, 0, 300, 300, 'MySQL Connection Setup', NOW(), NOW()),
(5, 300, 600, 300, 'CREATE (Insert)', NOW(), NOW()),
(5, 600, 900, 300, 'READ (Select)', NOW(), NOW()),
(5, 900, 1200, 300, 'UPDATE & DELETE', NOW(), NOW());

-- Course 2: React - Lesson 6 (React Basics)
INSERT INTO lesson_segments (lesson_id, start_time, end_time, duration, title, created_at, updated_at) VALUES
(6, 0, 300, 300, 'What is React?', NOW(), NOW()),
(6, 300, 600, 300, 'JSX Syntax', NOW(), NOW()),
(6, 600, 900, 300, 'Virtual DOM', NOW(), NOW()),
(6, 900, 1200, 300, 'Create React App Setup', NOW(), NOW());

-- Course 2: React - Lesson 7 (Components & Props)
INSERT INTO lesson_segments (lesson_id, start_time, end_time, duration, title, created_at, updated_at) VALUES
(7, 0, 240, 240, 'Functional vs Class Components', NOW(), NOW()),
(7, 240, 480, 240, 'Props Basic', NOW(), NOW()),
(7, 480, 720, 240, 'Props in Practice', NOW(), NOW()),
(7, 720, 960, 240, 'Default Props', NOW(), NOW());

-- Course 2: React - Lesson 8 (State & Hooks)
INSERT INTO lesson_segments (lesson_id, start_time, end_time, duration, title, created_at, updated_at) VALUES
(8, 0, 360, 360, 'State Concept', NOW(), NOW()),
(8, 360, 720, 360, 'useState Hook', NOW(), NOW()),
(8, 720, 1080, 360, 'useEffect Hook', NOW(), NOW()),
(8, 1080, 1440, 360, 'Cleanup & Dependencies', NOW(), NOW());

-- Course 2: React - Lesson 9 (Conditional Rendering & Lists)
INSERT INTO lesson_segments (lesson_id, start_time, end_time, duration, title, created_at, updated_at) VALUES
(9, 0, 300, 300, 'Conditional Rendering Patterns', NOW(), NOW()),
(9, 300, 600, 300, 'Rendering Lists with map()', NOW(), NOW()),
(9, 600, 900, 300, 'Key Prop Importance', NOW(), NOW());

-- Course 2: React - Lesson 10 (API Integration)
INSERT INTO lesson_segments (lesson_id, start_time, end_time, duration, title, created_at, updated_at) VALUES
(10, 0, 360, 360, 'Fetch API Overview', NOW(), NOW()),
(10, 360, 720, 360, 'Fetch in useEffect', NOW(), NOW()),
(10, 720, 1080, 360, 'Axios Library', NOW(), NOW()),
(10, 1080, 1440, 360, 'Loading & Error States', NOW(), NOW());
