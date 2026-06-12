# Student UI → Backend API Mapping

Generated from student screens in the frontend (`frontend/src/screens/Hocsinh`). Focused on student actions and expectations.

## Courses & Enrollment
- GET /courses — list courses (used in `TrangDsKhoaHoc.jsx`)
- GET /courses/:courseId — get course detail (`chitietkhoahoc.jsx`, `ManHinhHocTap.jsx`)
- POST /enrollments — create enrollment / enroll in course (used in quick enroll flows)
- GET /enrollments/me — fetch current user's enrollments (`ManHinhHocTap.jsx`, `TrangDsKhoaHoc.jsx`)

## Lessons & Watch Position
- GET /lessons/:lessonId — get lesson detail (segments) (`ManHinhHocTap.jsx`)
- GET /lessons/:lessonId/watch-position — load saved watch position (`ManHinhHocTap.jsx`)
- POST /lessons/:lessonId/watch-position — save watch position (`ManHinhHocTap.jsx`)
- POST /lessons/:lessonId/progress — mark lesson completed (`ManHinhHocTap.jsx`)

## Quizzes / Exercises
- GET /quizzes/:id — load quiz (`QuizTaker.jsx` used by student screens)
- POST /quizzes/:id/start — start attempt
- POST /quizzes/:id/save-answer — autosave answer
- POST /quizzes/:id/submit — submit attempt
- GET /quizzes/:quizId/attempts — list attempts
- GET /quizzes/:quizId/attempts/:attemptId — get attempt details

## Reviews / Feedback / Comments
- POST /reviews — submit course review (`StudentFeedback.jsx`)
- GET /reviews/course/:courseId — list course reviews (`CourseReviews.jsx`)
- GET /comments?courseId=...&lessonId=... — list comments (used in lesson view)
- POST /comments — create comment/reply (students can comment)

## YouTube Helpers (video gate)
- POST /youtube/subscribe — request subscribe action (Google token) (`ManHinhHocTap.jsx`)
- POST /youtube/check-subscription — verify subscription (`ManHinhHocTap.jsx`)

## Surveys
- POST /surveys/:surveyId/responses — submit survey response (student)

## Payments (checkout flow)
- Payment flows are initiated from `ManHinhThanhToan.jsx`; frontend uses external payment provider flow and then records enrollment via POST `/enrollments` (or payment webhooks on backend).

## Misc
- GET /courses/:courseId/progress — fetch course progress (student-facing) — used in `ManHinhHocTap.jsx`

---
Notes:
- This file summarizes the student-facing API surface observed in `frontend/src/screens/Hocsinh` and shared components (`QuizTaker`, `RichContentRenderer`).
