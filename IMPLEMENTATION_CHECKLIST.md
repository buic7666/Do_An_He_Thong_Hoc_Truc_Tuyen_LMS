# ✅ Danh Sách Kiểm Tra Triển Khai Subscribe-to-Watch

## **Tóm Tắt Cách Hoạt Động**

```
┌────────────────────────────────────────────────────────────────┐
│                   SUBSCRIBE-TO-WATCH FLOW                       │
└────────────────────────────────────────────────────────────────┘

VIDEO GUARD COMPONENT (Frontend)
├── Trạng thái: Chưa đăng nhập
│   └─→ Hiển thị nút "Đăng nhập bằng Google" 🔐
│
├── [User nhấp nút Đăng nhập]
│   └─→ Google OAuth Popup
│   └─→ User chọn tài khoản Google
│   └─→ Google trả về access_token
│
└── Trạng thái: Đã đăng nhập
    ├── Gọi API: POST /api/youtube/check-subscription
    │   └─→ Gửi access_token
    │
    ├── Backend kiểm tra với YouTube API
    │   └─→ youtube.subscriptions.list()
    │
    ├── Response: { isSubscribed: true/false }
    │   │
    │   ├─→ Nếu true: Hiển thị video player ✅
    │   │
    │   └─→ Nếu false: Hiển thị unlock screen ❌
    │       ├─→ Thông báo "Vui lòng subscribe"
    │       ├─→ Link subscribe YouTube
    │       └─→ Nút "Kiểm tra lại"
```

---

## **📋 DANH SÁCH KIỂM TRA TRIỂN KHAI**

### **BACKEND CHECKLIST**

- [ ] **Bước 1: Cài đặt thư viện**
  ```bash
  npm install googleapis axios dotenv
  ```

- [ ] **Bước 2: Tạo youtubeController.js**
  📍 Vị trí: `backend/src/controllers/youtubeController.js`
  ```javascript
  // ✅ Đã tạo sẵn
  // Hàm: checkSubscription()
  // Hàm: getChannelInfo()
  ```

- [ ] **Bước 3: Tạo youtubeRoutes.js**
  📍 Vị trí: `backend/src/routes/youtubeRoutes.js`
  ```javascript
  // ✅ Đã tạo sẵn
  // Route: POST /api/youtube/check-subscription
  // Route: POST /api/youtube/channel-info
  ```

- [ ] **Bước 4: Cập nhật routes/index.js**
  ```javascript
  // ✅ Đã cập nhật
  const youtubeRoutes = require('./youtubeRoutes');
  router.use('/youtube', youtubeRoutes);
  ```

- [ ] **Bước 5: Tạo .env**
  ```env
  YOUTUBE_CHANNEL_ID=UCxxxxxxxxxxxxxxxxxx
  PORT=5000
  # ... (các config khác)
  ```
  ⚠️ **Thay `UCxxxxxxxxxxxxxxxxxx` bằng Channel ID thực của bạn!**

- [ ] **Bước 6: Test Backend**
  ```bash
  npm run dev
  # Kiểm tra: Backend running on port 5000 ✅
  ```

---

### **FRONTEND CHECKLIST**

- [ ] **Bước 1: Cài đặt thư viện**
  ```bash
  npm install @react-oauth/google react-player axios
  ```

- [ ] **Bước 2: Tạo VideoGuard.jsx**
  📍 Vị trí: `frontend/src/components/VideoGuard.jsx`
  ```javascript
  // ✅ Đã tạo sẵn
  // Props: youtubeUrl, channelId, title
  // States: isSubscribed, isLoading, error, etc.
  // Hàm: checkSubscription(), getChannelInfo(), handleVerifyAgain()
  ```

- [ ] **Bước 3: Cập nhật main.jsx**
  ```javascript
  // ✅ Đã cập nhật
  import { GoogleOAuthProvider } from '@react-oauth/google';
  
  ReactDOM.createRoot(document.getElementById('root')).render(
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  );
  ```

