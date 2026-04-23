# 🎬 Hướng Dẫn Cấu Hình Subscribe-to-Watch Feature

## **BƯỚC 1: Lấy Google Client ID**

### **1.1 Truy cập Google Cloud Console**
1. Mở link: https://console.cloud.google.com/
2. Đăng nhập bằng tài khoản Google (hoặc tạo tài khoản mới)
3. Tạo dự án mới:
   - Nhấp "Select a Project" → "NEW PROJECT"
   - Nhập tên: "LMS YouTube Feature"
   - Nhấp "CREATE"

### **1.2 Bật YouTube Data API v3**
1. Tìm kiếm "YouTube Data API v3" trong thanh tìm kiếm
2. Nhấp vào kết quả
3. Nhấp nút **"ENABLE"** (màu xanh)
4. Chờ 1-2 phút để API được bật

### **1.3 Tạo OAuth 2.0 Credentials**
1. Vào **"Credentials"** (Bên trái menu)
2. Nhấp **"+ CREATE CREDENTIALS"**
3. Chọn **"OAuth client ID"**
4. Nếu được yêu cầu, nhấp **"Configure OAuth Consent Screen"** trước:
   - Chọn **"External"**
   - Nhấp **"CREATE"**
   - Nhập thông tin:
     - **App name**: "LMS YouTube Feature"
     - **User support email**: email của bạn
     - **Developer contact**: email của bạn
   - Nhấp **"SAVE AND CONTINUE"**
   - Skip các bước còn lại, nhấp **"SAVE AND CONTINUE"** → **"BACK TO DASHBOARD"**

5. Quay lại **"Credentials"**, nhấp **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
6. Chọn **Application type**: "Web application"
7. Thêm **Authorized JavaScript origins**:
   ```
   http://localhost:5173
   http://localhost:5174
   http://localhost
   http://127.0.0.1:5173
   http://127.0.0.1:5174
   ```
8. Thêm **Authorized redirect URIs**:
   ```
   http://localhost:5173/
   http://localhost:5174/
   http://localhost/
   ```
9. Nhấp **"CREATE"**

### **1.4 Lấy Client ID**
- Một popup sẽ hiển thị **Client ID**
- **Copy** Client ID này (sẽ cần dùng)
- Nếu không có popup, vào **"Credentials"** → "OAuth 2.0 Client IDs" → Copy "Client ID"

---

## **BƯỚC 2: Lấy YouTube Channel ID**

### **Cách 1: Từ trang kênh của bạn**
1. Truy cập: https://www.youtube.com/@YOUR_CHANNEL_NAME
2. Nhấp vào avatar → **"Tạo kênh"** hoặc vào **Cài đặt tài khoản**
3. Vào **Kênh nâng cao** → Tìm **Channel ID**
4. Copy Channel ID (ví dụ: `UCxxxxxxxxxxxxxxxxxx`)

### **Cách 2: Từ URL**
- Vào trang kênh YouTube của bạn
- Copy phần `UCxxxxxxxxxxxxxxxxxx` từ URL
- Ví dụ: `https://www.youtube.com/channel/UCxxxxxxxxxxxxxxxxxx`

---

## **BƯỚC 3: Cài Đặt Backend**

### **3.1 Cài đặt thư viện**
```bash
cd backend
npm install googleapis axios dotenv
```

### **3.2 Cập nhật `.env` file**
Tạo file `backend/.env`:
```env
# ... (các cấu hình khác)

# YouTube Configuration
YOUTUBE_CHANNEL_ID=UCxxxxxxxxxxxxxxxxxx
```

**Thay `UCxxxxxxxxxxxxxxxxxx` bằng Channel ID thực của bạn!**

### **3.3 Kiểm tra Backend**
- Files đã tạo:
  - ✅ `backend/src/controllers/youtubeController.js`
  - ✅ `backend/src/routes/youtubeRoutes.js`
  - ✅ `backend/src/routes/index.js` (đã cập nhật)

- Thử chạy backend:
```bash
npm run dev
```

Nếu không có lỗi → Backend OK ✅

---

## **BƯỚC 4: Cài Đặt Frontend**

### **4.1 Cài đặt thư viện**
```bash
cd frontend
npm install @react-oauth/google react-player axios
```

### **4.2 Tạo `.env` file**
Tạo file `frontend/.env`:
```env
REACT_APP_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
VITE_API_URL=http://localhost:5000/api
```

**Thay `YOUR_GOOGLE_CLIENT_ID_HERE` bằng Client ID từ Bước 1.4!**

### **4.3 Cập nhật `main.jsx`**
- File đã được cập nhật ✅
- Đảm bảo có:
```javascript
import { GoogleOAuthProvider } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID_HERE';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {/* ... */}
    </GoogleOAuthProvider>
  </React.StrictMode>,
);
```

### **4.4 Kiểm tra Frontend**
- File component đã tạo: ✅ `frontend/src/components/VideoGuard.jsx`
- Thử chạy:
```bash
npm run dev
```

Nếu không có lỗi → Frontend OK ✅

---

