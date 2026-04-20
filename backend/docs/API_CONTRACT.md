# LMS Backend API Contract (MVP Week 1)

## Base URL
```
http://localhost:3000/api/v1
```

## Standard Response Format

### Success Response
```json
{
  "success": true,
  "status": 200,
  "message": "Request successful",
  "data": {
    // endpoint-specific data
  }
}
```

### Error Response
```json
{
  "success": false,
  "status": 400,
  "message": "Error message here",
  "error": "ERROR_CODE"
}
```

## Standard Error Codes
- **400**: Bad Request (invalid input)
- **401**: Unauthorized (missing/invalid token)
- **403**: Forbidden (insufficient permissions/not enrolled)
- **404**: Not Found
- **409**: Conflict (duplicate email, enrollment, progress)
- **500**: Internal Server Error

---

## 1. AUTH ENDPOINTS

### 1.1 Register (POST /auth/register)
**Description**: Tạo tài khoản mới cho student

**Request**
```http
POST /auth/register
Content-Type: application/json

{
  "name": "Trần Văn B",
  "email": "student1@example.com",
  "password": "password123",
  "role": "student"
}
```

**Response Success (201)**
```json
{
  "success": true,
  "status": 201,
  "message": "User registered successfully",
  "data": {
    "id": 3,
    "name": "Trần Văn B",
    "email": "student1@example.com",
    "role": "student",
    "createdAt": "2024-03-24T10:30:00Z"
  }
}
```

**Response Error (409 - Email already exists)**
```json
{
  "success": false,
  "status": 409,
  "message": "Email already registered",
  "error": "EMAIL_ALREADY_EXISTS"
}
```

**Response Error (400 - Validation failed)**
```json
{
  "success": false,
  "status": 400,
  "message": "Validation failed",
  "error": "VALIDATION_ERROR",
  "details": {
    "email": "Invalid email format",
    "password": "Password must be at least 6 characters"
  }
}
```

---

### 1.2 Login (POST /auth/login)
**Description**: Đăng nhập và lấy JWT token

**Request**
```http
POST /auth/login
Content-Type: application/json

{
  "email": "student1@lms.local",
  "password": "password123"
}
```

**Response Success (200)**
```json
{
  "success": true,
  "status": 200,
  "message": "Login successful",
  "data": {
    "id": 3,
    "name": "Trần Văn B",
    "email": "student1@lms.local",
    "role": "student",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 86400
  }
}
```

**Response Error (401)**
```json
{
  "success": false,
  "status": 401,
  "message": "Invalid email or password",
  "error": "INVALID_CREDENTIALS"
}
```

---

### 1.3 Get Current User (GET /auth/me)
**Description**: Lấy thông tin user hiện tại (cần JWT token)