- [ ] **Bước 4: Tạo .env**
  ```env
  REACT_APP_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE
  VITE_API_URL=http://localhost:5000/api
  ```
  ⚠️ **Thay `YOUR_CLIENT_ID_HERE` bằng Google Client ID!**

- [ ] **Bước 5: Test Frontend**
  ```bash
  npm run dev
  # Kiểm tra: Local: http://localhost:5173 ✅
  ```

---

### **GOOGLE OAUTH SETUP CHECKLIST**

- [ ] **Bước 1: Truy cập Google Cloud Console**
  🔗 https://console.cloud.google.com/

- [ ] **Bước 2: Tạo dự án mới**
  - Project name: "LMS YouTube Feature"

- [ ] **Bước 3: Bật YouTube Data API v3**
  - Tìm kiếm: "YouTube Data API v3"
  - Nhấp "ENABLE"

- [ ] **Bước 4: Tạo OAuth Credentials**
  - Vào "Credentials"
  - "CREATE CREDENTIALS" → "OAuth client ID"
  - Application type: "Web application"

- [ ] **Bước 5: Thêm Authorized Origins**
  ```
  http://localhost:5173
  http://localhost:5174
  http://localhost
  ```

- [ ] **Bước 6: Thêm Redirect URIs**
  ```
  http://localhost:5173/
  http://localhost:5174/
  http://localhost/
  ```

- [ ] **Bước 7: Copy Client ID**
  - Lưu Client ID để dùng trong .env

---

### **YOUTUBE CHANNEL SETUP CHECKLIST**

- [ ] **Bước 1: Truy cập YouTube**
  🔗 https://www.youtube.com/

- [ ] **Bước 2: Tạo kênh (nếu chưa có)**
  - Avatar → "Tạo kênh"

- [ ] **Bước 3: Lấy Channel ID**
  - Cách 1: Vào kênh → Avatar → "Cài đặt tài khoản"
  - Cách 2: Copy từ URL: `youtube.com/channel/UC...`

- [ ] **Bước 4: Lưu Channel ID**
  - Thêm vào backend `.env`: `YOUTUBE_CHANNEL_ID=UC...`

---

## **🧪 TEST CASES**

### **Test Case 1: Chưa Đăng Nhập**

**Các bước:**
1. Mở component VideoGuard
2. Không nhấp nút nào

**Kết quả mong đợi:**
- ✅ Hiển thị giao diện khóa 🔐
- ✅ Có nút "Đăng nhập bằng Google"
- ✅ Không có lỗi console

**Code test:**
```javascript
<VideoGuard 
  youtubeUrl="https://www.youtube.com/watch?v=..." 
  channelId="UCxxxxxxxxxxxxxxxxxx"
/>
```

---

### **Test Case 2: Đăng Nhập Thành Công**

**Các bước:**
1. Nhấp nút "Đăng nhập bằng Google"
2. Chọn tài khoản Google
3. Chấp nhận permissions

**Kết quả mong đợi:**
- ✅ Component gọi API `/api/youtube/check-subscription`
- ✅ Hiển thị loading spinner
- ✅ Nhận response từ backend

**Kiểm tra Network Tab:**
```
POST http://localhost:5000/api/youtube/check-subscription
Body: { access_token: "ya29.a0AfH6..." }
Response: { isSubscribed: true/false }
```

---

### **Test Case 3: Chưa Subscribe**

**Các bước:**
1. Đăng nhập bằng account chưa subscribe
2. Chờ backend kiểm tra

**Kết quả mong đợi:**
- ✅ Hiển thị thông báo "❌ Video bị khóa"
- ✅ Có link "🎬 Subscribe Channel YouTube"
- ✅ Có nút "🔄 Kiểm tra lại"
- ✅ Không hiển thị video player

---

### **Test Case 4: Đã Subscribe**

**Các bước:**
1. Đăng nhập bằng account đã subscribe
2. Chờ backend kiểm tra

