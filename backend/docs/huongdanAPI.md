# Hướng dẫn tích hợp API chấm điểm ngoài (External Grader)

Tài liệu này mô tả cấu trúc payload và hành vi mong đợi khi backend của hệ thống LMS gọi một dịch vụ chấm điểm bên ngoài (External Grader). Mục tiêu: cho phép gọi đồng bộ hoặc bất đồng bộ tới một API bên thứ ba, nhận điểm và phản hồi chấm, sau đó lưu lại kết quả trong hệ thống.

## Tổng quan
- URL gọi: bất kỳ URL HTTPS do admin cấu hình, ví dụ `https://grader.example.com/grade`
- Hình thức gọi: HTTP(S) JSON
- Hỗ trợ: đồng bộ (synchronous) trả điểm ngay, hoặc bất đồng bộ (asynchronous) trả 202 + webhook callback

## Xác thực
- Khuyến nghị: `Authorization: Bearer <API_KEY>`
- Ngoài ra có thể hỗ trợ header `X-API-Key: <KEY>` nếu dịch vụ bên ngoài yêu cầu.
- Luôn dùng HTTPS.

## Header khuyến nghị
- `Content-Type: application/json`
- `Accept: application/json`
- `Authorization: Bearer <KEY>`
- `X-Request-Id: <uuid>` (tùy chọn, giúp idempotency và debug)

## Hình thức yêu cầu (Request) - Đồng bộ
Gửi JSON POST tới endpoint `POST /grade` (ví dụ). Dưới đây là schema mẫu:

```json
{
  "requestId": "7f3a1b2c-...",
  "mode": "sync",
  "question": {
    "id": 123,
    "type": "ESSAY",
    "title": "Viết một đoạn nhắc về ...",
    "contentBlocks": [ /* mảng block rich content (HTML/text/image/video URLs) */ ]
  },
  "student": {
    "id": 456,
    "attemptId": "attempt-789"
  },
  "answer": {
    "text": "Nội dung trả lời của học sinh (HTML hoặc plain)",
    "contentBlocks": [ /* nếu trả lời dạng rich */ ]
  },
  "rubric": {
    "maxScore": 100,
    "criteria": [
      { "id": "c1", "name": "Nội dung", "weight": 0.6 },
      { "id": "c2", "name": "Trình bày", "weight": 0.4 }
    ]
  },
  "metadata": {
    "courseId": 12,
    "lessonId": 34,
    "graderHints": "Các hướng dẫn thêm cho grader nếu cần"
  }
}
```

Giải thích trường chính:
- `requestId` (tùy chọn): UUID do caller sinh ra để thực hiện idempotent request và tra cứu log.
- `mode`: `sync` hoặc `async`. `sync` = chấm xong trả kết quả, `async` = service trả 202 và sau đó gọi webhook.
- `question.contentBlocks`: giữ nguyên cấu trúc rich blocks của hệ thống (text/image/video URLs) để grader có thể dùng ngữ cảnh.
- `answer.contentBlocks`: tương tự, nếu học sinh nộp rich content.
- `rubric`: mô tả thang điểm và trọng số từng tiêu chí (nếu có).

## Hình thức phản hồi (Response) - Đồng bộ
Service trả `200 OK` với body JSON dạng:

```json
{
  "requestId": "7f3a1b2c-...",
  "score": 85,
  "maxScore": 100,
  "normalizedScore": 0.85,
  "feedback": "Điểm tốt, nhưng cần nêu rõ ví dụ...",
  "criteria": [
    { "id": "c1", "score": 50, "maxScore": 60, "feedback": "Nội dung OK." },
    { "id": "c2", "score": 35, "maxScore": 40, "feedback": "Trình bày cần cải thiện." }
  ],
  "raw": { /* optional: toàn bộ payload nội bộ trả về từ engine */ }
}
```

Yêu cầu:
- `score`: số nguyên hoặc số thập phân, cùng thang với `maxScore`.
- `normalizedScore`: `score / maxScore` (giá trị 0..1) — tùy chọn nhưng khuyến khích có.
- `criteria` (tùy chọn): nếu grader trả điểm theo tiêu chí, cung cấp mảng điểm per-criterion.

## Bất đồng bộ (Webhook)
Nếu caller gửi `mode: "async"`, service có thể trả `202 Accepted` và sau đó gọi webhook do hệ thống LMS cung cấp. Webhook callback payload nên giống phần `Response` ở trên, kèm `requestId` và `attemptId`.

