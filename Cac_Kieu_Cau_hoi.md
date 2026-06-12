# YÊU CẦU: HỆ THỐNG 4 LOẠI CÂU HỎI + AI CHẤM ESSAY

## I. TỔNG QUAN

Hệ thống Quiz hiện tại chỉ hỗ trợ **1 loại câu hỏi (Multiple Choice)**. 
Cần mở rộng để hỗ trợ **4 loại** và **AI tự động chấm ESSAY**.

---

## II. 4 LOẠI CÂU HỎI

### 1. Trắc nghiệm (MULTIPLE_CHOICE)
- **Định nghĩa:** Câu hỏi với nhiều đáp án, học viên chọn 1 hoặc nhiều đáp án đúng
- **Cách chấm:** Auto-grade ngay - tất cả đúng → 100%, sai → 0%
- **Metadata:** Danh sách options, indices đáp án đúng, explanation

### 2. Đúng/Sai (TRUE_FALSE)
- **Định nghĩa:** Câu hỏi với 2 lựa chọn: Đúng hoặc Sai
- **Cách chấm:** Auto-grade ngay - đúng → 100%, sai → 0%
- **Metadata:** Đáp án đúng (true/false), explanation

### 3. Trả lời ngắn (SHORT_ANSWER)
- **Định nghĩa:** Học viên gõ từ/cụm từ, hệ thống so khớp chuỗi
- **Cách chấm:** Auto-grade ngay - so sánh với danh sách đáp án chấp nhận được
- **Metadata:** Danh sách đáp án chấp nhận, case-sensitive (Y/N), fuzzy match (Y/N), explanation

### 4. Tự luận (ESSAY)
- **Định nghĩa:** Học viên viết đoạn văn, AI sẽ tự động chấm dựa trên rubric
- **Cách chấm:** AI chấm - gọi OpenAI API, trả về điểm + chi tiết feedback từng tiêu chí
- **Metadata:** Rubric (danh sách tiêu chí, trọng số, mô tả), instructions, word limit, AI model

---

## III. YÊUR CẦU GIÁO VIÊN (Tạo Câu Hỏi)

### A. Khi tạo câu hỏi, giáo viên PHẢI:

1. **Chọn loại câu hỏi**
   - Dropdown: MULTIPLE_CHOICE / TRUE_FALSE / SHORT_ANSWER / ESSAY

2. **Nhập nội dung câu hỏi**
   - Text input: câu hỏi thực tế

3. **Thiết lập metadata tuỳ theo loại:**

   **MULTIPLE_CHOICE:**
   - Nhập danh sách options (A, B, C, D, ...)
   - Chọn 1 hoặc nhiều đáp án đúng
   - (Optional) Thêm explanation

   **TRUE_FALSE:**
   - Chọn đáp án đúng: True / False
   - (Optional) Thêm explanation

   **SHORT_ANSWER:**
   - Nhập danh sách đáp án chấp nhận (dòng mới = 1 đáp án)
   - Chọn: Case-sensitive? (Yes/No)
   - Chọn: Fuzzy match? (Yes/No)
   - (Optional) Thêm explanation

   **ESSAY:**
   - Nhập hướng dẫn viết (instructions)
   - Thiết lập rubric:
     * Danh sách tiêu chí (VD: Kiến thức, Ví dụ, Ngôn ngữ)
     * Trọng số % cho mỗi tiêu chí (tổng = 100)
     * Mô tả chi tiết cho mỗi tiêu chí (AI sẽ đọc)
   - Chọn word limit (min/max)
   - Chọn AI model: GPT-4 / GPT-3.5-turbo

4. **Lưu câu hỏi** → đưa vào khóa học/quiz

---

## IV. YÊU CẦU HỌC VIÊN (Làm Quiz)

### A. Khi học viên làm quiz:

1. **Xem câu hỏi** - Frontend tự động render loại thích hợp
   - MULTIPLE_CHOICE → Radio/Checkbox
   - TRUE_FALSE → 2 Button (Đúng/Sai)
   - SHORT_ANSWER → Text input
   - ESSAY → Large textarea

2. **ESSAY - thêm tính năng:**
   - Hiển thị hướng dẫn (instructions)
   - Hiển thị rubric (collapsible, dùng để tham khảo)
   - Đếm số từ (word counter)

3. **Trả lời từng câu** → Auto-save

4. **Nộp bài (Submit)**
   - Frontend gửi: `{ answers: { [questionId]: { type, value }, ... } }`
   - Backend nhận → xử lý auto-grade tất cả 4 loại

5. **Xem kết quả**
   - Thấy điểm từng câu
   - **ESSAY:** Thấy AI feedback chi tiết:
     * Điểm từng tiêu chí
     * Nhận xét từng tiêu chí
     * Nhận xét chung từ AI
   - Pass/Fail status

---

## V. XỬ LÝ BACKEND (Auto-Grading)

### A. Khi học viên submit quiz:

**Với từng câu trả lời:**

1. **MULTIPLE_CHOICE:**
   - So sánh: indices do học viên chọn vs. indices đáp án đúng
   - Nếu toàn bộ match → score = 100
   - Nếu có khác → score = 0
   - Lưu score ngay

2. **TRUE_FALSE:**
   - So sánh: giá trị học viên chọn vs. correctAnswer
   - Match → score = 100, khác → score = 0
   - Lưu score ngay