**Kết quả mong đợi:**
- ✅ Hiển thị video player ReactPlayer
- ✅ Hiển thị thông tin channel (tên, số subscribers)
- ✅ Có badge "✅ Đã theo dõi"
- ✅ Video có thể phát bình thường

---

### **Test Case 5: Kiểm Tra Lại Sau Khi Subscribe**

**Các bước:**
1. Đăng nhập (chưa subscribe)
2. Click link "Subscribe Channel YouTube"
3. Subscribe channel
4. Quay lại app
5. Nhấp nút "🔄 Kiểm tra lại"

**Kết quả mong đợi:**
- ✅ Component gọi lại API check-subscription
- ✅ Backend kiểm tra lại YouTube API
- ✅ Giao diện thay đổi thành "Đã Subscribe"
- ✅ Video player hiển thị

---

## **📊 CÁCH CẤU TRÚC DỮ LIỆU**

### **Frontend: VideoGuard State**

```javascript
{
  // Trạng thái cơ bản
  isSubscribed: false,          // Đã subscribe?
  isLoading: false,             // Đang load?
  error: null,                  // Lỗi nào?
  hasLoggedIn: false,           // Đã đăng nhập?
  
  // Thông tin user
  userInfo: {
    access_token: "ya29...",
    token_type: "Bearer",
    scope: "https://www.googleapis.com/auth/youtube.readonly",
    expires_in: 3599
  },
  
  // Thông tin channel
  channelInfo: {
    channelName: "My Learning Channel",
    channelDescription: "...",
    channelThumbnail: "https://...",
    subscriberCount: "150000",
    videoCount: "500",
    channelUrl: "https://www.youtube.com/channel/..."
  }
}
```

### **Backend: API Response**

```javascript
// Success - User subscribed
{
  success: true,
  isSubscribed: true,
  message: "User is subscribed"
}

// Success - User not subscribed
{
  success: true,
  isSubscribed: false,
  message: "User is not subscribed"
}

// Error - Invalid token
{
  success: false,
  isSubscribed: false,
  message: "Invalid or expired access token",
  error: "invalid_grant"
}
```

---

## **🐛 DEBUG TIPS**

### **1. Kiểm tra Google Client ID**
```javascript
// In main.jsx hoặc app.jsx
console.log('Google Client ID:', process.env.REACT_APP_GOOGLE_CLIENT_ID);
// Output: "123456789.apps.googleusercontent.com"
```

### **2. Kiểm tra Access Token**
```javascript
// In VideoGuard.jsx
console.log('Access Token:', codeResponse.access_token);
// Output: "ya29.a0AfH6SMBx..."
```

### **3. Kiểm tra API Response**
```javascript
// Mở DevTools → Network Tab
// Filter: youtube
// Xem POST /api/youtube/check-subscription
// Response: { isSubscribed: true/false }
```

### **4. Kiểm tra Backend Logs**
```bash
# Terminal chạy backend
npm run dev

# Nên thấy dòng:
# Backend server is running on port 5000
# (Hoặc lỗi nếu có vấn đề)
```

### **5. Kiểm tra Console Errors**
```javascript
// Browser DevTools → Console Tab
// Tìm các lỗi liên quan đến:
// - Google OAuth
// - API calls
// - Component rendering
```

---

## **🔒 SECURITY CHECKLIST**

- [ ] **Không hardcode Client ID trong code**
  - ❌ `const CLIENT_ID = "123456..."`
  - ✅ `process.env.REACT_APP_GOOGLE_CLIENT_ID`

- [ ] **Không lưu Access Token vào localStorage (tuỳ chọn)**
  - Access token được lưu trong state, không persistent
  - Là hành động an toàn vì token hết hạn khi reload

- [ ] **Thêm Authorization Middleware (Backend)**
  - Chỉ user đã xác thực mới được kiểm tra subscription
  - Tránh spam API calls

- [ ] **Xác thực Channel ID có tồn tại**
  - Kiểm tra YOUTUBE_CHANNEL_ID hợp lệ trước khi deploy

