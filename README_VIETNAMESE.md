# 📺 Subscribe-to-Watch Feature - Hướng Dẫn Toàn Bộ (Tiếng Việt)

## **📌 GIẢI THÍCH CHUNG**

Tính năng **"Subscribe-to-Watch"** là gì?

> Một hệ thống bảo vệ video YouTube trong ứng dụng học tập. 
> **User phải subscribe vào channel YouTube của bạn mới có thể xem video bài học.**

### **Cách hoạt động:**

```
User click video
    ↓
VideoGuard component kiểm tra: User đã đăng nhập chưa?
    ├─ Chưa → Yêu cầu "Đăng nhập bằng Google" 🔐
    └─ Rồi → Kiểm tra: User đã subscribe channel chưa?
            ├─ Rồi → Hiển thị video ✅
            └─ Chưa → Yêu cầu "Hãy subscribe" ❌
```

---

## **📂 DANH SÁCH FILES ĐÃ TẠO**

### **Backend:**
```
backend/
├── src/
│   ├── controllers/
│   │   └── youtubeController.js ✅ MỚI
│   │       ├── checkSubscription() - Kiểm tra subscription
│   │       └── getChannelInfo() - Lấy info channel
│   │
│   └── routes/
│       ├── youtubeRoutes.js ✅ MỚI
│       │   ├── POST /api/youtube/check-subscription
│       │   └── POST /api/youtube/channel-info
│       │
│       └── index.js ✅ CẬP NHẬT
│           └── Thêm: router.use('/youtube', youtubeRoutes)
│
└── .env ✅ CẬP NHẬT
    └── YOUTUBE_CHANNEL_ID=UC...
```

### **Frontend:**
```
frontend/
├── src/
│   ├── components/
│   │   └── VideoGuard.jsx ✅ MỚI
│   │       ├── State: isSubscribed, isLoading, error...
│   │       ├── Hàm: checkSubscription(), getChannelInfo()...
│   │       └── UI: 3 giao diện (Loading, Locked, Unlocked)
│   │
│   └── main.jsx ✅ CẬP NHẬT
│       └── Import GoogleOAuthProvider
│
└── .env ✅ CẬP NHẬT
    ├── REACT_APP_GOOGLE_CLIENT_ID=...
    └── VITE_API_URL=http://localhost:5000/api
```

### **Hướng dẫn:**
```
✅ QUICK_START.md - Bắt đầu nhanh (5 phút)
✅ YOUTUBE_SETUP_GUIDE.md - Hướng dẫn chi tiết (30 phút)
✅ IMPLEMENTATION_CHECKLIST.md - Danh sách kiểm tra
✅ README_VIETNAMESE.md - File này
```

---

## **⚙️ KIẾN TRÚC SYSTEM**

### **Component Architecture:**

```
App
├── GoogleOAuthProvider (wraps entire app)
└── Routes
    └── LessonPage
        └── VideoGuard
            ├── Google Login Button
            ├── Video Player (ReactPlayer)
            └── Lock Screen
```

### **API Flow:**

```
FRONTEND                          BACKEND                         GOOGLE
   │                               │                               │
   ├─ User click "Đăng nhập" ───→  │                               │
   │                               │                               │
   ├─ Google OAuth Popup ◄─────────┴───────────────────────────────│
   │                               │                               │
   ├─ User chọn account  ─────────┐│                               │
   │                           │   │                               │
   │  access_token ◄──────────┘│   │                               │
   │                           │   │                               │
   │  POST check-subscription ──→ youtubeController.js            │
   │  { access_token: "..." }      │                               │
   │                               ├─ New OAuth2 Client ──────────→│
   │                               │                               │
   │                               ├─ youtube.subscriptions.list()─→
   │                               │                               │
   │  Response                   ◄─┤                               │
   │  { isSubscribed: true/false }  │                               │
   │                               │                               │
   └─ Update UI                    │                               │
      ├─ true  → Show video       
      └─ false → Show lock message 
```

---

## **🔐 SECURITY FLOW**

### **Google OAuth Scopes:**

```javascript
scope: 'https://www.googleapis.com/auth/youtube.readonly'
                    ↓
    Chi cho phép:
    ✅ Xem danh sách subscriptions của user
    ✅ Xem info channel công khai
    ❌ Không thể thay đổi subscription
    ❌ Không thể upload video
```

### **Token Lifecycle:**

```javascript
1. User đăng nhập → Google trả access_token (hết hạn trong ~1 giờ)
2. Frontend gửi access_token tới backend
3. Backend dùng token để gọi YouTube API
4. Backend KHÔNG lưu token vào database
5. Token tự hết hạn (frontend không persistent)
6. User phải đăng nhập lại để kiểm tra lại (an toàn)
```

---

## **🛠️ CÁCH SỬ DỤNG TRONG COMPONENT**

### **1️⃣ Import:**

```javascript
import VideoGuard from '../components/VideoGuard';
```

### **2️⃣ Props:**

