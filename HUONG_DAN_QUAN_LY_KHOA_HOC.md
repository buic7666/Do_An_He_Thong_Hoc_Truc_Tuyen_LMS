# 📚 Hướng Dẫn Quản Lý Khóa Học - Quy Trình Step by Step

## 🎯 Tổng Quan Quy Trình

Hệ thống quản lý khóa học của giáo viên giờ đây được tổ chức theo 3 bước (Steps) rõ ràng:

```
STEP 1: Danh Sách Khóa Học
    ↓ (Vào Khóa Học)
STEP 2: Chi Tiết Khóa Học + Danh Sách Chương
    ↓ (Vào Chương)
STEP 3: Chi Tiết Chương + Danh Sách Bài Học
```

---

## 📋 STEP 1: Danh Sách Khóa Học

**URL**: `/teacher/courses`

**Component**: `Step1_DanhSachKhoaHoc.jsx`

**Chức Năng**:
- ✅ Xem danh sách **tất cả khóa học** của giáo viên (được lọc theo user)
- ✅ **Thêm khóa học mới** (form modal)
- ✅ **Sửa khóa học** (cập nhật tên, mô tả, giá)
- ✅ **Xóa khóa học** (xác nhận trước khi xóa)
- ✅ **Vào khóa học** → điều hướng đến Step 2

**Thông Tin Hiển Thị**:
- Tên khóa học
- Giá tiền (hoặc "Miễn phí")
- Mô tả khóa học
- 3 nút hành động: Vào Khóa Học | Sửa | Xóa

**Thiết Kế**:
- Grid layout responsive (3 cột trên desktop, 1 cột trên mobile)
- Card style với shadow effect
- Gradient buttons
- Modal form cho thêm/sửa

---

## 🏫 STEP 2: Chi Tiết Khóa Học + Danh Sách Chương

**URL**: `/teacher/courses/:courseId/chapters`

**Component**: `Step2_ChiTietKhoaHoc.jsx`

**Chức Năng**:
- ✅ Xem **thông tin khóa học** (tên, giảng viên, giá tiền, mô tả)
- ✅ Xem **danh sách tất cả chương** trong khóa học
- ✅ **Thêm chương mới** (form modal)
- ✅ **Sửa chương** (cập nhật tên, mô tả, thứ tự)
- ✅ **Xóa chương** (xác nhận trước khi xóa)
- ✅ **Vào chương** → điều hướng đến Step 3
- ✅ **Quay lại** danh sách khóa học (Step 1)

**Thông Tin Hiển Thị**:

### Phần Thông Tin Khóa Học:
- Tên khóa học (lớn)
- Giảng viên
- Giá tiền (badge)
- Mô tả

### Phần Danh Sách Chương:
- Thứ tự chương (số trong vòng tròn gradient)
- Tên chương
- Mô tả chương
- 3 nút hành động: Xem Bài | Sửa | Xóa

**Thiết Kế**:
- List layout (dạng hàng ngang)
- Mỗi chương: số thứ tự + chi tiết + hành động
- Breadcrumb navigation
- Modal form cho thêm/sửa chương

---

## 📖 STEP 3: Chi Tiết Chương + Danh Sách Bài Học

**URL**: `/teacher/courses/:courseId/chapters/:chapterId/lessons`

**Component**: `Step3_ChiTietChapter.jsx`

**Chức Năng**:
- ✅ Xem **thông tin chương** (tên, mô tả)
- ✅ Xem **danh sách bài học** trong chương
- ✅ **Thêm bài học mới** (form modal)
- ✅ **Sửa bài học** (cập nhật tên, video URL, nội dung, thứ tự)
- ✅ **Xóa bài học** (xác nhận trước khi xóa)
- ✅ **Quản lý phân đoạn video** (nếu cần chia nhỏ video)
- ✅ **Quay lại** danh sách chương (Step 2)

**Thông Tin Hiển Thị**:

### Phần Thông Tin Chương:
- Breadcrumb: Tên Khóa Học / Tên Chương
- Tên chương (lớn)
- Mô tả chương

### Phần Danh Sách Bài Học:
- Thứ tự bài (số trong vòng tròn gradient)
- Tên bài học
- URL video (nếu có)
- Nội dung bài (preview)
- 3 nút hành động: Phân Đoạn | Sửa | Xóa

**Thiết Kế**:
- List layout (dạng hàng ngang)
- Mỗi bài: số thứ tự + chi tiết + hành động
- Breadcrumb navigation
- Modal form cho thêm/sửa bài học

---

## 🔗 Cấu Trúc API Sử Dụng

### Khóa Học (Courses)
```
GET    /courses                    → Lấy tất cả khóa học
POST   /courses                    → Thêm khóa học
GET    /courses/:id                → Chi tiết khóa học
PUT    /courses/:id                → Sửa khóa học
DELETE /courses/:id                → Xóa khóa học
```