**Request**
```http
GET /auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response Success (200)**
```json
{
  "success": true,
  "status": 200,
  "message": "User data retrieved",
  "data": {
    "id": 3,
    "name": "Trần Văn B",
    "email": "student1@lms.local",
    "role": "student",
    "createdAt": "2024-03-21T08:00:00Z"
  }
}
```

**Response Error (401)**
```json
{
  "success": false,
  "status": 401,
  "message": "Token invalid or expired",
  "error": "UNAUTHORIZED"
}
```

---

## 2. COURSE ENDPOINTS

### 2.1 Get All Courses (GET /courses)
**Description**: Lấy danh sách tất cả khóa học (không cần đăng nhập)

**Query Parameters**
- `page` (optional): Trang hiện tại, default = 1
- `limit` (optional): Số courses mỗi trang, default = 10
- `category` (optional): Lọc theo chuyên mục
- `search` (optional): Tìm kiếm theo tên

**Request**
```http
GET /courses?page=1&limit=10
```

**Response Success (200)**
```json
{
  "success": true,
  "status": 200,
  "message": "Courses retrieved",
  "data": {
    "courses": [
      {
        "id": 1,
        "title": "Lập trình Node.js cơ bản",
        "description": "Khóa học giới thiệu Node.js, Express, MySQL từ đầu...",
        "price": 0.00,
        "instructor": {
          "id": 2,
          "name": "Nguyễn Văn A (Teacher)"
        },
        "lessonsCount": 5,
        "createdAt": "2024-03-21T08:00:00Z"
      },
      {
        "id": 2,
        "title": "React.js - Xây dựng giao diện web hiện đại",
        "description": "Học React từ cơ bản đến nâng cao...",
        "price": 0.00,
        "instructor": {
          "id": 2,
          "name": "Nguyễn Văn A (Teacher)"
        },
        "lessonsCount": 5,
        "createdAt": "2024-03-21T08:15:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 2
    }
  }
}
```

---

### 2.2 Get Course Detail (GET /courses/:id)
**Description**: Lấy chi tiết 1 khóa học (bao gồm danh sách lessons)

**Request**
```http
GET /courses/1
```

**Response Success (200)**
```json
{
  "success": true,
  "status": 200,
  "message": "Course detail retrieved",
  "data": {
    "id": 1,
    "title": "Lập trình Node.js cơ bản",
    "description": "Khóa học giới thiệu Node.js, Express, MySQL từ đầu...",
    "price": 0.00,
    "instructor": {
      "id": 2,
      "name": "Nguyễn Văn A (Teacher)",
      "email": "teacher@lms.local"
    },
    "lessons": [
      {
        "id": 1,
        "orderIndex": 1,
        "title": "Giới thiệu Node.js và cài đặt môi trường",
        "videoUrl": "https://example.com/videos/nodejs-lesson-1.mp4",
        "content": "Tìm hiểu Node.js là gì, cách cài đặt Node.js và npm..."
      },
      {
        "id": 2,
        "orderIndex": 2,
        "title": "Tạo server HTTP đầu tiên với Node.js",
        "videoUrl": "https://example.com/videos/nodejs-lesson-2.mp4",
        "content": "Viết code tạo server HTTP đơn giản..."
      }
    ],
    "stats": {
      "totalLessons": 5,
      "totalStudents": 2,
      "averageRating": 4.5
    },
    "createdAt": "2024-03-21T08:00:00Z"
  }
}
```

**Response Error (404)**
```json
{
  "success": false,
  "status": 404,
  "message": "Course not found",
  "error": "COURSE_NOT_FOUND"
}
```

---

## 3. LESSON ENDPOINTS

### 3.1 Get Lessons by Course (GET /courses/:courseId/lessons)
**Description**: Lấy danh sách tất cả lessons trong 1 course

**Request**
```http
GET /courses/1/lessons
```

**Response Success (200)**
```json
{
  "success": true,
  "status": 200,
  "message": "Lessons retrieved",
  "data": [
    {
      "id": 1,
      "orderIndex": 1,
      "title": "Giới thiệu Node.js và cài đặt môi trường",
      "videoUrl": "https://example.com/videos/nodejs-lesson-1.mp4",
      "content": "Tìm hiểu Node.js là gì...",
      "courseId": 1,
      "createdAt": "2024-03-21T08:00:00Z"
    },
    {
      "id": 2,
      "orderIndex": 2,
      "title": "Tạo server HTTP đầu tiên với Node.js",
      "videoUrl": "https://example.com/videos/nodejs-lesson-2.mp4",
      "content": "Viết code tạo server HTTP...",
      "courseId": 1,
      "createdAt": "2024-03-21T08:15:00Z"
    }
  ]
}
```

---

### 3.2 Get Lesson Detail (GET /lessons/:id)
**Description**: Lấy chi tiết 1 bài học

**Request**
```http
GET /lessons/1
Authorization: Bearer [token] (optional, nếu muốn check quyền truy cập)
```

**Response Success (200)**
```json
{
  "success": true,
  "status": 200,
  "message": "Lesson detail retrieved",
  "data": {
    "id": 1,
    "orderIndex": 1,
    "title": "Giới thiệu Node.js và cài đặt môi trường",
    "videoUrl": "https://example.com/videos/nodejs-lesson-1.mp4",
    "content": "Tìm hiểu Node.js là gì, cách cài đặt Node.js...",
    "courseId": 1,
    "course": {
      "id": 1,
      "title": "Lập trình Node.js cơ bản"
    },
    "createdAt": "2024-03-21T08:00:00Z"
  }
}
```

**Response Error (403 - Not enrolled)**
```json
{
  "success": false,
  "status": 403,
  "message": "You are not enrolled in this course",
  "error": "NOT_ENROLLED"
}
```

---

## 4. ENROLLMENT ENDPOINTS

### 4.1 Create Enrollment (POST /enrollments)
**Description**: Student ghi danh vào khóa học

**Request**
```http
POST /enrollments
Authorization: Bearer [token]
Content-Type: application/json

{
  "courseId": 1
}
```

**Response Success (201)**
```json
{
  "success": true,
  "status": 201,
  "message": "Enrolled successfully",
  "data": {
    "id": 3,
    "userId": 3,
    "courseId": 1,
    "status": "active",
    "course": {
      "id": 1,
      "title": "Lập trình Node.js cơ bản"
    },
    "createdAt": "2024-03-24T10:30:00Z"
  }
}
```

**Response Error (401)**
```json
{
  "success": false,
  "status": 401,
  "message": "Token missing or invalid",
  "error": "UNAUTHORIZED"
}
```

**Response Error (409 - Already enrolled)**
```json
{
  "success": false,
  "status": 409,
  "message": "You are already enrolled in this course",
  "error": "ALREADY_ENROLLED"
}
```

---

### 4.2 Get My Enrollments (GET /me/enrollments)
**Description**: Lấy danh sách các khóa học đã đăng ký

**Request**
```http
GET /me/enrollments
Authorization: Bearer [token]
```

**Response Success (200)**
```json
{
  "success": true,
  "status": 200,
  "message": "Enrollments retrieved",
  "data": [
    {
      "id": 1,
      "courseId": 1,
      "status": "active",
      "course": {
        "id": 1,
        "title": "Lập trình Node.js cơ bản",
        "instructor": {
          "id": 2,
          "name": "Nguyễn Văn A (Teacher)"
        },
        "lessonsCount": 5
      },
      "enrolledAt": "2024-03-21T08:00:00Z"
    },
    {
      "id": 2,
      "courseId": 2,
      "status": "active",
      "course": {
        "id": 2,
        "title": "React.js - Xây dựng giao diện web hiện đại",
        "instructor": {
          "id": 2,
          "name": "Nguyễn Văn A (Teacher)"
        },
        "lessonsCount": 5
      },
      "enrolledAt": "2024-03-22T10:15:00Z"
    }
  ]
}
```

---

## 5. PROGRESS ENDPOINTS

### 5.1 Update Lesson Progress (POST /lessons/:lessonId/progress)
**Description**: Cập nhật trạng thái "hoàn thành" cho 1 bài học

**Request**
```http
POST /lessons/1/progress
Authorization: Bearer [token]
Content-Type: application/json

{
  "isCompleted": true
}
```

**Response Success (200)**
```json
{
  "success": true,
  "status": 200,
  "message": "Progress updated",
  "data": {
    "id": 1,
    "userId": 3,
    "lessonId": 1,
    "isCompleted": true,
    "completedAt": "2024-03-24T10:35:00Z",
    "lesson": {
      "id": 1,
      "title": "Giới thiệu Node.js và cài đặt môi trường",
      "orderIndex": 1
    }
  }
}
```

**Response Error (403 - Not enrolled)**
```json
{
  "success": false,
  "status": 403,
  "message": "You are not enrolled in this course",
  "error": "NOT_ENROLLED"
}
```

**Response Error (404)**
```json
{
  "success": false,
  "status": 404,
  "message": "Lesson not found",
  "error": "LESSON_NOT_FOUND"
}
```

---

### 5.2 Get Course Progress (GET /courses/:courseId/progress)
**Description**: Lấy tiến độ học của current user trong 1 course

**Request**
```http
GET /courses/1/progress
Authorization: Bearer [token]
```

**Response Success (200)**
```json
{
  "success": true,
  "status": 200,
  "message": "Progress retrieved",
  "data": {
    "courseId": 1,
    "courseName": "Lập trình Node.js cơ bản",
    "totalLessons": 5,
    "completedLessons": 2,
    "progressPercent": 40.0,
    "lessons": [
      {
        "id": 1,
        "orderIndex": 1,
        "title": "Giới thiệu Node.js và cài đặt môi trường",
        "isCompleted": true,
        "completedAt": "2024-03-23T15:30:00Z"
      },
      {
        "id": 2,
        "orderIndex": 2,
        "title": "Tạo server HTTP đầu tiên với Node.js",
        "isCompleted": true,
        "completedAt": "2024-03-23T16:45:00Z"
      },
      {
        "id": 3,
        "orderIndex": 3,
        "title": "Giới thiệu Express Framework",
        "isCompleted": false,
        "completedAt": null
      },
      {
        "id": 4,
        "orderIndex": 4,
        "title": "Routing và Middleware trong Express",
        "isCompleted": false,
        "completedAt": null
      },
      {
        "id": 5,
        "orderIndex": 5,
        "title": "Kết nối MySQL và CRUD operations",
        "isCompleted": false,
        "completedAt": null
      }
    ],
    "lastAccessedAt": "2024-03-24T10:00:00Z"
  }
}
```

**Response Error (403 - Not enrolled)**
```json
{
  "success": false,
  "status": 403,
  "message": "You are not enrolled in this course",
  "error": "NOT_ENROLLED"
}
```

---

## Authentication Headers
Tất cả endpoint yêu cầu token phải trong header:
```
Authorization: Bearer [JWT_TOKEN]
```

---

## Error Handling
Tất cả response đều tuân theo format chuẩn với `success`, `status`, `message`, `error`.
- Client phải check `success` true/false để biết request thành công hay thất bại.
- Status code HTTP phải match với API response status.

---

## Rate Limiting (Future)
- Hiện tại không có rate limiting, sẽ thêm vào tuần 3+.

## CORS (Future)
- Hiện tại cho phép CORS từ localhost:3000 (frontend).
- Sẽ tightening hơn khi deploy production.

---

## Testing with Postman
1. Import base URL vào Postman collection.
2. Set environment variable: `token` để lưu JWT sau khi login.
3. Dùng `{{token}}` trong Authorization header.
4. Test lần lượt từ Register → Login → GetCourses → Enroll → UpdateProgress.
