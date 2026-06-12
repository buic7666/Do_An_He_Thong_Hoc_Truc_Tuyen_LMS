# Tổng kết triển khai Hệ thống Câu hỏi & Bài kiểm tra (Quiz)

**Trạng thái:** ✅ Đã hoàn thành và sẵn sàng sử dụng

---

## 📋 Những phần đã được xây dựng

### Backend (Node.js/Express)

#### 1. Models Cơ sở dữ liệu (Database Models)
✅ **Question** (`backend/src/models/question.model.js`)
- Lưu trữ các mục trong ngân hàng câu hỏi do giáo viên tạo.
- Các trường (Fields): `questionText` (nội dung câu hỏi), `options` (các lựa chọn định dạng JSON), `correctIndex` (vị trí đáp án đúng), `explanation` (lời giải thích), `difficulty` (độ khó), `createdBy` (người tạo).
- Mối quan hệ (Relationships): Thuộc về bảng `User` (người tạo).

✅ **Quiz** (`backend/src/models/quiz.model.js`)
- Lưu trữ cấu hình bài kiểm tra liên kết với các khóa học.
- Các trường: `courseId` (mã khóa học), `lessonId` (mã bài học - tùy chọn), `title` (tiêu đề), `description` (mô tả), `duration` (thời lượng), `passScore` (điểm đạt), `maxAttempts` (số lần làm tối đa), `isPublished` (trạng thái xuất bản), `createdBy` (người tạo).
- Mối quan hệ: Thuộc về bảng `Course`, thuộc về bảng `User`.

✅ **QuizQuestion** (`backend/src/models/quizQuestion.model.js`)
- Bảng trung gian (Join table) giữa `Quiz` và `Question`.
- Các trường: `quizId`, `questionId`, `order` (thứ tự hiển thị), `points` (điểm số).
- Cho phép thiết lập mối quan hệ nhiều-nhiều (many-to-many) kèm theo thứ tự câu hỏi.

✅ **StudentQuizAttempt** (`backend/src/models/studentQuizAttempt.model.js`)
- Theo dõi các lượt làm bài và kết quả của học viên.
- Các trường: `quizId`, `studentId`, `attemptNumber` (lần làm bài thứ mấy), `startedAt` (thời gian bắt đầu), `submittedAt` (thời gian nộp bài), `totalScore` (tổng điểm), `isPassed` (đạt/trượt), `answersJson` (lưu trữ lịch sử trả lời dạng JSON).
- Lưu lại lịch sử câu trả lời và điểm số từng lần.

#### 2. Dịch vụ (Services)
✅ **questionService.js** (`backend/src/services/questionService.js`)
- `getQuestionsByCreator()` - Lấy danh sách ngân hàng câu hỏi của giáo viên.
- `getQuestionById()` - Lấy thông tin chi tiết một câu hỏi.
- `createQuestion()` - Tạo câu hỏi mới.
- `updateQuestion()` - Cập nhật câu hỏi.
- `deleteQuestion()` - Xóa câu hỏi.
- `getQuestionsByDifficulty()` - Lọc câu hỏi theo độ khó.
- `searchQuestions()` - Tìm kiếm câu hỏi.
- `normalizeQuestion()` - Định dạng dữ liệu trả về cho chuẩn.

✅ **quizService.js** (`backend/src/services/quizService.js`)
- `getQuizzesByCourse()` - Lấy tất cả quiz của một khóa học.
- `getQuizDetail()` - Lấy chi tiết quiz kèm theo toàn bộ câu hỏi.
- `startQuizAttempt()` - Bắt đầu lượt làm bài mới (có kiểm tra giới hạn số lần làm).
- `saveQuizAnswer()` - Tự động lưu (auto-save) từng câu trả lời độc lập.
- `submitQuiz()` - Nộp bài và tính điểm quiz.
- `getStudentQuizAttempts()` - Lấy danh sách tất cả các lượt làm bài.
- `getLatestQuizAttempt()` - Lấy lượt làm bài hiện tại.
- `getQuizScore()` - Lấy điểm số cao nhất.
- `normalizeQuiz()` - Định dạng dữ liệu quiz trả về.

#### 3. Bộ điều khiển (Controllers)
✅ **questionController.js** (`backend/src/controllers/questionController.js`)
- Xử lý các logic: `getQuestions()`, `getQuestion()`, `createQuestion()`, `updateQuestion()`, `deleteQuestion()`.