```javascript
<VideoGuard
  youtubeUrl="https://www.youtube.com/watch?v=dQw4w9WgXcQ"     // Bắt buộc
  channelId="UCxxxxxxxxxxxxxxxxxx"                              // Bắt buộc
  title="Bài Giảng: HTML Cơ Bản"                               // Tuỳ chọn
/>
```

### **3️⃣ Ví dụ Hoàn Chỉnh:**

```javascript
import React from 'react';
import VideoGuard from '../components/VideoGuard';

export default function LessonPage() {
  const lesson = {
    id: 1,
    title: 'HTML Cơ Bản',
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    channelId: 'UCxxxxxxxxxxxxxxxxxx'
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-6">
        📚 {lesson.title}
      </h1>

      {/* Video được bảo vệ */}
      <div className="mb-8">
        <VideoGuard
          youtubeUrl={lesson.youtubeUrl}
          channelId={lesson.channelId}
          title={lesson.title}
        />
      </div>

      {/* Nội dung bài học */}
      <div className="prose prose-lg">
        <h2>📝 Ghi Chú</h2>
        <p>
          HTML (HyperText Markup Language) là ngôn ngữ đánh dấu 
          được sử dụng để tạo các trang web...
        </p>
      </div>
    </div>
  );
}
```

---

## **📊 THÔNG TIN API**

### **Endpoint 1: Kiểm Tra Subscription**

```
POST /api/youtube/check-subscription

Request:
{
  "access_token": "ya29.a0AfH6SMBx..."
}

Response Success (Subscribed):
{
  "success": true,
  "isSubscribed": true,
  "message": "User is subscribed"
}

Response Success (Not Subscribed):
{
  "success": true,
  "isSubscribed": false,
  "message": "User is not subscribed"
}

Response Error:
{
  "success": false,
  "isSubscribed": false,
  "message": "Invalid or expired access token",
  "error": "invalid_grant"
}
```

### **Endpoint 2: Lấy Thông Tin Channel** (Tuỳ chọn)

```
POST /api/youtube/channel-info

Request:
{
  "access_token": "ya29.a0AfH6SMBx..."
}

Response:
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

## **🎨 UI STATE DIAGRAM**

### **State 1: Loading**
```
┌─────────────────────────────────────┐
│    🔄 Đang kiểm tra trạng thái...   │
│                                     │
│       [Loading spinner...]          │
└─────────────────────────────────────┘
```

### **State 2: Not Logged In**
```
┌─────────────────────────────────────┐
│              🔐                      │
│      Video Bài Học                  │
│                                     │
│   Vui lòng đăng nhập bằng Google    │
│                                     │
│   [📺 Đăng nhập bằng Google]        │
└─────────────────────────────────────┘
```

### **State 3: Logged In - Not Subscribed**
```
┌─────────────────────────────────────┐
│              🔒                      │
│          ❌ Video bị khóa            │
│                                     │
│ Vui lòng subscribe vào channel!     │
│                                     │
│ [🎬 Subscribe Channel YouTube]     │
│                                     │
│ Sau khi subscribe, hãy nhấp:        │
│ [🔄 Kiểm tra lại]                   │
└─────────────────────────────────────┘
```

### **State 4: Logged In - Subscribed**
```
┌─────────────────────────────────────┐
│   [My Learning Channel ✅ Đã theo   │
│    dõi 150K subscribers]            │
│                                     │
│   ┌─────────────────────────────┐   │
│   │     Video Player Area       │   │
│   │                             │   │
│   │    [Play button]            │   │
│   │    Progress bar             │   │
│   │    Volume, Fullscreen, etc  │   │
│   └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

---

## **💾 STATE MANAGEMENT (Frontend)**

```javascript
const VideoGuard = () => {
  // Subscription status
  const [isSubscribed, setIsSubscribed] = useState(false);
  
  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasLoggedIn, setHasLoggedIn] = useState(false);
  
  // User data
  const [userInfo, setUserInfo] = useState(null);
  
  // Channel data
  const [channelInfo, setChannelInfo] = useState(null);
  
  // Hàm cập nhật state
  const checkSubscription = async (accessToken) => {
    setIsLoading(true);
    try {
      const response = await httpClient.post(
        '/youtube/check-subscription',
        { access_token: accessToken }
      );
      setIsSubscribed(response.data.isSubscribed);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
};
```

---

## **🔧 CẤU HÌNH ENVIRONMENT**

### **Backend .env:**
```env
# YouTube Configuration
YOUTUBE_CHANNEL_ID=UCxxxxxxxxxxxxxxxxxx

# Server Configuration
PORT=5000
NODE_ENV=development

# Database (Existing)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=lms_db
```

### **Frontend .env:**
```env
# Google OAuth
REACT_APP_GOOGLE_CLIENT_ID=123456789.apps.googleusercontent.com

# Backend API
VITE_API_URL=http://localhost:5000/api
```

---

