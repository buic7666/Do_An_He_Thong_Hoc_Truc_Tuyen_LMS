# ⚡ Hướng Dẫn Nhanh: Subscribe-to-Watch (5 Phút)

## **🎯 Mục Tiêu**
Bảo vệ video YouTube - yêu cầu users phải subscribe channel mới xem.

---

## **Bước 1️⃣: Lấy Google Client ID (2 phút)**

### Truy cập Google Cloud Console:
```
https://console.cloud.google.com
```

### Tạo OAuth Credentials:
1. **New Project** → "LMS YouTube"
2. **Search**: "YouTube Data API v3" → **ENABLE**
3. **Credentials** → **+ CREATE** → **OAuth client ID**
4. **Web application**
5. **Authorized origins**:
   ```
   http://localhost:5173
   http://localhost:5174
   ```
6. **CREATE** → **Copy Client ID**

💾 **Lưu lại**: `YOUR_GOOGLE_CLIENT_ID_HERE`

---

## **Bước 2️⃣: Lấy YouTube Channel ID (1 phút)**

Truy cập YouTube channel của bạn:
```
https://www.youtube.com/@YOUR_CHANNEL
```

Copy phần `UC...` từ URL:
```
https://www.youtube.com/channel/UC12345678901234567890
                              ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑
```

💾 **Lưu lại**: `UCxxxxxxxxxxxxxxxxxx`

---

## **Bước 3️⃣: Setup Backend (1 phút)**

```bash
cd backend

# Cài thư viện
npm install googleapis axios

# Tạo/cập nhật .env
echo 'YOUTUBE_CHANNEL_ID=UCxxxxxxxxxxxxxxxxxx' >> .env

# Kiểm tra server
npm run dev
```

✅ **Kết quả**: "Backend server is running on port 5000"

**Files đã được tạo sẵn:**
- ✅ `youtubeController.js`
- ✅ `youtubeRoutes.js`

---

## **Bước 4️⃣: Setup Frontend (1 phút)**

```bash
cd frontend

# Cài thư viện
npm install @react-oauth/google react-player

# Tạo .env
cat > .env << EOF
REACT_APP_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
VITE_API_URL=http://localhost:5000/api
EOF

# Kiểm tra
npm run dev
```

✅ **Kết quả**: "Local: http://localhost:5173"

---

## **Bước 5️⃣: Sử Dụng Component**

### Import:
```javascript
import VideoGuard from '../components/VideoGuard';
```

### Sử dụng:
```javascript
<VideoGuard 
  youtubeUrl="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  channelId="UCxxxxxxxxxxxxxxxxxx"
  title="Bài Học: HTML Cơ Bản"
/>
```

---

## **🧪 Test Nhanh**

### Test 1: Mở browser
```
http://localhost:5173
```

### Test 2: Click video
→ Hiển thị "🔐 Đăng nhập bằng Google"

### Test 3: Đăng nhập
→ Nếu chưa subscribe: "❌ Vui lòng subscribe"
→ Nếu đã subscribe: Hiển thị video ✅

---

## **⚠️ Lỗi Thường Gặp**

| Lỗi | Fix |
|-----|-----|
| "Invalid Client ID" | Kiểm tra lại `.env` frontend |
| "cors error" | Thêm `http://localhost:5173` vào Google Authorized Origins |
| "404 /api/youtube" | Backend chưa khởi động hoặc route sai |
| "Access Denied" | YouTube API chưa được ENABLE |

---

## **✨ Xong!**

Bạn vừa hoàn thành Subscribe-to-Watch feature! 🎉

### Tiếp theo:
- 📖 Đọc `YOUTUBE_SETUP_GUIDE.md` để hiểu chi tiết
- ✅ Xem `IMPLEMENTATION_CHECKLIST.md` để kiểm tra đầy đủ
- 🔧 Customize UI theo design của bạn

---

## **🎬 Ví Dụ Hoàn Chỉnh**

```javascript
// File: pages/LessonPage.jsx

import React from 'react';
import VideoGuard from '../components/VideoGuard';

export default function LessonPage() {
  return (
    <div className="p-8">
      <h1>📚 HTML Cơ Bản</h1>
      
      {/* Video được bảo vệ */}
      <VideoGuard 
        youtubeUrl="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        channelId="UCxxxxxxxxxxxxxxxxxx"
        title="Giới Thiệu HTML"
      />
      
      <div className="mt-8">
        <h2>📝 Ghi Chú</h2>
        <p>Nội dung bài học...</p>
      </div>
    </div>
  );
}
```

---

## **📞 Support**

Gặp vấn đề?
1. Kiểm tra DevTools Console (F12)
2. Kiểm tra Backend Logs
3. Đọc `YOUTUBE_SETUP_GUIDE.md` phần "LỖI THƯỜNG GẶP"

🚀 **Ready to go!**