✅ **quizController.js** (`backend/src/controllers/quizController.js`)
- Xử lý các logic: `getQuizzesByCourse()`, `getQuizDetail()`, `startQuizAttempt()`, `getLatestQuizAttempt()`, `getStudentQuizAttempts()`, `saveQuizAnswer()`, `submitQuiz()`, `getQuizScore()`.

#### 4. Tuyến đường (Routes)
✅ **quizRoutes.js** (`backend/src/routes/quizRoutes.js`)
Hoàn thiện toàn bộ các điểm cuối API (REST API endpoints):
- `GET /api/questions` - Lấy ngân hàng câu hỏi (dành cho giáo viên).
- `POST /api/questions` - Tạo câu hỏi.
- `GET /api/questions/:id` - Lấy chi tiết câu hỏi.
- `PUT /api/questions/:id` - Cập nhật câu hỏi.
- `DELETE /api/questions/:id` - Xóa câu hỏi.
- `GET /api/courses/:courseId/quizzes` - Lấy danh sách quiz trong khóa học.
- `GET /api/quizzes/:quizId` - Lấy chi tiết quiz kèm danh sách câu hỏi.
- `POST /api/quizzes/:quizId/start` - Bắt đầu làm bài.
- `GET /api/quizzes/:quizId/latest-attempt` - Lấy lượt làm bài gần nhất.
- `GET /api/quizzes/:quizId/attempts` - Lấy tất cả lượt làm bài.
- `POST /api/quizzes/:quizId/save-answer` - Tự động lưu câu trả lời.
- `POST /api/quizzes/:quizId/submit` - Nộp bài kiểm tra.
- `GET /api/quizzes/:quizId/score` - Lấy điểm số tốt nhất.

#### 5. Kiểm tra dữ liệu hợp lệ (Validations)
✅ **quizValidation.js** (`backend/src/validations/quizValidation.js`)
- Xác thực đầu vào cho: tạo câu hỏi, cập nhật câu hỏi, tạo quiz, cập nhật quiz, lưu câu trả lời, và nộp bài.

#### 6. Kịch bản khởi tạo dữ liệu mẫu (Seed Script)
✅ **seedQuestionsAndQuizzes.js** (`backend/src/scripts/seedQuestionsAndQuizzes.js`)
```bash
npm run seed:quizzes
```
Tạo tự động:
- 8 câu hỏi Flutter (trắc nghiệm nhiều lựa chọn, kèm giải thích).
- 8 câu hỏi Node.js/Backend.
- 2 câu hỏi React.
- 1 bài kiểm tra Flutter được gắn vào Khóa học (Course) ID 18.
- Khởi tạo ngân hàng câu hỏi mẫu cho giáo viên.

---

### Frontend (React)

#### 1. Component Làm Bài Kiểm Tra (Quiz Taker)
✅ **QuizTaker.jsx** (`frontend/src/components/QuizTaker.jsx`)

Tính năng:
- Hiển thị danh sách câu hỏi trắc nghiệm cùng các lựa chọn.
- Đồng hồ đếm ngược thời gian với cảnh báo bằng màu sắc (ví dụ: sắp hết giờ sẽ chuyển đỏ).
- Thanh tiến trình (progress bar) và thanh điều hướng các câu hỏi.
- Tính năng Tự động lưu (Auto-save) câu trả lời cứ mỗi 30 giây.
- Nút Nộp bài, kèm theo logic tính toán điểm số trực tiếp.
- Hiển thị màn hình Kết quả với trạng thái Đạt/Trượt.
- Theo dõi trạng thái của từng câu hỏi (đã trả lời hay chưa).

#### 2. Component Danh Sách Bài Kiểm Tra (Quiz List)
✅ **QuizList.jsx** (`frontend/src/components/QuizList.jsx`)

Tính năng:
- Hiển thị toàn bộ quiz có trong một khóa học.
- Hiển thị thông tin tổng quan của quiz (thời lượng, số lượng câu hỏi, điểm đạt).
- Thể hiện điểm số tốt nhất của học viên cùng biểu tượng trạng thái trực quan: ✅ (đạt), ❌ (trượt), ⭕ (chưa làm).
- Thiết kế giao diện dạng thẻ (Card), có thể click vào để bắt đầu làm bài.
- Bố cục lưới (Grid layout) responsive, tương thích trên nhiều kích thước màn hình.