3. **SHORT_ANSWER:**
   - Normalize text (toLowerCase nếu không case-sensitive)
   - Kiểm tra: text học viên có match với 1 trong danh sách accepted answers không?
   - Nếu fuzzy match = true → dùng string similarity (>80%) để so sánh
   - Match → score = 100, khác → score = 0
   - Lưu score ngay

4. **ESSAY:**
   - Gọi **OpenAI API** (hoặc Claude/Gemini) với:
     * Nội dung câu hỏi
     * Câu trả lời học viên
     * Rubric (danh sách tiêu chí + mô tả)
   - API trả về JSON:
     ```json
     {
       "criteria": [
         { "name": "Kiến thức", "score": 38, "feedback": "..." },
         { "name": "Ví dụ", "score": 28, "feedback": "..." },
         { "name": "Ngôn ngữ", "score": 19, "feedback": "..." }
       ],
       "totalScore": 85,
       "overallFeedback": "..."
     }
     ```
   - Lưu toàn bộ response

### B. Sau khi chấm hết:
- Tính totalScore quiz = trung bình tất cả điểm câu
- Xác định: passed (totalScore >= passScore) ? true : false
- Trả về: attempt với scores + details

---

## VI. DATABASE CHANGES

### A. Bảng questions - thêm/sửa cột:
- `type`: ENUM('MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'ESSAY')
- `metadata`: JSON (lưu config tuỳ theo type)

### B. Tạo bảng student_answers (mới):
- `id`: primary key
- `attempt_id`: FK → student_quiz_attempts
- `question_id`: FK → questions
- `answer_type`: ENUM (4 loại)
- `answer_value`: JSON (giá trị trả lời)
- `score`: decimal 0-100
- `grading_details`: JSON (chi tiết từ AI, null nếu non-ESSAY)
- `ai_feedback`: TEXT (feedback từ AI, null nếu non-ESSAY)
- `created_at`, `updated_at`

---

## VII. API ENDPOINTS - THAY ĐỔI/THÊMỚI

### Tạo/sửa câu hỏi:
```
POST /questions
PUT /questions/:id

Body:
{
  "content": "...",
  "type": "ESSAY|MULTIPLE_CHOICE|...",
  "metadata": {...},
  "difficulty": "EASY|MEDIUM|HARD",
  "courseId": 123
}
```

### Nộp bài quiz (thay đổi):
```
POST /quizzes/:quizId/submit

Body:
{
  "answers": {
    "questionId": { "type": "ESSAY", "value": "..." },
    "questionId": { "type": "MULTIPLE_CHOICE", "value": [0, 2] },
    ...
  }
}

Response:
{
  "id": 123,
  "totalScore": 85,
  "isPassed": true,
  "answers": [
    {
      "questionId": 1,
      "type": "ESSAY",
      "score": 85,
      "gradingDetails": { criteria: [...], totalScore: 85 },
      "aiFeedback": "..."
    },
    ...
  ]
}
```

### Lấy kết quả quiz:
```
GET /quizzes/:quizId/attempts/:attemptId
→ Trả về attempt với chi tiết tất cả answers + grades
```

---

## VIII. TÍNH NĂNG BỔ SUNG

1. **Admin/Teacher có thể xem:**
   - Danh sách questions với filter: type, difficulty, course
   - Edit question → thay đổi metadata/rubric
   - Delete question (cascade delete từ quizzes)

2. **Student có thể:**
   - Làm lại quiz (attempt mới) nếu maxAttempts chưa hết
   - Xem lại kết quả từ attempts trước

3. **Cost optimization:**
   - Cache question metadata (Redis)
   - Rate limiting OpenAI API calls
   - Batch ESSAY grading nếu có nhiều students

---

## IX. TESTING CHECKLIST

- [ ] Tạo 4 loại question khác nhau
- [ ] Student làm quiz với 4 loại
- [ ] Verify auto-grade: MC (100/0), T-F (100/0), SA (fuzzy match), ESSAY (AI grade)
- [ ] Verify result display: hiển thị đúng feedback cho ESSAY
- [ ] Edge cases: empty input, max words exceeded, AI API timeout

---

## X. TIMELINE

| Phase | Yêu cầu | Thời gian |
|-------|---------|----------|
| 1 | Question model + StudentAnswer model + DB migrations | 1 ngày |
| 2 | Backend grading services (MC, T-F, SA, ESSAY) + OpenAI integration | 1.5 ngày |
| 3 | API endpoints (create question, submit quiz, get results) | 0.5 ngày |
| 4 | Frontend - Question Creator (4 loại form) | 1.5 ngày |
| 5 | Frontend - Quiz Taker (4 loại render) | 1 ngày |
| 6 | Frontend - Result display (AI feedback) | 0.5 ngày |
| 7 | Testing + optimization | 1 ngày |
| **Tổng** | | **7 ngày** |

---

## XI. PRIORITY

🔴 **Critical (Must have):**
- 4 question types (MULTIPLE_CHOICE, TRUE_FALSE, SHORT_ANSWER, ESSAY)
- Auto-grade cho MC, T-F, SA
- AI grade cho ESSAY
- Teacher tạo question + chọn type

🟡 **Important (Should have):**
- Rubric display cho student (tham khảo)
- Word counter cho ESSAY
- Detailed AI feedback display

🟢 **Nice-to-have:**
- Cache question metadata
- Admin report AI grading cost
- Webhook notify teacher khi student submit

---

**Đó là toàn bộ yêu cầu. Bắt đầu implement phần nào trước?**
