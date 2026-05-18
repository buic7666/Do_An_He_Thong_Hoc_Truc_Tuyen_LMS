Tài liệu API Câu hỏi & Bài kiểm tra (Quiz)
Tổng quan
Tài liệu này mô tả các điểm cuối (endpoints) API dành cho hệ thống Ngân hàng câu hỏi và Bài kiểm tra/Thi cử.

API Ngân hàng câu hỏi (Dành cho Giáo viên - Quản lý câu hỏi)
1. Lấy tất cả câu hỏi (Ngân hàng câu hỏi)
Endpoint: GET /api/questions

Xác thực: Bắt buộc (Giáo viên/Admin)

Tham số truy vấn (Query Params):

difficulty: Tùy chọn - 'easy' (dễ), 'medium' (trung bình), hoặc 'hard' (khó)

search: Tùy chọn - tìm kiếm văn bản trong nội dung câu hỏi

Ví dụ phản hồi:

JSON
{
  "success": true,
  "message": "Questions retrieved",
  "data": [
    {
      "id": 1,
      "questionText": "Trong Flutter, cách tốt nhất để render một danh sách dài...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 1,
      "explanation": "ListView.builder tạo widgets lazily...",
      "difficulty": "medium",
      "creator": {
        "id": 2,
        "name": "Giáo viên"
      },
      "createdAt": "2024-04-21T10:00:00Z"
    }
  ]
}
2. Tạo câu hỏi mới
Endpoint: POST /api/questions

Xác thực: Bắt buộc (Giáo viên/Admin)

Thân bài viết (Request Body):

JSON
{
  "questionText": "Trong Flutter, cách tốt nhất để render một danh sách dài là gì?",
  "options": [
    "Sử dụng Column",
    "Sử dụng ListView.builder",
    "Sử dụng Stack",
    "Sử dụng SingleChildScrollView"
  ],
  "correctIndex": 1,
  "explanation": "ListView.builder tạo các widget một cách lazy-loaded",
  "difficulty": "medium"
}
Phản hồi: Trả về đối tượng câu hỏi đã tạo (201 Created)

3. Lấy thông tin một câu hỏi
Endpoint: GET /api/questions/:id

Xác thực: Bắt buộc

Phản hồi: Trả về đối tượng câu hỏi.

4. Cập nhật câu hỏi
Endpoint: PUT /api/questions/:id

Xác thực: Bắt buộc (Người tạo/Admin)

Thân bài viết: Tương tự như phần tạo mới (tất cả các trường đều không bắt buộc).

Phản hồi: Trả về đối tượng câu hỏi đã cập nhật.

5. Xóa câu hỏi
Endpoint: DELETE /api/questions/:id

Xác thực: Bắt buộc (Người tạo/Admin)

Phản hồi:

JSON
{
  "success": true,
  "message": "Question deleted",
  "data": {
    "id": 1,
    "deleted": true
  }
}
API Bài kiểm tra (Dành cho Học viên - Làm bài)
1. Lấy tất cả bài kiểm tra của khóa học
Endpoint: GET /api/courses/:courseId/quizzes

Xác thực: Bắt buộc

Ví dụ phản hồi:

JSON
{
  "success": true,
  "message": "Quizzes retrieved",
  "data": [
    {
      "id": 1,
      "courseId": 18,
      "title": "Kiểm tra Flutter Cơ Bản",
      "description": "Bài kiểm tra 8 câu về các khái niệm cơ bản...",
      "duration": 30,
      "passScore": 70,
      "maxAttempts": 3,
      "isPublished": true,
      "questions": 8,
      "createdAt": "2024-04-21T10:00:00Z"
    }
  ]
}
2. Lấy chi tiết bài kiểm tra kèm danh sách câu hỏi
Endpoint: GET /api/quizzes/:quizId

Xác thực: Bắt buộc

Ví dụ phản hồi:

JSON
{
  "success": true,
  "message": "Quiz detail retrieved",
  "data": {
    "id": 1,
    "courseId": 18,
    "title": "Kiểm tra Flutter Cơ Bản",
    "description": "...",
    "duration": 30,
    "passScore": 70,
    "maxAttempts": 3,
    "isPublished": true,
    "questions": [
      {
        "id": 1,
        "questionText": "Trong Flutter, cách tốt nhất để render một danh sách dài...",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "QuizQuestion": {
          "order": 1,
          "points": 1
        }
      }
    ],
    "createdAt": "2024-04-21T10:00:00Z"
  }
}
3. Bắt đầu lượt làm bài
Endpoint: POST /api/quizzes/:quizId/start

Xác thực: Bắt buộc

Ví dụ phản hồi:

JSON
{
  "success": true,
  "message": "Quiz attempt started",
  "data": {
    "id": 1,
    "quizId": 1,
    "studentId": 5,
    "attemptNumber": 1,
    "startedAt": "2024-04-21T10:05:00Z",
    "submittedAt": null,
    "totalScore": null,
    "isPassed": null,
    "answers": {}
  }
}
4. Lấy lượt làm bài mới nhất
Endpoint: GET /api/quizzes/:quizId/latest-attempt

Xác thực: Bắt buộc

