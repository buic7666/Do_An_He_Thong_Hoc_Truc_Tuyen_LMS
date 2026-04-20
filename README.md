# LMS Monorepo Boilerplate

## Tổng quan

Đây là cấu trúc khởi tạo cho hệ thống quản lý học tập (LMS) gồm 3 phần:

- `backend`: Node.js/Express với kiến trúc 3 lớp `Controller - Service - Repository`
- `frontend`: React.js + Tailwind CSS
- `mobile_app`: Flutter theo Clean Architecture (`core/data/domain/presentation`)

Mục tiêu của scaffold:

- Tuân thủ hướng tách lớp rõ ràng theo Layered Architecture
- Hỗ trợ mở rộng theo nguyên tắc SOLID
- Dễ bảo trì, dễ test, và clean code ngay từ đầu với ESLint + Prettier (JS) và Flutter lints (Dart)

## Cấu trúc chính

```text
.
├── backend/
├── frontend/
└── mobile_app/
```

## Yêu cầu môi trường

- Node.js >= 18
- npm >= 9
- Flutter SDK >= 3.4
- MySQL >= 8

## Hướng dẫn cài đặt nhanh

### 1) Backend

```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

### 3) Mobile (Flutter)

```bash
cd mobile_app
flutter pub get
flutter run
```

## Cấu hình chất lượng mã nguồn

- Backend:
  - ESLint: `backend/.eslintrc.json`
  - Prettier: `backend/.prettierrc.json`
- Frontend:
  - ESLint: `frontend/.eslintrc.json`
  - Prettier: `frontend/.prettierrc.json`
- Mobile:
  - Flutter lints: `mobile_app/analysis_options.yaml`

## Lưu ý

Repo hiện ở mức boilerplate scaffold, chưa triển khai logic nghiệp vụ chi tiết.