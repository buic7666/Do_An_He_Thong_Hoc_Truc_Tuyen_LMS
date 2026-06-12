# DAY 1 COMPLETE - NGÀY 2 ROADMAP

---

## ✅ NGÀY 1 - ĐÃ XỌN

### Database Layer
- ✅ Chốt ERD và khóa ngoại đúng
- ✅ 5 bảng chính (users, courses, lessons, enrollments, progress)
- ✅ Index + unique constraint + CHECK constraint
- ✅ Seed dữ liệu mẫu 100% (admin, teacher, 2 students, 2 courses, 10 lessons, test enrollments, progress)

### Documentation
- ✅ Bảng rà soát chức năng MVP tuần 1
- ✅ API Contract đầy đủ (5 luồng, request/response mẫu, error codes)
- ✅ Hướng dẫn seed data và test queries


### Scope Chốt
- ✅ P0 (bắt buộc): Auth, Enrollment, Progress
- ✅ P1 (ưu tiên): Course, Lesson
- ✅ Gạt P2 (nâng cao): Forgot Password, Verify Email, Payment thật, Quiz, Rating

---


## 📋 NGÀY 2 - SỐC ĐẤY

### Mục tiêu
Làm xong 3 API lõi, kiểm tra JWT + phân quyền chỉ ngôi được

### Lịch trình

#### Sáng (08:00 - 11:30)
1. Chạy seed.sql vào database (10 phút)
   - Copy file seed.sql
   - Vào phpMyAdmin → SQL tab → paste → Run
   - Kiểm tra dữ liệu xuất hiện trong 5 bảng

2. Chuẩn hóa cấu trúc backend (30 phút)
   - Kiểm tra [backend/src/config/env.js](d:\Hoc_Nam4\DoAn_TotNghiep\backend\src\config\env.js) có JWT_SECRET, DB_HOST, DB_USER
   - Chuẩn hóa [backend/src/utils/response.js](d:\Hoc_Nam4\DoAn_TotNghiep\backend\src\utils\response.js) thành format chuẩn
   - Chuẩn hóa [backend/src/middlewares/errorHandler.js](d:\Hoc_Nam4\DoAn_TotNghiep\backend\src\middlewares\errorHandler.js) để map lỗi theo mã chuẩn

3. Code Auth Controller (90 phút)
   - POST /auth/register → hash password + insert users
   - POST /auth/login → kiểm tra credentials + tạo JWT
   - GET /auth/me → verify token + trả current user
   - Chạy test bằng Postman: register thành công → login thành công → gọi /me được user

#### Chiều (14:00 - 17:30)
4. Code Course & Lesson Controller (90 phút)
   - GET /courses → trả list từ DB
   - GET /courses/:id → trả detail + list lessons
   - GET /courses/:courseId/lessons → trả list lessons
   - GET /lessons/:id → check permission (nếu là student, kiểm tra enroll)
   - Chạy test: xem được courses, xem được lessons (nếu enroll)

5. Code Enrollment Controller (60 phút)
   - POST /enrollments → create enrollment (check duplicate)
   - GET /me/enrollments → trả list courses đã enroll
   - Test: enroll vào course → check unique constraint (insert 2 lần phải fail)

6. Code Progress Controller sơ bộ (30 phút)
   - POST /lessons/:id/progress → mark completed
   - GET /courses/:courseId/progress → tính percentage
   - Test: cập nhật progress rồi lấy ra kiểm tra %

#### Tối (20:30 - 22:00)
7. Smoke Test End-to-End (60 phút)
   - Tạo Postman collection với các test case
   - Test 5 scenario:
     1. Register student3
     2. Login student3 lấy token
     3. Get courses (list)
     4. Enroll course 1
     5. Update progress lesson 1 → kiểm tra % tăng từ 0% → 20%
   - Nếu fail fix luôn trong ngày

8. Git Commit (10 phút)
   - `git add .`
   - `git commit -m "Day 2: Auth + Course + Lesson + Enrollment + Progress lõi"`

---