## **BƯỚC 5: Sử Dụng Component VideoGuard**

### **5.1 Import Component**
Trong screen hoặc component của bạn (ví dụ: `ManHinhHocTap.jsx`):

```javascript
import VideoGuard from '../components/VideoGuard';
```

### **5.2 Sử dụng VideoGuard**
```javascript
function ManHinhHocTap() {
  const youtubeUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
  const channelId = 'UCxxxxxxxxxxxxxxxxxx'; // Thay bằng Channel ID của bạn

  return (
    <div>
      <h1>Bài Học</h1>
      
      {/* Bọc video YouTube bằng VideoGuard */}
      <VideoGuard 
        youtubeUrl={youtubeUrl}
        channelId={channelId}
        title="Bài Giảng: HTML Cơ Bản"
      />
    </div>
  );
}
```

### **5.3 Props của VideoGuard**

| Prop | Kiểu | Bắt buộc | Mô tả |
|------|------|---------|-------|
| `youtubeUrl` | string | ✅ | URL video YouTube (ví dụ: `https://www.youtube.com/watch?v=...`) |
| `channelId` | string | ❌ | ID channel YouTube (mặc định: placeholder) |
| `title` | string | ❌ | Tiêu đề video (mặc định: "Video Bài Học") |

### **5.4 Ví dụ Hoàn Chỉnh**

```javascript
import React from 'react';
import VideoGuard from '../components/VideoGuard';

function HocBaiGiang() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">
        📚 HTML Cơ Bản - Bài 1
      </h1>

      {/* Video được bảo vệ */}
      <VideoGuard 
        youtubeUrl="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        channelId="UCxxxxxxxxxxxxxxxxxx"
        title="Giới Thiệu HTML"
      />

      {/* Nội dung khác */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">📝 Ghi Chú</h2>
        <p>Nội dung bài học...</p>
      </div>
    </div>
  );
}

export default HocBaiGiang;
```

---

## **BƯỚC 6: Kiểm Thử Tính Năng**

### **6.1 Khởi động cả Backend và Frontend**

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```
Kết quả mong đợi:
```
Backend server is running on port 5000
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```
Kết quả mong đợi:
```
Local: http://localhost:5173 (hoặc 5174)
```

### **6.2 Test Scenario 1: Chưa Đăng Nhập**
1. Mở: `http://localhost:5173`
2. Nhấp vào video
3. **Kết quả mong đợi**: Hiển thị nút "Đăng nhập bằng Google" 🔐

### **6.3 Test Scenario 2: Đã Đăng Nhập - Chưa Subscribe**
1. Nhấp nút "Đăng nhập bằng Google"
2. Đăng nhập bằng tài khoản Google của bạn
3. **Kết quả mong đợi**: 
   - Hiển thị thông báo "❌ Video bị khóa"
   - Link "🎬 Subscribe Channel YouTube"
   - Nút "🔄 Kiểm tra lại"

### **6.4 Test Scenario 3: Đã Subscribe**
1. Click vào link subscribe
2. Subscribe vào channel
3. Quay lại app
4. Nhấp nút "🔄 Kiểm tra lại"
5. **Kết quả mong đợi**:
   - Video hiển thị với info channel
   - Có badge "✅ Đã theo dõi"
   - Video player bình thường

---

## **LỖI THƯỜNG GẶP VÀ CÁCH FIX**

### **Lỗi: "Invalid Client ID"**
**Nguyên nhân**: Client ID không chính xác hoặc không tồn tại
**Fix**:
1. Kiểm tra lại file `.env` của frontend
2. Đảm bảo đã copy đúng Client ID từ Google Cloud Console
3. Reload trang

### **Lỗi: "Access Denied - Invalid Scope"**
**Nguyên nhân**: Scope YouTube không được bật hoặc cấu hình sai
**Fix**:
1. Vào Google Cloud Console
2. Đảm bảo YouTube Data API v3 đã được ENABLE
3. Xóa ứng dụng authorization cũ từ Google Account:
   - Vào: https://myaccount.google.com/permissions
   - Tìm app của bạn → Xóa
4. Thử lại

### **Lỗi: "cors error"**
**Nguyên nhân**: Authorized JavaScript origins không được cấu hình
**Fix**:
1. Vào Google Cloud Console → Credentials
2. Chỉnh sửa OAuth Client ID
3. Thêm authorized origins:
   - `http://localhost:5173`
   - `http://localhost:5174`
   - `http://localhost`

### **Lỗi: "/api/youtube/check-subscription 404"**
**Nguyên nhân**: Route không được tạo hoặc import sai
**Fix**:
1. Kiểm tra backend logs có lỗi không
2. Đảm bảo đã tạo `youtubeController.js` và `youtubeRoutes.js`
3. Kiểm tra `routes/index.js` có import đúng không:
   ```javascript
   const youtubeRoutes = require('./youtubeRoutes');
   router.use('/youtube', youtubeRoutes);
   ```

---

## **GIẢI THÍCH KỸ THUẬT**

### **Flow Dữ Liệu:**

