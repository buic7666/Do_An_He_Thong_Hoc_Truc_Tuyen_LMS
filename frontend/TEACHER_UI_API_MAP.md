# Teacher UI → Backend API Mapping

Generated from the frontend codebase (searching `httpClient` calls). Focused on instructor (giảng viên) actions.

## Dashboard & Profile
- GET /teachers/dashboard — fetch teacher dashboard data (dashboard widgets, enrollments, revenue)
- GET /teachers/profile — get teacher profile
- PUT /teachers/profile — update teacher profile

## Courses
- GET /courses — list courses (teacher view)
- POST /courses — create course
- GET /courses/:courseId — get course detail
- DELETE /courses/:courseId — delete course
- GET /courses/:courseId/progress — get course progress (students)

## Chapters
- GET /chapters/course/:courseId — list chapters for a course
- POST /chapters/course/:courseId — create chapter
- PUT /chapters/:chapterId — update chapter
- DELETE /chapters/:chapterId — delete chapter

## Lessons
- GET /lessons/course/:courseId — list lessons for a course
- POST /lessons/course/:courseId — create lesson
- GET /lessons/:lessonId — get lesson detail
- PUT /lessons/:lessonId — update lesson
- DELETE /lessons/:lessonId — delete lesson
- POST /lessons/:lessonId/watch-position — save watch position (student)
- GET /lessons/:lessonId/watch-position — get watch position
- POST /lessons/:lessonId/progress — mark lesson progress/completion

## Lesson Segments
- GET /lessons/:lessonId/segments — list segments
- POST /lessons/:lessonId/segments — create a segment
- POST /lessons/:lessonId/segments/bulk — bulk create segments (split/import)
- PUT /lessons/segments/:segmentId — update segment
- DELETE /lessons/segments/:segmentId — delete segment
- PUT /lessons/:lessonId/segments/reorder — reorder segments

## Labels / Tags
- GET /lessons/:lessonId/labels — list labels
- POST /lessons/:lessonId/labels — create label
- PUT /lessons/labels/:labelId — update label
- DELETE /lessons/labels/:labelId — delete label

## Question Bank (teacher & global)
- GET /questions/course/:courseId — list questions for a course
- GET /questions — list / search questions
- POST /questions — create question
- PUT /questions/:id — update question
- DELETE /questions/:id — delete question
- (teacher-scoped)
  - GET /teachers/questions
  - POST /teachers/questions
  - PUT /teachers/questions/:id
  - DELETE /teachers/questions/:id

## Quiz Manager (teacher)
- POST /quiz-manager — create/manage quiz (teacher)
- GET /quiz-manager/my-quizzes — list teacher quizzes
- POST /quiz-manager/:quizId/questions/:questionId — add question to quiz
- DELETE /quiz-manager/:quizId/questions/:questionId — remove question from quiz
- POST /quiz-manager/:quizId/publish — publish a quiz

## Quiz Lifecycle (student-facing; used by preview/teacher flows)
- GET /quizzes/:id — load quiz
- POST /quizzes/:id/start — start attempt
- POST /quizzes/:id/save-answer — autosave answer during attempt
- POST /quizzes/:id/submit — submit attempt (returns grading + AI feedback)
- GET /quizzes/:quizId/score — fetch aggregated score (list)
- GET /quizzes/:quizId/attempts — list attempts
- GET /quizzes/:quizId/attempts/:attemptId — fetch attempt details

## Comments / Q&A / Interactions
- GET /comments?courseId=...&lessonId=... — list comments (with replies)
- POST /comments — create comment or reply
- PUT /comments/:commentId — update comment
- DELETE /comments/:commentId — delete comment
- GET /teachers/interactions — fetch teacher interactions (Q&A)
- POST /teachers/interactions/:id/reply — reply to an interaction

## Uploads / Media
- POST /teachers/upload?type=<type> — multipart upload for teacher media (images, videos, attachments). Response contains public URL(s).

## Surveys & Reviews
- POST /surveys — create survey
- GET /surveys/course/:courseId — list surveys for course
- GET /surveys/:surveyId — get survey detail
- POST /surveys/:surveyId/responses — submit survey response
- GET /surveys/:surveyId/responses — teacher: fetch survey responses
- POST /reviews — create a review
- GET /reviews/course/:courseId — list reviews for a course

## Enrollments & Payments (teacher insights)
- GET /enrollments/me — get my enrollments
- POST /enrollments — enroll in a course (student)

## YouTube / Subscription Helpers
- POST /youtube/subscribe — request subscribe action
- POST /youtube/check-subscription — verify subscription

## Misc / Admin
- GET /admin/dashboard — admin dashboard (if applicable)

---
Notes:
- This file was generated from the frontend `httpClient` usages. Use it as the canonical UI→API surface for teacher flows.
- Next step: generate a teacher flow diagram (Mermaid) showing major flows (Course → Lesson → Segment → Quiz → Review).
