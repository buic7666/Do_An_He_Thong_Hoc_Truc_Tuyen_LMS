# Student Flow Diagram (Mermaid)

```mermaid
flowchart TD
  A[Khám phá khóa học] --> B[Chi tiết khóa học]
  B --> C[Đăng ký / Thanh toán]
  C --> D[Vào học (Dashboard học tập)]
  D --> E[Chọn bài học]
  E --> F[Xem phân đoạn (Segment)]
  F --> G[Video / Tài liệu / Bài tập]
  G --> H[Nếu video: YouTube gate → POST /youtube/check-subscription / POST /youtube/subscribe]
  G --> I[Nếu quiz: mở QuizTaker → GET /quizzes/:id → POST /quizzes/:id/start → POST /quizzes/:id/submit]
  I --> J[Xem kết quả → GET /quizzes/:quizId/attempts/:attemptId]
  G --> K[Bình luận / Gửi phản hồi / Đánh giá → POST /comments / POST /reviews]
  J --> L[Theo dõi tiến độ khoá học → GET /courses/:courseId/progress]
  style A fill:#f0f9ff,stroke:#0366d6
  style I fill:#fff7ed,stroke:#d97706
  style H fill:#fff1f2,stroke:#dc2626
```

Notes: luồng chính cho Học sinh từ khám phá → đăng ký → học → tương tác → hoàn thành.
