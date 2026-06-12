# Component → Endpoint Mapping (Giảng viên)

Bản đồ chi tiết các hành động UI quan trọng của Giảng viên và endpoint tương ứng. Mỗi mục bao gồm component, hành động, endpoint, và link đến file (kèm khoảng dòng tham khảo).

1) `CommentThread.jsx` — Bình luận / trả lời / sửa / xóa
- File: [frontend/src/components/CommentThread.jsx](frontend/src/components/CommentThread.jsx#L1-L400)
- Actions:
  - Load comments: GET `/comments?courseId=...&lessonId=...` — called in `loadComments()`
  - Post comment / reply: POST `/comments` — called in `handlePostComment()` / `handleReply()`
  - Edit comment: PUT `/comments/:commentId` — called in `handleEditComment()`
  - Delete comment: DELETE `/comments/:commentId` — called in `handleDeleteComment()`

2) `RichContentRenderer.jsx` — Hiển thị nội dung rich (media resolution)
- File: [frontend/src/components/RichContentRenderer.jsx](frontend/src/components/RichContentRenderer.jsx#L1-L400)
- Notes: không trực tiếp gọi API nhưng chứa logic `resolveMediaUrl()` và `getApiOrigin()` dùng `VITE_API_BASE_URL` để xây URL media trả về từ upload endpoints.

3) `QuizTaker.jsx` — Tải, bắt đầu, lưu autosave, nộp, xem kết quả
- File: [frontend/src/components/QuizTaker.jsx](frontend/src/components/QuizTaker.jsx#L1-L1400)
- Actions / endpoints:
  - Load quiz: GET `/quizzes/:id` (see loadQuiz)
  - Enrich questions: GET `/questions/:id` for each question
  - Start attempt: POST `/quizzes/:id/start`
  - Autosave answer: POST `/quizzes/:id/save-answer` (sent per question in `saveAnswers()`)
  - Submit attempt: POST `/quizzes/:id/submit` (returns grading + aiFeedback)
  - Get attempt details (result view): GET `/quizzes/:quizId/attempts/:attemptId` (see `QuizResult`)

4) `SegmentDetailView.jsx` — Segment editor (autosave, fetch lesson/segment)
- File: [frontend/src/screens/GiangVien/SegmentDetailView.jsx](frontend/src/screens/GiangVien/SegmentDetailView.jsx#L650-L760)
- Actions / endpoints:
  - GET lesson detail: GET `/lessons/:lessonId` (load lesson metadata)
  - GET chapter: GET `/chapters/:chapterId`
  - GET course: GET `/courses/:courseId`
  - GET segment detail: GET `/lessons/:lessonId/segments/:segmentId`
  - Fetch question by id (for embeds): GET `/questions/:qid`
  - Save segment (autosave): PUT `/lessons/segments/:segmentId` (called by `persistSegmentChanges()`)
  - Bulk create segments: POST `/lessons/:lessonId/segments/bulk` (used by bulk split/import flows)

5) `ManHinhQuanLyKhoaHoc.jsx`, `Step1/Step2/Step3` — Course / Chapters / Lessons management
- Files:
  - [frontend/src/screens/GiangVien/ManHinhQuanLyKhoaHoc.jsx](frontend/src/screens/GiangVien/ManHinhQuanLyKhoaHoc.jsx#L1-L400)
  - [frontend/src/screens/GiangVien/Step1_DanhSachKhoaHoc.jsx](frontend/src/screens/GiangVien/Step1_DanhSachKhoaHoc.jsx#L1-L160)
  - [frontend/src/screens/GiangVien/Step2_ChiTietKhoaHoc.jsx](frontend/src/screens/GiangVien/Step2_ChiTietKhoaHoc.jsx#L1-L120)
  - [frontend/src/screens/GiangVien/Step3_ChiTietChapter.jsx](frontend/src/screens/GiangVien/Step3_ChiTietChapter.jsx#L1-L120)
- Common actions / endpoints:
  - List courses: GET `/courses`
  - Create course: POST `/courses`
  - Update course: PUT `/courses/:id` (file upload in Step1 uses PUT `/courses/:id` with FormData)
  - Get course detail: GET `/courses/:courseId`
  - Chapters list: GET `/chapters/course/:courseId`
  - Create chapter: POST `/chapters/course/:courseId`
  - Update chapter: PUT `/chapters/:chapterId` / DELETE `/chapters/:chapterId`
  - Lessons: GET/POST/PUT/DELETE via `/lessons` and `/lessons/course/:courseId`

6) `QuestionFormModal.jsx` & `SelectQuestionsModal.jsx` — Tạo / Chọn câu hỏi
- Files:
  - [frontend/src/components/QuestionFormModal.jsx](frontend/src/components/QuestionFormModal.jsx#L1-L400)
  - [frontend/src/components/SelectQuestionsModal.jsx](frontend/src/components/SelectQuestionsModal.jsx#L1-L200)
- Actions / endpoints:
  - Create question: POST `/questions` (or teacher-scoped POST `/teachers/questions` depending on caller)
  - Update question: PUT `/questions/:id` or PUT `/teachers/questions/:id`
  - List/search questions: GET `/questions` and GET `/questions/course/:courseId`
  - Select questions modal uses GET `/questions?` variants to fetch/filter

7) `ManHinhQuanLyNganHangCauhoi.jsx` — Quiz manager (teacher)
- File: [frontend/src/screens/GiangVien/ManHinhQuanLyNganHangCauhoi.jsx](frontend/src/screens/GiangVien/ManHinhQuanLyNganHangCauhoi.jsx#L700-L820)
- Actions / endpoints:
  - Create/manage quiz: POST `/quiz-manager`
  - List my quizzes: GET `/quiz-manager/my-quizzes`
  - Add question to quiz: POST `/quiz-manager/:quizId/questions/:questionId`
  - Remove question: DELETE `/quiz-manager/:quizId/questions/:questionId`
  - Publish quiz: POST `/quiz-manager/:quizId/publish` (see publish button handler)

8) `ManHInhChatGV.jsx` — Giáo viên trả lời tương tác / Q&A
- File: [frontend/src/screens/GiangVien/ManHInhChatGV.jsx](frontend/src/screens/GiangVien/ManHInhChatGV.jsx#L1-L200)
- Actions / endpoints:
  - Fetch teacher interactions: GET `/teachers/interactions`
  - Reply to interaction: POST `/teachers/interactions/:id/reply`

9) `HoSoGiangVien.jsx` — Profile
- File: [frontend/src/screens/GiangVien/HoSoGiangVien.jsx](frontend/src/screens/GiangVien/HoSoGiangVien.jsx#L1-L200)
- Actions:
  - Get profile: GET `/teachers/profile`
  - Update profile: PUT `/teachers/profile`

10) `SurveyActivity.jsx` — Survey create / responses
- File: [frontend/src/screens/GiangVien/SurveyActivity.jsx](frontend/src/screens/GiangVien/SurveyActivity.jsx#L1-L200)
- Actions:
  - Create survey: POST `/surveys`
  - List surveys for course: GET `/surveys/course/:courseId`
  - Get survey detail: GET `/surveys/:surveyId`
  - Fetch responses (teacher): GET `/surveys/:surveyId/responses`
  - Submit response (student): POST `/surveys/:surveyId/responses`

11) `Teacher upload` usage (Rich editor / upload helpers)
- Upload endpoint: POST `/teachers/upload?type=<type>` — used by `RichContentEditor`/upload helpers. See teacher API wrapper: [frontend/src/api/teacherApi.js](frontend/src/api/teacherApi.js#L48-L56)

---
If bạn muốn, tôi có thể tiếp tục và:
- A) Bổ sung tham số request + ví dụ payload cho từng endpoint.
- B) Thêm trích dẫn line-by-line chính xác cho mỗi gọi `httpClient` (tôi sẽ thêm line numbers chính xác từ grep/read_file).
- C) Tạo CSV/Excel xuất bản đồ này.

Tôi sẽ cập nhật todo và chờ chỉ thị của bạn để tiếp tục.