#### 3. Giao diện Bảng Điều Khiển Giáo Viên (Teacher Dashboard UI)
✅ **ManHinhQuanLyNganHangCauhoi.jsx** (`frontend/src/screens/GiangVien/ManHinhQuanLyNganHangCauhoi.jsx`)

Tính năng:
- Hỗ trợ toàn bộ thao tác thêm, sửa, xóa (CRUD) cho Ngân hàng câu hỏi.
- Điều hướng dạng tab trực quan giữa "Câu hỏi" và "Bài kiểm tra".
- Tích hợp Trình soạn thảo văn bản phong phú (`RichContentEditor`) cho phép upload hình ảnh/video từ máy tính và nhúng video YouTube.
- Hỗ trợ nhập liệu Metadata phức tạp (cho các câu dạng Điền từ (CLOZE), Tự luận (ESSAY), setup trọng số điểm rubric).
- Giao diện thiết lập bài kiểm tra (Quiz builder) hỗ trợ preset chọn nhanh số lượng (ví dụ: tạo cấu trúc 5 trắc nghiệm - 3 đúng/sai - 1 điền từ - 1 tự luận).

#### 4. File Giao diện CSS (Styling Files)
✅ **QuizTaker.css** - CSS chi tiết cho màn hình làm bài.
✅ **QuizList.css** - Thiết lập giao diện dạng lưới cho danh sách thẻ quiz.
✅ **ManHinhQuanLyNganHangCauhoi.css** - CSS cho màn hình quản lý của giáo viên.

Tính năng nổi bật:
- Thiết kế Responsive (tương thích Mobile, Tablet, Desktop).
- Trạng thái chỉ báo bằng mã màu rõ ràng.
- Chuyển động animation mượt mà.
- Cảnh báo màu sắc cho đồng hồ đếm ngược.

---

## 📊 Sơ đồ Cơ sở Dữ liệu (Database Schema)

### Mối quan hệ (Relationships)
```
User
├── (1) → (Nhiều) Question (createdBy - tạo bởi)
├── (1) → (Nhiều) Quiz (createdBy)
└── (1) → (Nhiều) StudentQuizAttempt (studentId - ID học viên)

Course
└── (1) → (Nhiều) Quiz

Lesson
└── (1) → (Nhiều) Quiz (tùy chọn)

Quiz
├── (1) → (Nhiều) QuizQuestion (bảng trung gian)
└── (1) → (Nhiều) StudentQuizAttempt

Question
└── (Nhiều) ← (Nhiều) Quiz (thông qua bảng QuizQuestion)

StudentQuizAttempt
├── thuộc về (belongs to) Quiz
├── thuộc về (belongs to) User (đóng vai trò là học viên)
└── lưu trữ lịch sử trả lời và điểm số
```

---

## 🚀 Tóm tắt các Endpoints API

### Ngân hàng câu hỏi (Dành cho Giáo viên)
| Phương thức | Endpoint | Mục đích |
|--------|----------|---------|
| GET | `/api/questions` | Xem danh sách câu hỏi của giáo viên |
| POST | `/api/questions` | Tạo câu hỏi mới |
| GET | `/api/questions/:id` | Lấy chi tiết câu hỏi |
| PUT | `/api/questions/:id` | Sửa câu hỏi |
| DELETE | `/api/questions/:id` | Xóa câu hỏi |

### Quản lý bài kiểm tra (Dành cho Học viên)
| Phương thức | Endpoint | Mục đích |
|--------|----------|---------|
| GET | `/api/courses/:courseId/quizzes` | Danh sách bài kiểm tra trong khóa học |
| GET | `/api/quizzes/:quizId` | Chi tiết quiz kèm danh sách câu hỏi |
| POST | `/api/quizzes/:quizId/start` | Bắt đầu lượt làm bài mới |
| GET | `/api/quizzes/:quizId/latest-attempt` | Lấy phiên làm bài hiện tại/gần nhất |
| GET | `/api/quizzes/:quizId/attempts` | Lấy toàn bộ lịch sử các lần làm bài |
| POST | `/api/quizzes/:quizId/save-answer` | Tự động lưu đáp án (Auto-save) |
| POST | `/api/quizzes/:quizId/submit` | Nộp bài và tính điểm |
| GET | `/api/quizzes/:quizId/score` | Lấy điểm số cao nhất |