## **⚡ QUICK REFERENCE**

### **Tóm tắt công việc cần làm:**

| Bước | Mục | Mã lệnh | Status |
|------|-----|---------|--------|
| 1 | Lấy Google Client ID | - | ✅ Cần làm |
| 2 | Lấy YouTube Channel ID | - | ✅ Cần làm |
| 3 | Cài backend libs | `npm install googleapis axios` | ✅ Done |
| 4 | Cài frontend libs | `npm install @react-oauth/google react-player` | ✅ Done |
| 5 | Set up backend .env | `YOUTUBE_CHANNEL_ID=...` | ✅ Cần làm |
| 6 | Set up frontend .env | `REACT_APP_GOOGLE_CLIENT_ID=...` | ✅ Cần làm |
| 7 | Test backend | `npm run dev` | ✅ Cần làm |
| 8 | Test frontend | `npm run dev` | ✅ Cần làm |
| 9 | Sử dụng VideoGuard | Import + sử dụng | ✅ Sẵn sàng |

### **Code cần thay đổi:**

1. **backend/.env**: Thêm `YOUTUBE_CHANNEL_ID=UCxxxxxxxxxxxxxxxxxx`
2. **frontend/.env**: Thêm `REACT_APP_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID`
3. **Component of choice**: Import `VideoGuard` + sử dụng

---

## **🎓 GIẢI THÍCH KỸ THUẬT**

### **Tại sao cần access_token?**

YouTube API v3 là private API - chỉ user xác thực mới có quyền:
```
YouTube API:
  ├─ Public info (video, channel info) - không cần auth
  └─ User-specific data (subscriptions, playlists) - cần auth

User subscriptions = private data → cần access_token
```

### **Tại sao dùng Google OAuth?**

```
Google OAuth = Cách an toàn để lấy access_token
├─ User không cần chia sẻ password
├─ Google quản lý security
└─ Token có thể revoke bất kỳ lúc nào
```

### **Tại sao không lưu token?**

```
Nếu lưu token (localStorage):
  ❌ Token có thể bị hack nếu localStorage bị xâm phạm
  ❌ Khó revoke token
  ❌ Bảo mật kém

Nếu không lưu token:
  ✅ Token hết hạn tự động
  ✅ User phải re-authenticate
  ✅ An toàn hơn
  ✅ Tốt cho privacy
```

---

## **🚀 BƯỚC TIẾP THEO SAU KHI IMPLEMENT**

### **Nâng cấp 1: Persistent Login** (Optional)
Dùng refresh token để user không phải đăng nhập lại mỗi lần

### **Nâng cấp 2: Multiple Channels**
Cho phép kiểm tra subscription cho nhiều channels

### **Nâng cấp 3: Analytics**
Theo dõi user nào click subscribe

### **Nâng cấp 4: Membership Integration**
Kết hợp YouTube membership với LMS

---

## **❓ FAQ - CÂU HỎI THƯỜNG GẶP**

**Q: Có mất tiền để dùng YouTube API không?**
A: Miễn phí! Quota miễn phí 10,000 units/ngày (kiểm tra subscription = 1 unit)

**Q: Access token hết hạn bao lâu?**
A: ~1 giờ. Không persistent vì không lưu token.

**Q: Có thể kiểm tra subscription của user khác không?**
A: Không, YouTube API chỉ cho kiểm tra user đang đăng nhập.

**Q: Nếu user chưa subscribe thì làm sao?**
A: Component tự động show link subscribe YouTube.

**Q: Có thể dùng channel khác không?**
A: Có, chỉ cần đổi `YOUTUBE_CHANNEL_ID` trong .env

**Q: Nếu token expire sao?**
A: Component sẽ catch error và show thông báo đăng nhập lại.

---

## **📚 TÀI LIỆU LIÊN QUAN**

- 📖 `QUICK_START.md` - Bắt đầu trong 5 phút
- 📖 `YOUTUBE_SETUP_GUIDE.md` - Hướng dẫn chi tiết 30 phút
- 📖 `IMPLEMENTATION_CHECKLIST.md` - Danh sách kiểm tra đầy đủ

---

## **✨ TỔNG KẾT**

Bạn vừa implement hoàn chỉnh **Subscribe-to-Watch Feature**:

✅ **Backend:**
- API endpoint kiểm tra subscription
- Tích hợp YouTube Data API v3
- Error handling

✅ **Frontend:**
- Component VideoGuard reusable
- Google OAuth 2.0
- Beautiful UI

✅ **Security:**
- Access token không persistent
- Scope limited (readonly)

✅ **Documentation:**
- Hướng dẫn setup chi tiết
- Danh sách kiểm tra
- FAQ & troubleshooting

**👉 Bước tiếp theo: Đọc `QUICK_START.md` để bắt đầu!**

---

**Tác giả**: GitHub Copilot  
**Ngôn ngữ**: Tiếng Việt  
**Phiên bản**: 1.0  
**Cập nhật**: 2026
