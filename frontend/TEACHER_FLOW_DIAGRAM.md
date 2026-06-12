# Teacher Flow Diagram (Mermaid)

```mermaid
flowchart TD
  A[Giảng viên đăng nhập] --> B[Dashboard]
  B --> C[Quản lý Khóa học]
  C --> C1[Tạo / Cập nhật Khóa học]
  C1 --> C2[Thêm chương (Chapter)]
  C2 --> C3[Thêm bài (Lesson)]
  C3 --> C4[Thêm phân đoạn (Segment) / Nội dung]
  C4 --> D[Soạn nội dung Rich / Upload media]
  D --> E[Ngân hàng câu hỏi]
  E --> F[Tạo / chỉnh sửa Câu hỏi]
  F --> G[Tạo / quản lý Quiz]
  G --> G1[Thêm câu hỏi vào Quiz]
  G1 --> G2[Publish Quiz]
  G2 --> H[Sinh viên làm bài kiểm tra]
  H --> I[Kết quả & Chấm điểm (AI/Manual)]
  I --> J[Giảng viên xem kết quả / giải thích AI]
  J --> K[Phản hồi: Bình luận / Q&A / Review / Survey]
  K --> L[Giảng viên trả lời tương tác / sửa nội dung]
  style A fill:#f9f,stroke:#333,stroke-width:1px
  style H fill:#ff9,stroke:#333,stroke-width:1px
  style I fill:#9f9,stroke:#333,stroke-width:1px
```

Notes: map chính của luồng giảng viên từ tạo khóa học → nội dung → câu hỏi → quiz → chấm điểm → phản hồi.