- [ ] **Xử lý lỗi token hết hạn**
  - Backend trả về 401 nếu token invalid
  - Frontend yêu cầu user đăng nhập lại

---

## **📚 File Structure Cuối Cùng**

```
DoAn_TotNghiep/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   └── youtubeController.js          ✅ TẠO MỚI
│   │   ├── routes/
│   │   │   ├── youtubeRoutes.js              ✅ TẠO MỚI
│   │   │   └── index.js                      ✅ CẬP NHẬT
│   ├── .env                                  ✅ CẬP NHẬT
│   └── .env.example                          ✅ CẬP NHẬT
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── VideoGuard.jsx                ✅ TẠO MỚI
│   │   └── main.jsx                          ✅ CẬP NHẬT
│   ├── .env                                  ✅ CẬP NHẬT
│   └── .env.example                          ✅ CẬP NHẬT
│
└── YOUTUBE_SETUP_GUIDE.md                    ✅ TẠO MỚI
└── IMPLEMENTATION_CHECKLIST.md               ✅ TẠO MỚI
```

---

## **✨ TÍNH NĂNG HOÀN CHỈNH**

Sau khi hoàn thành tất cả steps, bạn sẽ có:

✅ **Backend Features:**
- API endpoint kiểm tra subscription
- Tích hợp YouTube Data API v3
- Xử lý lỗi authentication

✅ **Frontend Features:**
- Component VideoGuard reusable
- Google OAuth 2.0 integration
- Loading states & error handling
- Responsive UI với Tailwind CSS
- Multi-language support (Vietnamese)

✅ **Security:**
- Access token không persistent
- Scope limited (readonly)
- Environment variables setup

✅ **UX:**
- 3 giao diện: Loading, Locked, Unlocked
- Clear call-to-action buttons
- Channel info display
- Verify again functionality

---

## **🎯 Bước Tiếp Theo (Optional)**

### **Nâng cấp 1: Persistent Login**
```javascript
// Lưu refresh token để user không phải đăng nhập lại
localStorage.setItem('refresh_token', refreshToken);
```

### **Nâng cấp 2: Multiple Channels**
```javascript
// Kiểm tra subscription cho nhiều channels
const channelsToCheck = ['UC...', 'UC...', 'UC...'];
const results = await Promise.all(
  channelsToCheck.map(id => checkSubscription(id))
);
```

### **Nâng cấp 3: Subscription Required for Download**
```javascript
// Yêu cầu subscribe để download tài liệu
if (isSubscribed) {
  <button>📥 Download Materials</button>
}
```

### **Nâng cấp 4: Analytics Tracking**
```javascript
// Theo dõi user nào click subscribe
logEvent('video_unlock', {
  userId: currentUser.id,
  channelId: channelId,
  timestamp: new Date()
});
```

---

## **❓ FAQ**

**Q: Sau bao lâu token hết hạn?**
A: Access token hết hạn sau ~1 giờ. Nếu cần persistent login, dùng refresh token.

**Q: Có thể kiểm tra subscription mà không cần access_token không?**
A: Không, YouTube API yêu cầu authentication. Phải dùng OAuth.

**Q: Channel phải public không?**
A: Không, channel private cũng được. Subscriber vẫn có thể được kiểm tra.

**Q: Có thể kiểm tra subscription của user khác không?**
A: Không, YouTube API chỉ cho phép kiểm tra subscription của user đang đăng nhập (scope `mine: true`).

**Q: Có mất tiền không?**
A: Miễn phí cho đến 10,000 quota units/day. Kiểm tra subscription = 1 unit, rất rẻ.

---

## **📞 Support**

Nếu gặp vấn đề:
1. Kiểm tra lại YOUTUBE_SETUP_GUIDE.md
2. Xem browser console (DevTools)
3. Xem backend logs
4. Đảm bảo tất cả environment variables đúng

🎉 **Chúc mừng triển khai thành công!**