---

## 📚 Tài liệu tham khảo thêm

✅ **QUIZ_API.md** (`backend/docs/QUIZ_API.md`)
- Tài liệu API đầy đủ.
- Ví dụ Request/Response cho từng API endpoint.
- Tham khảo mã lỗi (Error handling).
- Ví dụ cách gọi API từ Frontend.

✅ **QUIZ_INTEGRATION.md** (`backend/docs/QUIZ_INTEGRATION.md`)
- Hướng dẫn tích hợp từng bước.
- Các ví dụ sử dụng Component trong React.
- Cấu trúc thư mục DB, kịch bản test và xử lý sự cố.

---

## ✨ Các tính năng chính đã triển khai thành công

### Ngân hàng câu hỏi (Question Bank)
- ✅ Tạo câu hỏi với nhiều lựa chọn đáp án.
- ✅ Đặt cấp độ khó (dễ, trung bình, khó).
- ✅ Thêm giải thích lý do cho đáp án đúng.
- ✅ Tìm kiếm và bộ lọc câu hỏi.
- ✅ Quyền bảo mật: Chỉ người tạo mới được phép chỉnh sửa/xóa.

### Quản lý Bài Kiểm Tra (Quiz Management)
- ✅ Tạo quiz và gắn vào khóa học.
- ✅ Gắn câu hỏi vào quiz, cho phép sắp xếp tùy chỉnh thứ tự.
- ✅ Đặt điểm số ngưỡng đạt (pass score) và thời gian đếm ngược.
- ✅ Cấu hình số lần làm bài tối đa (max attempts).
- ✅ Công khai hoặc ẩn bài kiểm tra (Publish/Unpublish).

### Giao diện làm bài (Quiz Taking)
- ✅ Giao diện trắc nghiệm đa lựa chọn.
- ✅ Auto-save câu trả lời ngầm mỗi 30 giây.
- ✅ Tính năng bộ đếm giờ (Timer) cực kỳ ổn định.
- ✅ Nộp bài và hiển thị luôn điểm số.

### Hệ thống điểm số (Score Tracking)
- ✅ Tính toán điểm theo tỷ lệ phần trăm (%).
- ✅ Chấm Đạt/Trượt dựa trên ngưỡng điểm yêu cầu.
- ✅ Theo dõi lịch sử từng lần làm bài.
- ✅ Tự động lưu lại mốc điểm "Tốt nhất" (Best score).
- ✅ Ngăn chặn việc thi vượt quá số lần quy định.

---

## 🔄 Luồng dữ liệu hoạt động (Data Flow)

### Quá trình làm bài kiểm tra

```
1. Học viên đang ở trang Khóa học
   ↓
2. Chuyển sang Tab "Bài Kiểm Tra"
   ↓
3. Component QuizList tự gọi API tải danh sách (GET /api/courses/:id/quizzes)
   ↓
4. Học viên chọn 1 quiz để làm
   ↓
5. Component QuizTaker tải dữ liệu của quiz đó (GET /api/quizzes/:id)
   ↓
6. Học viên click "Bắt đầu làm bài"
   ↓
7. Gửi POST /api/quizzes/:id/start để tạo 1 Record StudentQuizAttempt mới
   ↓
8. Học viên chọn đáp án
   ↓
9. Cứ mỗi 30s, hệ thống auto-save đáp án đó (POST /api/quizzes/:id/save-answer)
   ↓
10. Học viên nhấn nút "Nộp bài"
    ↓
11. Gửi POST /api/quizzes/:id/submit, server tính toán điểm và khóa record lại
    ↓
12. Hiển thị màn hình Kết quả với Điểm và trạng thái Đạt/Trượt
    ↓
13. Dashboard tự động cập nhật lại điểm cao nhất (GET /api/quizzes/:id/score)
```

---

## 🔧 Cấu hình cơ bản

### Đồng hồ đếm giờ (Timer)
- **Chu kỳ Auto-save:** 30 giây (có thể chỉnh lại trong React `useEffect`).
- **Thời lượng làm bài:** Cài đặt độc lập cho từng Quiz (tính bằng Phút).