```
┌─────────────────────────────────────────────────────────────┐
│                          FRONTEND                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. User click video → VideoGuard component loads           │
│  2. User click "Đăng nhập bằng Google"                      │
│  3. Google OAuth popup → User chọn tài khoản                │
│  4. Google trả về access_token                              │
│  5. VideoGuard gửi POST /api/youtube/check-subscription     │
│     với access_token trong body                             │
│                                                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
        ┌──────────────────────────┐
        │   NETWORK REQUEST        │
        │ POST /api/youtube/        │
        │   check-subscription      │
        │                           │
        │ Body:                     │
        │ {                         │
        │   access_token: "..."     │
        │ }                         │
        └──────────────┬───────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                         BACKEND                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. youtubeController.checkSubscription() receives request   │
│  2. Lấy access_token từ request body                        │
│  3. Tạo OAuth2 client với access_token                      │
│  4. Khởi tạo youtube = google.youtube() API client          │
│  5. Gọi youtube.subscriptions.list({                        │
│       mine: true,                                           │
│       forChannelId: YOUTUBE_CHANNEL_ID                      │
│     })                                                       │
│  6. YouTube API trả về subscriptions của user               │
│  7. Kiểm tra: items.length > 0 ? subscribed : not           │
│  8. Trả về response JSON                                    │
│                                                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
        ┌──────────────────────────┐
        │   NETWORK RESPONSE       │
        │                          │
        │ {                        │
        │   isSubscribed: true,    │
        │   message: "..."         │
        │ }                        │
        └──────────────┬───────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. VideoGuard nhận response                                │
│  2. Nếu isSubscribed = true:                               │
│     → Hiển thị video player                                 │
│  3. Nếu isSubscribed = false:                              │
│     → Hiển thị thông báo + link subscribe                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### **Giải Thích Scope YouTube**

```javascript
scope: 'https://www.googleapis.com/auth/youtube.readonly'
```

**Scope này cho phép:**
- ✅ Xem danh sách subscriptions của user
- ✅ Xem thông tin channel công khai
- ❌ Không thể thay đổi subscriptions
- ❌ Không thể upload video

Đây là scope an toàn nhất vì chỉ đọc, không ghi.

### **API Endpoints Backend**

#### **1. POST /api/youtube/check-subscription**
**Mục đích**: Kiểm tra xem user có subscribe channel không

**Request:**
```json
{
  "access_token": "ya29.a0AfH6SMBx..."
}
```

**Response (Subscribed):**
```json
{
  "success": true,
  "isSubscribed": true,
  "message": "User is subscribed"
}
```

**Response (Not Subscribed):**
```json
{
  "success": true,
  "isSubscribed": false,
  "message": "User is not subscribed"
}
```

**Response (Error):**
```json
{
  "success": false,
  "isSubscribed": false,
  "message": "Invalid or expired access token",
  "error": "invalid_grant"
}
```

#### **2. POST /api/youtube/channel-info** (Tuỳ Chọn)
**Mục đích**: Lấy thông tin channel YouTube

**Request:**
```json
{
  "access_token": "ya29.a0AfH6SMBx..."
}
```

**Response:**
```json
{
  "success": true,
  "channelName": "My Learning Channel",
  "channelDescription": "Best programming tutorials",
  "channelThumbnail": "https://...",
  "subscriberCount": "150000",
  "videoCount": "500",
  "channelUrl": "https://www.youtube.com/channel/UCxxxxxxxxxxxxxxxxxx"
}
```

---

## **BẢO MẬT**

### **Lưu ý bảo mật:**

1. **Không bao giờ lưu trữ access_token trên server**
   - ✅ Nhận token từ frontend, dùng ngay, không lưu
   - ❌ Không lưu vào database

2. **Luôn sử dụng HTTPS trong production**
   - Token có thể bị đánh cắp nếu không mã hóa

3. **Xác thực user trên backend**
   - Thêm authentication middleware
   - Chỉ cho phép user xác thực mới gọi API

4. **Sử dụng Environment Variables**
   - Không hardcode Client ID hay Channel ID
   - Dùng `.env` file

### **Ví dụ: Thêm Authentication**

```javascript
// In youtubeRoutes.js
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/check-subscription', authMiddleware, youtubeController.checkSubscription);
```

Chỉ user đã đăng nhập mới có thể kiểm tra subscription.

---

## **KẾT LUẬN**

✅ **Các bước cần làm:**

1. ✅ Lấy Google Client ID (Bước 1)
2. ✅ Lấy YouTube Channel ID (Bước 2)
3. ✅ Cài đặt backend (Bước 3)
4. ✅ Cài đặt frontend (Bước 4)
5. ✅ Sử dụng component VideoGuard (Bước 5)
6. ✅ Kiểm thử (Bước 6)

**Nếu gặp vấn đề:**
- Kiểm tra browser console để xem error message
- Kiểm tra backend logs (terminal chạy server)
- Đảm bảo tất cả environment variables đã được set đúng

🎉 **Chúc mừng! Bạn đã hoàn thành cấu hình Subscribe-to-Watch Feature!**