## 🎯 ACCEPTANCE CRITERIA - NGÀY 2 PHẢI PASS

### Auth
- ✅ Register: email unique, password hashed, trả id + token
- ✅ Login: credentials đúng trả token, credentials sai trả 401
- ✅ /me: token valid trả user, token invalid trả 401
- ✅ Role check: student không thể ghi danh course nếu chưa thanh toán (status sẽ là pending, không active)

### Course
- ✅ GET /courses: trả array 2 courses từ DB
- ✅ GET /courses/1: trả chi tiết + array 5 lessons
- ✅ GET /courses/:id: course không tồn tại trả 404

### Lesson
- ✅ GET /lessons/1 (student chưa enroll): trả 403
- ✅ GET /lessons/1 (student đã enroll): trả 200 + content
- ✅ GET /lessons/:id (không tồn tại): trả 404

### Enrollment
- ✅ POST /enrollments: enroll thành công trả 201
- ✅ POST /enrollments (enroll lại course cũ): trả 409 ALREADY_ENROLLED
- ✅ GET /me/enrollments: trả list courses đã enroll

### Progress
- ✅ POST /lessons/:id/progress (chưa enroll): trả 403
- ✅ POST /lessons/:id/progress (đã enroll): update success + trả % tăng
- ✅ GET /courses/:courseId/progress (chưa enroll): trả 403
- ✅ GET /courses/:courseId/progress (đã enroll): trả % hoàn thành, danh sách lessons + completed status

---

## 📝 GOTCHAS CẦN TRÁNH

1. **Password không được lưu plaintext** → bắt buộc hash bcrypt
2. **JWT token phải có expiry** → không để vĩnh viễn
3. **Progress unique (user_id, lesson_id)** → không được insert 2 lần cùng 1 lesson
4. **Enrollment check** → student chưa enroll không được gọi lesson API
5. **Response format xác chắc** → tất cả đều `{success, status, message, data/error}`

---

## 🔗 REFERENCE FILES TRONG NGÀY 2

1. **Seed Data**: [backend/seeds/seed.sql](d:\Hoc_Nam4\DoAn_TotNghiep\backend\seeds\seed.sql)
2. **API Contract**: [backend/docs/API_CONTRACT.md](d:\Hoc_Nam4\DoAn_TotNghiep\backend\docs\API_CONTRACT.md)
3. **Seed Instructions**: [backend/seeds/SEED_INSTRUCTIONS.sql](d:\Hoc_Nam4\DoAn_TotNghiep\backend\seeds\SEED_INSTRUCTIONS.sql)
4. **Existing Code**:
   - [backend/src/models/](d:\Hoc_Nam4\DoAn_TotNghiep\backend\src\models\) - Models
   - [backend/src/controllers/](d:\Hoc_Nam4\DoAn_TotNghiep\backend\src\controllers\) - Controllers (edit thêm)
   - [backend/src/services/](d:\Hoc_Nam4\DoAn_TotNghiep\backend\src\services\) - Services (tạo mới nếu cần)
   - [backend/src/repositories/](d:\Hoc_Nam4\DoAn_TotNghiep\backend\src\repositories\) - Repositories (update query)

---

## 🚀 QUICK START NGÀY 2

```bash
# 1. Chạy seed
# Copy nội dung seed.sql vào phpMyAdmin SQL tab → Run

# 2. Start server
cd backend
npm start

# 3. Test APIs
# Dùng Postman hoặc curl, import API_CONTRACT.md

# 4. Check dữ liệu
# Vào phpMyAdmin → query verification queries
```

---

## ✨ CẬP NHẬT KHI XONG NGÀY 2

Khi pass hết acceptance criteria, update file này:
- Tick ✅ vào các criteria ngày 2
- Ghi note lỗi gặp + cách fix
- Cập nhật "Ngày 3 roadmap"

---

**Created**: 2024-03-24  
**Status**: Day 1 Complete ✅  
**Next**: Day 2 Backend APIs (Auth → Course → Lesson → Enrollment → Progress)