### Tính điểm (Scoring)
- **Điểm để vượt qua:** Cài đặt độc lập cho từng Quiz (Mặc định: 70%).
- **Công thức:** (Số câu đúng / Tổng số câu) × 100.

### Lượt làm bài (Attempts)
- **Số lần làm tối đa:** Cài đặt độc lập cho từng Quiz (Mặc định: 3 lần).
- **Chỉ số được lưu:** Lần làm thứ mấy, giờ bắt đầu, giờ kết thúc, điểm số, mảng json chứa lịch sử đáp án đã chọn.

---

## 🚨 Xử lý lỗi thường gặp (Error Handling)

**Lỗi "Quiz not found" (404)**
- ✅ Kiểm tra xem truyền đúng ID chưa.
- ✅ Kiểm tra trạng thái `isPublished` của quiz đã bật chưa.
- ✅ Xác nhận Khóa học (Course) liên kết có tồn tại.

**Lỗi "Max attempts exceeded" (Vượt quá số lần làm bài - 400)**
- ✅ Liên hệ Admin/Giáo viên tăng `maxAttempts` nếu cần.
- ✅ Hoặc xóa bớt lịch sử làm bài cũ trong DB.

**Lỗi "Answer not saved" (Không lưu được đáp án)**
- ✅ Kiểm tra kết nối mạng của thiết bị.
- ✅ Kiểm tra Auth Token có bị hết hạn không.

**Lỗi "Score not calculated" (Chưa tính được điểm)**
- ✅ Kiểm tra xem câu hỏi trong DB có setup biến `correctIndex` đúng định dạng mảng (Array) hay chưa.

---

## 🔐 Bảo mật (Security)

- ✅ Mọi API endpoints đều bắt buộc phải có Authorization (Xác thực).
- ✅ Giáo viên chỉ được xem và sửa câu hỏi thuộc quyền sở hữu của mình.
- ✅ Học viên chỉ nhìn thấy các Quiz đã được Xuất bản (`isPublished=true`).
- ✅ Tránh được việc học viên tự ý gửi/sửa điểm lên hệ thống (việc tính toán diễn ra 100% tại Server-side).
- ✅ Validation đầu vào chặt chẽ trên toàn bộ payload.

---

## 📈 Tính năng mở rộng trong tương lai (Future Enhancements)

### Ưu tiên cao
- [x] Giao diện Quản lý Bài Kiểm Tra & Câu hỏi cho Giáo viên (Teacher Dashboard UI).
- [ ] Giao diện Review bài thi chi tiết sau khi nộp (Hiện đáp án đúng/sai từng câu).
- [ ] Hiển thị mục Giải thích câu hỏi (Explanation display) cho học sinh.
- [ ] Xuất kết quả làm bài của lớp học ra định dạng CSV/PDF.

### Ưu tiên trung bình
- [ ] Chế độ Luyện tập (Practice mode - cho phép làm vô hạn lần, không lưu điểm).
- [ ] Tính năng Randomize (Xáo trộn) ngẫu nhiên câu hỏi.
- [ ] Cây danh mục / Thẻ Tags cho ngân hàng câu hỏi.
- [ ] Tính năng sao chép mẫu (Quiz templates).

---

## ✅ Danh sách kiểm tra cuối cùng (Checklist)

- [x] Tạo xong Database Models (Question, Quiz, QuizQuestion, StudentQuizAttempt).
- [x] Triển khai Services (questionService, quizService).
- [x] Triển khai Controllers (questionController, quizController).
- [x] Triển khai Router (quizRoutes.js).
- [x] Setup logic Xác thực (quizValidation.js).
- [x] Tích hợp Script mồi (Seed Script) thành công.
- [x] Hoàn thiện giao diện React Frontend (QuizTaker, QuizList, ManHinhQuanLyNganHangCauhoi).
- [x] CSS Styling đẹp mắt, chuẩn UI/UX.
- [x] Viết tài liệu (QUIZ_API.md, QUIZ_INTEGRATION.md, QUIZ_SYSTEM_SUMMARY.md).
- [x] Kiểm tra đầy đủ bắt lỗi (Error handling).

---

**Thời gian tạo:** 21/04/2026  
**Trạng thái:** Sẵn sàng trên môi trường Thực tế (Production)  
**Phiên bản:** 1.0.0

---