Phản hồi: Trả về đối tượng lượt làm bài (attempt) mới nhất (hoặc object rỗng nếu chưa có lượt làm bài nào).

5. Lấy tất cả các lượt làm bài của học viên
Endpoint: GET /api/quizzes/:quizId/attempts

Xác thực: Bắt buộc

Phản hồi: Trả về mảng chứa tất cả các lượt đã làm của bài kiểm tra đó.

6. Tự động lưu câu trả lời (Auto-Save)
Endpoint: POST /api/quizzes/:quizId/save-answer

Xác thực: Bắt buộc

Thân bài viết:

JSON
{
  "questionId": 1,
  "selectedIndex": 2
}
Phản hồi:

JSON
{
  "success": true,
  "message": "Answer saved",
  "data": {
    "quizId": 1,
    "questionId": 1,
    "savedAt": "2024-04-21T10:06:00Z"
  }
}
7. Nộp bài kiểm tra
Endpoint: POST /api/quizzes/:quizId/submit

Xác thực: Bắt buộc

Thân bài viết:

JSON
{
  "answers": {
    "1": 1,
    "2": 0,
    "3": 2,
    "4": 1,
    "5": 3,
    "6": 1,
    "7": 1,
    "8": 2
  }
}
Ví dụ phản hồi:

JSON
{
  "success": true,
  "message": "Quiz submitted",
  "data": {
    "id": 1,
    "quizId": 1,
    "studentId": 5,
    "attemptNumber": 1,
    "startedAt": "2024-04-21T10:05:00Z",
    "submittedAt": "2024-04-21T10:35:00Z",
    "totalScore": 87.5,
    "isPassed": true,
    "answers": {
      "1": 1,
      "2": 0,
      "3": 2,
      "4": 1,
      "5": 3,
      "6": 1,
      "7": 1,
      "8": 2
    }
  }
}
8. Lấy điểm số tốt nhất
Endpoint: GET /api/quizzes/:quizId/score

Xác thực: Bắt buộc

Phản hồi: Trả về lượt làm bài có điểm cao nhất hoặc null nếu chưa nộp bài.

Phản hồi lỗi (Error Responses)
404 - Không tìm thấy bài kiểm tra
JSON
{
  "success": false,
  "error": "Quiz not found",
  "code": "QUIZ_NOT_FOUND"
}
400 - Vượt quá số lần làm bài tối đa
JSON
{
  "success": false,
  "error": "Bạn đã hết lần làm bài. Số lần tối đa: 3",
  "code": "MAX_ATTEMPTS_EXCEEDED"
}
400 - Không tìm thấy lượt làm bài
JSON
{
  "success": false,
  "error": "Quiz attempt not found or already submitted",
  "code": "ATTEMPT_NOT_FOUND"
}
Ví dụ sử dụng (Frontend)
JavaScript
// Lấy danh sách bài kiểm tra cho khóa học
const quizzes = await axios.get('/api/courses/18/quizzes', {
  headers: { Authorization: `Bearer ${token}` }
});

// Bắt đầu làm bài
const attempt = await axios.post('/api/quizzes/1/start', {}, {
  headers: { Authorization: `Bearer ${token}` }
});

// Lấy danh sách câu hỏi của bài kiểm tra
const quiz = await axios.get('/api/quizzes/1', {
  headers: { Authorization: `Bearer ${token}` }
});

// Tự động lưu (mỗi khi học viên chọn một đáp án)
await axios.post('/api/quizzes/1/save-answer', {
  questionId: 1,
  selectedIndex: 2
}, {
  headers: { Authorization: `Bearer ${token}` }
});

// Nộp bài
const result = await axios.post('/api/quizzes/1/submit', {
  answers: { 1: 2, 2: 0, 3: 1 }
}, {
  headers: { Authorization: `Bearer ${token}` }
});
Sơ đồ cơ sở dữ liệu (Database Schema)
Các bảng đã tạo:
questions: Ngân hàng câu hỏi (do giáo viên tạo).

quizzes: Cấu hình bài kiểm tra cho các khóa học.

quiz_questions: Bảng trung gian liên kết bài kiểm tra và câu hỏi.

student_quiz_attempts: Hồ sơ ghi lại các lượt làm bài của học viên.

Các tính năng đã thực hiện:
✅ Quản lý ngân hàng câu hỏi (CRUD).

✅ Tạo bài kiểm tra liên kết với khóa học.

✅ Thứ tự câu hỏi và thiết lập điểm số.

✅ Theo dõi lượt làm bài của học viên.

✅ Tự động lưu bài khi đang làm.

✅ Tính toán điểm số và trạng thái Đạt/Trượt.

✅ Giới hạn số lượt làm bài tối đa cho mỗi học viên.

✅ Phân loại độ khó câu hỏi.

✅ Giải thích đáp án đúng.

Các bước tiếp theo (Frontend):
Xây dựng component QuizList để hiển thị danh sách bài kiểm tra.

Xây dựng component QuizTaker để thực hiện làm bài.

Xây dựng component QuizResults để hiển thị điểm số.

Thêm phần bài kiểm tra vào trang chi tiết khóa học.

Thêm phần bài kiểm tra vào bảng điều khiển (Dashboard) của học viên.