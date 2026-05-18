# 🎬 Hướng Dẫn Xem Chi Tiết Bài Học & Cắt Phân Đoạn Video

## 📋 Tổng Quan

Khi bạn đã vào **Step 3** (Danh sách bài học), bây giờ bạn có thể:

1. **Xem chi tiết bài học** (video + nội dung)
2. **Cắt video thành các phần đoạn nhỏ** (segments)
3. **Phát từng phần đoạn** riêng lẻ

---

## 🎯 Quy Trình Sử Dụng

### Step 1: Xem Danh Sách Bài Học
```
Step 3: Danh Sách Bài Học
└─ Mỗi bài học có 4 nút:
   ├─ 👁️ Xem Chi Tiết    ← CLICK ĐÂY
   ├─ ⏱️ Phân Đoạn       ← Quản lý segments
   ├─ ✏️  Sửa             ← Chỉnh sửa bài
   └─ 🗑️  Xóa             ← Xóa bài
```

### Step 2: Vào Chi Tiết Bài Học
```
URL: http://localhost:5173/teacher/lessons/:lessonId

Hiển Thị:
├─ 📖 Tên bài học (lớn)
├─ 📝 Nội dung bài (nếu có)
├─ 🎥 Video Player (YouTube)
└─ ⏱️  Danh sách phân đoạn (segments)
```

### Step 3: Quản Lý Phân Đoạn

#### **Xem Danh Sách Phân Đoạn**
```
📺 Mỗi phân đoạn hiển thị:
├─ Số thứ tự (hình tròn gradient)
├─ Tên phân đoạn
├─ 🕐 Thời gian bắt đầu → Thời gian kết thúc
└─ 3 nút hành động:
   ├─ ▶️ Phát  ← Phát video từ thời điểm này
   ├─ ✏️ Sửa   ← Chỉnh sửa phân đoạn
   └─ 🗑️ Xóa   ← Xóa phân đoạn
```

#### **Thêm Phân Đoạn Mới**
```
Bước 1: Click nút "➕ Thêm Phân Đoạn"
        → Modal form hiện lên

Bước 2: Nhập thông tin
        ├─ Tên phân đoạn (VD: "Giới thiệu")
        ├─ Thời gian bắt đầu (VD: "00:30")
        └─ Thời gian kết thúc (VD: "02:15")

Bước 3: Click "Tạo Phân Đoạn"
        → Phân đoạn được thêm vào danh sách
```

#### **Sửa Phân Đoạn**
```
Bước 1: Click nút "✏️ Sửa" trên phân đoạn
        → Modal form hiện lên với dữ liệu cũ

Bước 2: Chỉnh sửa thông tin
        ├─ Tên
        ├─ Thời gian bắt đầu
        └─ Thời gian kết thúc

Bước 3: Click "Cập Nhật"
        → Phân đoạn được cập nhật
```

#### **Xóa Phân Đoạn**
```
Bước 1: Click nút "🗑️ Xóa" trên phân đoạn

Bước 2: Xác nhận xóa
        → Phân đoạn bị xóa khỏi danh sách
```

#### **Phát Phân Đoạn**
```
Bước 1: Click nút "▶️ Phát" trên phân đoạn

Bước 2: Video tự động cuộn lên
        → YouTube player phát video từ 
          thời điểm bắt đầu của phân đoạn
```

---

## ⏱️ Format Thời Gian

Hệ thống hỗ trợ các format:

| Format | Ví Dụ | Giải Thích |
|--------|-------|-----------|
| mm:ss | 02:30 | 2 phút 30 giây |
| hh:mm:ss | 01:23:45 | 1 giờ 23 phút 45 giây |
| Số | 150 | 150 giây (tự động convert) |

**⚠️ Lưu ý**:
- Thời gian kết thúc **phải lớn hơn** thời gian bắt đầu
- Không được nhập thời gian âm
- Tối đa 3600000 giây (hơn 1000 giờ)

---

## 🎨 Giao Diện Chi Tiết Bài Học

```
┌─────────────────────────────────────────────────────┐
│ ← Quay lại danh sách bài                            │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ 📖 Tên Bài Học                                      │
├─────────────────────────────────────────────────────┤
│ 📝 Nội dung:                                        │
│ Nội dung bài học được hiển thị đây...              │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│          🎥 YouTube Video Player                    │
│                                                     │
│          [Click để phát video]                      │
│                                                     │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ ⏱️ Phân Đoạn Video (3)        [➕ Thêm Phân Đoạn]   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  1  Phần 1 - Giới Thiệu                             │
│     🕐 00:00 → 02:30                                │
│     [▶️ Phát] [✏️] [🗑️]                             │
│                                                     │
│  2  Phần 2 - Nội Dung Chính                         │
│     🕐 02:30 → 08:15                                │
│     [▶️ Phát] [✏️] [🗑️]                             │
│                                                     │
│  3  Phần 3 - Tóm Tắt                                │
│     🕐 08:15 → 10:00                                │
│     [▶️ Phát] [✏️] [🗑️]                             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 💡 Ví Dụ Thực Tế

### Ví Dụ 1: Video Bài Giảng Kéo Dài 30 Phút

**Bài Học**: "Java Fundamentals - Lesson 1"

**Phân Đoạn**:
1. **Giới Thiệu** (00:00 → 02:30) - Chào mừng, giới thiệu nội dung
2. **Khái Niệm Cơ Bản** (02:30 → 15:00) - Giải thích các khái niệm chính
3. **Ví Dụ Thực Tế** (15:00 → 25:00) - Chạy code examples
4. **Tóm Tắt** (25:00 → 30:00) - Recap và Q&A

---

### Ví Dụ 2: Cách Nhập Thời Gian

```
Bài học kéo dài 1 giờ 45 phút:

Phân đoạn 1: 
  - Bắt đầu: 00:00 (hoặc 0)
  - Kết thúc: 15:30 (hoặc 930)

Phân đoạn 2:
  - Bắt đầu: 15:30
  - Kết thúc: 01:05:00 (hoặc 3900)

Phân đoạn 3:
  - Bắt đầu: 01:05:00
  - Kết thúc: 01:45:00 (hoặc 6300)
```

---

## ✅ Checklist Kiểm Tra

- [ ] Có thể click "👁️ Xem Chi Tiết" để vào trang chi tiết
- [ ] Trang chi tiết hiển thị tên bài học
- [ ] Video player YouTube hoạt động
- [ ] Có thể thêm phân đoạn mới
- [ ] Phân đoạn được thêm vào danh sách
- [ ] Có thể sửa phân đoạn
- [ ] Có thể xóa phân đoạn (có xác nhận)
- [ ] Nút "▶️ Phát" phát video từ thời điểm chính xác
- [ ] Breadcrumb navigation hoạt động
- [ ] Modal form có validation (không để trống, kết thúc > bắt đầu)
- [ ] Responsive design trên mobile

---

## 🐛 Troubleshooting

### **Lỗi 1: Video không hiển thị**
```
❌ Vấn đề: YouTube player không load
✅ Giải pháp:
   - Kiểm tra URL YouTube có đúng không
   - Đảm bảo URL là từ youtube.com hoặc youtu.be
   - Format hỗ trợ:
     • https://www.youtube.com/watch?v=VIDEO_ID
     • https://youtu.be/VIDEO_ID
     • https://www.youtube.com/embed/VIDEO_ID
```

### **Lỗi 2: Không thể thêm phân đoạn**
```
❌ Vấn đề: Modal form không gửi được
✅ Giải pháp:
   - Kiểm tra tên phân đoạn có nhập không
   - Kiểm tra thời gian kết thúc > bắt đầu
   - Check console (F12) xem error message
   - Ensure backend đang chạy ở port 5000
```

### **Lỗi 3: Phân đoạn không phát từ đúng thời điểm**
```
❌ Vấn đề: Click "▶️ Phát" nhưng video không bắt đầu từ đúng lúc
✅ Giải pháp:
   - YouTube embed player có độ trễ nhỏ
   - Kiểm tra thời gian start parameter đúng không
   - Thử refresh page
```

---

## 📚 API Endpoints Sử Dụng

### Lấy Chi Tiết Bài Học
```
GET /lessons/:lessonId
Yêu cầu: Auth token
Response: { title, content, videoUrl, ... }
```

### Lấy Danh Sách Phân Đoạn
```
GET /lessons/:lessonId/segments
Yêu cầu: Auth token
Response: [{ id, title, startTime, endTime }, ...]
```

### Thêm Phân Đoạn
```
POST /lessons/:lessonId/segments
Body: { title, startTime, endTime }
Response: { id, title, startTime, endTime }
```

### Sửa Phân Đoạn
```
PUT /lessons/segments/:segmentId
Body: { title, startTime, endTime }
Response: { id, title, startTime, endTime }
```

### Xóa Phân Đoạn
```
DELETE /lessons/segments/:segmentId
Response: { success: true }
```

---

## 🎯 Best Practices

### Cách Chia Phân Đoạn Tốt

✅ **TỐTTT**:
- Chia theo các phần nội dung (Giới thiệu, Chính, Tóm tắt)
- Mỗi phân đoạn 5-15 phút
- Đặt tên rõ ràng, mô tả nội dung

❌ **KHÔNG TỐT**:
- Chia quá nhiều phân đoạn (>20 phần)
- Phân đoạn quá ngắn (<1 phút)
- Tên phân đoạn không rõ ràng

---

## 📞 Hỗ Trợ

Nếu gặp vấn đề:
1. Kiểm tra console browser (F12)
2. Kiểm tra network tab xem API response
3. Ensure cả backend & frontend đang chạy
4. Kiểm tra session token có hợp lệ không