Webhook header khuyến nghị từ service bên ngoài:
- `Content-Type: application/json`
- `X-Signature: <HMAC-SHA256 signature>` (nếu muốn verify)

Webhook example payload:

```json
{
  "requestId": "...",
  "attemptId": "attempt-789",
  "score": 78,
  "maxScore": 100,
  "feedback": "..."
}
```

## Các mã lỗi & xử lý
- `400 Bad Request`: payload không hợp lệ
- `401 Unauthorized` / `403 Forbidden`: key không hợp lệ hoặc không có quyền
- `429 Too Many Requests`: quá giới hạn rate
- `500`/`502`/`503`: lỗi server — caller nên retry theo backoff

Khuyến nghị retry:
- Với lỗi 5xx: retry up to 3 lần theo exponential backoff (ví dụ 1s, 2s, 4s).
- Với 429: respect `Retry-After` header nếu có.

## Idempotency
- Dùng `requestId` (UUID) để tránh chấm lặp khi caller gửi lại request. Grader nên lưu `requestId` trong window thời gian hợp lý và trả kết quả đã xử lý nếu nhận lại cùng `requestId`.

## Chỉ dẫn về dữ liệu truyền (best practices)
- Không gửi nội dung nhạy cảm (PII) nếu không cần thiết; chỉ gửi `student.id` hoặc `anonId`.
- Gửi các link media (image/video) thay vì file binary. Nếu cần upload file, cung cấp pre-signed URL để grader fetch.
- Giới hạn kích thước `contentBlocks` (ví dụ <= 50 KB text) để tránh timeout.

## Bảo mật
- Luôn dùng HTTPS.
- Lưu `EXTERNAL_GRADER_KEY` trong biến môi trường và không commit vào mã nguồn.
- Nếu hỗ trợ webhook, xác thực bằng HMAC-SHA256: grader đặt header `X-Signature` = `HMAC(secret, body)` và LMS xác thực trước khi chấp nhận.

## Hạn mức & QoS
- Thông báo rõ rate limit (ví dụ 60 req/min). Nếu grader áp dụng limit, trả `429` và `Retry-After`.

## Ví dụ cURL (đồng bộ)

```bash
curl -X POST 'https://grader.example.com/grade' \
  -H 'Authorization: Bearer $GRADER_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "requestId":"req-1",
    "mode":"sync",
    "question": {"id":1, "type":"ESSAY", "title":"..."},
    "student": {"id":123, "attemptId":"a1"},
    "answer": {"text":"Nội dung trả lời"},
    "rubric": {"maxScore":100}
  }'
```

## Ví dụ Node (fetch)

```js
const fetch = require('node-fetch');

async function callGrader(url, key, payload) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    },
    body: JSON.stringify(payload),
    timeout: 20000
  });
  if (!res.ok) throw new Error(`Grader error ${res.status}`);
  return res.json();
}
```

## Hướng dẫn tích hợp trong backend của dự án
1. Thêm biến môi trường trong file cấu hình: `EXTERNAL_GRADER_URL`, `EXTERNAL_GRADER_KEY`, `EXTERNAL_GRADER_MODE` (default `sync`).
2. Tạo service adapter `graderService` (ví dụ `backend/src/services/graderService.js`) có API:
   - `gradeWithExternal(requestPayload)` — gọi endpoint, xử lý retry, parse response.
   - `verifyWebhook(req)` — helper để verify signature (nếu dùng HMAC).
3. Trong flow chấm (`backend/src/services/gradingService.js`), khi loại câu hỏi là `ESSAY` hoặc khi admin chọn `external` grader, gọi `graderService` thay cho hàm AI mặc định.
4. Nếu `mode: async`, cung cấp `webhookUrl` trong payload (ví dụ `https://lms.example.com/api/external-grader/webhook`) để grader callback.

## Test & sandbox
- Cung cấp một endpoint sandbox (ví dụ `https://sandbox.grader.example.com`) cho dev test.
- Test cases: short answer, long essay, edge cases (empty answer, very long answer, images-only answer).

## Gợi ý cho nhà cung cấp grader
- Trả `score` nhất quán theo `maxScore` mà caller cung cấp.
- Nếu có nhiều tiêu chí, trả `criteria` để LMS có thể hiển thị breakdown.
- Trả `raw` hoặc logs (ẩn PII) để debug.

---

Nếu bạn muốn, mình sẽ tạo file adapter mẫu `backend/src/services/graderService.js` và cập nhật `gradingService.js` để gọi external grader theo spec này. Muốn mình triển khai tiếp không? 