### Chương (Chapters)
```
GET    /chapters/course/:courseId  → Lấy chương của khóa học
POST   /chapters/course/:courseId  → Thêm chương
PUT    /chapters/:id               → Sửa chương
DELETE /chapters/:id               → Xóa chương
```

### Bài Học (Lessons)
```
GET    /lessons/course/:courseId   → Lấy bài học của khóa học
POST   /lessons/course/:courseId   → Thêm bài học
PUT    /lessons/:id                → Sửa bài học
DELETE /lessons/:id                → Xóa bài học
GET    /lessons/:id/segments       → Lấy phân đoạn video
```

---

## 🎨 Thiết Kế Visual

### Màu Sắc:
- **Primary**: Gradient `#667eea` → `#764ba2` (tím)
- **Success**: `#2e7d32` (xanh lá)
- **Warning**: `#ffc107` (vàng)
- **Danger**: `#f5c6cb` (đỏ nhạt)
- **Background**: `#f5f7fa` (xám nhạt)

### Typography:
- Heading 1 (h1): 28px, bold, #333
- Heading 2 (h2): 22px, bold, #333
- Heading 3 (h3): 18px, bold, #333
- Body text: 14px, #333 hoặc #666

### Components:
- Modal: Max width 500px-600px, center screen
- Buttons: 10-12px padding, gradient, hover effect
- Cards: White background, box-shadow, hover lift effect
- Forms: Clean fields, focus color = primary gradient

---

## ✅ Checklist Kiểm Tra

- [ ] Danh sách khóa học hiển thị đúng
- [ ] Có thể thêm khóa học mới
- [ ] Có thể sửa tên/mô tả/giá khóa học
- [ ] Có thể xóa khóa học (xác nhận trước)
- [ ] Vào khóa học → Step 2 hiển thị chương
- [ ] Có thể thêm chương mới
- [ ] Có thể sửa chương
- [ ] Có thể xóa chương
- [ ] Vào chương → Step 3 hiển thị bài học
- [ ] Có thể thêm bài học mới
- [ ] Có thể sửa bài học
- [ ] Có thể xóa bài học
- [ ] Breadcrumb navigation hoạt động đúng
- [ ] Responsive design trên mobile/tablet

---

## 📁 Cấu Trúc File

```
frontend/src/screens/GiangVien/
├── Step1_DanhSachKhoaHoc.jsx       (Component Step 1)
├── Step1_DanhSachKhoaHoc.css       (CSS Step 1)
├── Step2_ChiTietKhoaHoc.jsx        (Component Step 2)
├── Step2_ChiTietKhoaHoc.css        (CSS Step 2)
├── Step3_ChiTietChapter.jsx        (Component Step 3)
├── Step3_ChiTietChapter.css        (CSS Step 3)
└── ManHinhQuanLyKhoaHoc.jsx        (Old - giữ lại nếu cần)
```

---

## 🚀 Cách Sử Dụng

### Từ Màn Hình Chính Giáo Viên:
1. Click vào **"Quản Lý Khóa Học"** → đến Step 1 (Danh sách khóa học)
2. Click **"Vào Khóa Học"** trên 1 khóa học → đến Step 2 (Danh sách chương)
3. Click **"Xem Bài"** trên 1 chương → đến Step 3 (Danh sách bài học)

### Thêm Mới:
- Step 1: Click **"➕ Thêm Khóa Học Mới"** → Modal
- Step 2: Click **"➕ Thêm Chương Mới"** → Modal
- Step 3: Click **"➕ Thêm Bài Học Mới"** → Modal

### Sửa/Xóa:
- Click **"✏️ Sửa"** để chỉnh sửa
- Click **"🗑️ Xóa"** để xóa (xác nhận trước)

---

## 💡 Ghi Chú

- Tất cả khóa học được lọc theo **user hiện tại** (từ sessionStorage)
- Chương được lọc theo **courseId**
- Bài học được lọc theo **chapterId**
- Modal tự động đóng sau khi lưu thành công
- Dữ liệu được refresh tự động sau mỗi thao tác (thêm/sửa/xóa)
- Có loading indicator khi fetch dữ liệu
- Có error message nếu API thất bại

---

## 🔄 Luồng Dữ Liệu

```
User Login → Step 1 (Load: GET /courses)
    ↓
Click Vào Khóa Học → Step 2 (Load: GET /chapters/course/:courseId)
    ↓
Click Xem Bài → Step 3 (Load: GET /lessons/course/:courseId filtered by chapterId)
```

---

## 📞 Hỗ Trợ

Nếu có lỗi:
1. Check console browser (F12) xem error message
2. Check network tab xem API response
3. Ensure backend đang chạy ở port 5000
4. Ensure frontend đang chạy ở port 5173

