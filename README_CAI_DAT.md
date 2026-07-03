# Huong Dan Cai Dat Local He Thong LMS

Tai lieu nay dung de cai dat va chay do an LMS tren may khac, vi du may cua giang vien phan bien.

Project hien tai gom:

- `backend/`: Node.js, Express, Sequelize, MySQL.
- `frontend/`: React, Vite.
- `database/`: noi dat file database export/import.
- `scripts/`: cac file `.bat` ho tro cai dat va chay tren Windows.

## 1. Yeu Cau He Thong

Can cai san:

- Node.js LTS, khuyen nghi Node.js 20 LTS hoac ban LTS moi hon.
- npm, di kem Node.js.
- MySQL, co the dung XAMPP.
- Trinh duyet Chrome/Edge.
- Git neu lay source tu repository.

Kiem tra Node.js:

```bat
node -v
npm -v
```

Kiem tra MySQL neu dung CLI:

```bat
mysql --version
```

Neu dung XAMPP ma Windows khong nhan `mysql`, co the dung phpMyAdmin hoac duong dan:

```bat
C:\xampp\mysql\bin\mysql.exe
```

## 2. Cau Truc Project

```text
DoAn_TotNghiep/
  backend/
    package.json
    server.js
    src/
      app.js
      config/
      routes/
      controllers/
      services/
      models/
    seeds/
  frontend/
    package.json
    index.html
    src/
  database/
    README_IMPORT_DATABASE.md
  scripts/
    install.bat
    check-env.bat
    start-dev.bat
```

Backend mount API tai:

```text
http://localhost:5000/api
```

Frontend Vite mac dinh chay tai:

```text
http://localhost:5173
```

## 3. Tao Database MySQL

Ten database mac dinh trong file mau la:

```text
lms_db
```

### Cach 1: Tao bang phpMyAdmin

1. Mo XAMPP.
2. Start `Apache` va `MySQL`.
3. Vao `http://localhost/phpmyadmin`.
4. Chon `New`.
5. Nhap database name: `lms_db`.
6. Chon collation: `utf8mb4_unicode_ci`.
7. Bam `Create`.

### Cach 2: Tao bang MySQL CLI

```bat
mysql -u root -p
```

Sau do chay:

```sql
CREATE DATABASE lms_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

## 4. Import Database Tu File SQL

Neu da co file export:

```text
database/lms_database.sql
```

Import bang phpMyAdmin:

1. Mo `http://localhost/phpmyadmin`.
2. Chon database `lms_db`.
3. Vao tab `Import`.
4. Chon file `database/lms_database.sql`.
5. Bam `Import`.

Import bang command line:

```bat
mysql -u root -p lms_db < database\lms_database.sql
```

Neu dung XAMPP va Windows khong nhan `mysql`:

```bat
"C:\xampp\mysql\bin\mysql.exe" -u root -p lms_db < database\lms_database.sql
```

Neu trong project chua co `database/lms_database.sql`, hay export database dang chay tu may phat trien theo huong dan trong:

```text
database/README_IMPORT_DATABASE.md
```

## 5. Cau Hinh Backend `.env`

Copy file mau:

```bat
copy backend\.env.example backend\.env
```

Noi dung quan trong can sua trong `backend/.env`:

```env
NODE_ENV=development
PORT=5000

DB_HOST=localhost
DB_PORT=3306
DB_NAME=lms_db
DB_USER=root
DB_PASSWORD=

JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=1d

FRONTEND_ORIGIN=http://localhost:5173
```

Neu MySQL cua XAMPP khong dat mat khau, de:

```env
DB_PASSWORD=
```

Neu MySQL co mat khau, dien dung mat khau:

```env
DB_PASSWORD=mat_khau_mysql
```

### Cac bien backend dang duoc source code su dung

Backend doc bien moi truong tu `backend/src/config/env.js`, `backend/src/app.js`, email, YouTube va cac service cham diem:

```env
NODE_ENV
PORT
DB_HOST
DB_PORT
DB_NAME
DB_USER
DB_PASSWORD
JWT_SECRET
JWT_EXPIRES_IN
FRONTEND_ORIGIN
RATE_LIMIT_WINDOW_MS
RATE_LIMIT_MAX
EMAIL_USER
EMAIL_PASS
OPENAI_API_KEY
OPENAI_MODEL
YOUTUBE_CHANNEL_ID
YOUTUBE_API_KEY
EXTERNAL_GRADER_URL
EXTERNAL_GRADER_KEY
EXTERNAL_GRADER_TIMEOUT_MS
EXTERNAL_GRADER_WEBHOOK_SECRET
ESSAY_EXTERNAL_GRADER_TIMEOUT_MS
SMOKE_BASE_URL
MOCK_GRADER_PORT
```

Trong do:

- `EMAIL_USER`, `EMAIL_PASS`: chi can khi demo gui email qua Gmail.
- `OPENAI_API_KEY`, `OPENAI_MODEL`: chi can khi demo cham tu luan bang OpenAI.
- `YOUTUBE_CHANNEL_ID`, `YOUTUBE_API_KEY`: chi can khi demo tinh nang YouTube.
- `EXTERNAL_GRADER_*`, `ESSAY_EXTERNAL_GRADER_TIMEOUT_MS`: chi can khi demo cham diem bang API ngoai.
- `SMOKE_BASE_URL`, `MOCK_GRADER_PORT`: phuc vu script test/mock, khong bat buoc khi chay demo binh thuong.

## 6. Cau Hinh Frontend `.env`

Copy file mau:

```bat
copy frontend\.env.example frontend\.env
```

Noi dung mac dinh:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
VITE_FACEBOOK_APP_ID=YOUR_FACEBOOK_APP_ID_HERE
```

### Cac bien frontend dang duoc source code su dung

```env
VITE_API_BASE_URL
VITE_API_URL
VITE_GOOGLE_CLIENT_ID
VITE_FACEBOOK_APP_ID
```

Ghi chu:

- `VITE_API_BASE_URL` la bien chinh, duoc dung trong `frontend/src/api/httpClient.js`.
- `VITE_API_URL` van duoc mot vai file cu dung, nen nen khai bao giong `VITE_API_BASE_URL`.
- Google/Facebook login la tuy chon. Neu khong demo dang nhap social, co the giu placeholder.

## 7. Cai Thu Vien

Cach nhanh nhat:

```bat
scripts\install.bat
```

File nay se chay:

```bat
cd backend
npm install

cd ..\frontend
npm install
```

Co the chay thu cong neu muon:

```bat
cd backend
npm install

cd ..\frontend
npm install
```

## 8. Kiem Tra File Moi Truong

Chay:

```bat
scripts\check-env.bat
```

Script nay kiem tra:

```text
backend/.env
frontend/.env
```

Neu thieu, hay copy tu `.env.example`.

## 9. Chay Backend Va Frontend

Cach nhanh nhat:

```bat
scripts\start-dev.bat
```

Script nay mo 2 cua so terminal:

- Cua so 1: `cd backend && npm run dev`
- Cua so 2: `cd frontend && npm run dev`

Chay thu cong:

Terminal 1:

```bat
cd backend
npm run dev
```

Terminal 2:

```bat
cd frontend
npm run dev
```

## 10. Dia Chi Truy Cap

Frontend:

```text
http://localhost:5173
```

Backend health check:

```text
http://localhost:5000/health
```

Backend API:

```text
http://localhost:5000/api
```

## 11. Tai Khoan Mau

Neu import database that cua do an, hay dung tai khoan trong database export.

Neu dung `backend/seeds/seed.sql`, cac tai khoan mau la:

| Vai tro | Email | Mat khau |
| --- | --- | --- |
| Admin | `admin@lms.local` | `password123` |
| Giang vien | `teacher@lms.local` | `password123` |
| Hoc vien 1 | `student1@lms.local` | `password123` |
| Hoc vien 2 | `student2@lms.local` | `password123` |

Trong cac script seed Node.js, cung co mot so tai khoan test khac:

- `teacher@test.com` / `password123`
- `student1@test.com` / `password123`
- `student2@test.com` / `password123`
- `teacher.seed@lms.local` / `12345678`
- `student.seed1@lms.local` / `12345678`

Tai khoan nao dung duoc phu thuoc vao file SQL/script seed da import/chay.

## 12. Script Seed Co San

Backend co cac script trong `backend/package.json`:

```bat
cd backend
npm run seed
npm run seed:question-types
npm run seed:teacher-dashboard
npm run seed:video-course
npm run seed:quizzes
npm run seed:lesson-segments
npm run seed:chapters
```

Khuyen nghi khi demo: import database export san tu `database/lms_database.sql` de du lieu on dinh hon. Chi dung seed khi can tao du lieu mau moi.

## 13. Loi Thuong Gap Va Cach Xu Ly

### 13.1. Sai cong backend

Dau hieu:

- Frontend bao khong ket noi API.
- Network request goi sai cong.

Cach xu ly:

- Kiem tra backend dang chay cong nao trong console.
- Kiem tra `backend/.env`:

```env
PORT=5000
```

- Kiem tra `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_API_URL=http://localhost:5000/api
```

Sau khi sua `.env` frontend, phai tat va chay lai `npm run dev`.

### 13.2. Sai database hoac database chua import

Dau hieu:

- Backend log loi ket noi MySQL.
- Login khong duoc vi khong co user.
- API bao table khong ton tai.

Cach xu ly:

- Dam bao MySQL dang chay.
- Dam bao database `lms_db` da duoc tao.
- Import lai `database/lms_database.sql`.
- Kiem tra `backend/.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=lms_db
DB_USER=root
DB_PASSWORD=
```

### 13.3. Loi ket noi MySQL `Access denied`

Dau hieu:

```text
Access denied for user 'root'@'localhost'
```

Cach xu ly:

- Neu XAMPP root khong co password, de `DB_PASSWORD=` rong.
- Neu co password, dien dung password trong `backend/.env`.
- Thu dang nhap phpMyAdmin de xac nhan user/password.

### 13.4. Loi ket noi MySQL `ECONNREFUSED`

Dau hieu:

```text
connect ECONNREFUSED 127.0.0.1:3306
```

Cach xu ly:

- Start MySQL trong XAMPP.
- Kiem tra MySQL port co phai `3306` khong.
- Neu MySQL dung port khac, sua `DB_PORT`.

### 13.5. Thieu `node_modules`

Dau hieu:

```text
'vite' is not recognized
Cannot find module ...
```

Cach xu ly:

```bat
scripts\install.bat
```

Hoac:

```bat
cd backend
npm install
cd ..\frontend
npm install
```

### 13.6. Loi CORS

Dau hieu tren browser console:

```text
Access to XMLHttpRequest has been blocked by CORS policy
```

Cach xu ly:

- Kiem tra frontend dang chay o cong nao, mac dinh `http://localhost:5173`.
- Kiem tra `backend/.env`:

```env
FRONTEND_ORIGIN=http://localhost:5173
```

Backend hien cung cho phep localhost nhieu cong, nhung van nen cau hinh dung.

### 13.7. Cong 5173 da bi chiem

Dau hieu:

- Vite chay sang cong khac, vi du `5174`.

Cach xu ly:

- Dung URL Vite hien tren terminal.
- Neu muon co dinh ve 5173, tat process dang chiem cong 5173.
- Backend CORS hien cho phep localhost nhieu cong nen `5174` van chay duoc.

### 13.8. Cong 5000 da bi chiem

Dau hieu:

```text
EADDRINUSE: address already in use :::5000
```

Cach xu ly:

- Tat process dang dung cong 5000.
- Hoac doi `PORT` trong `backend/.env`, vi du:

```env
PORT=5001
```

Sau do sua frontend:

```env
VITE_API_BASE_URL=http://localhost:5001/api
VITE_API_URL=http://localhost:5001/api
```

### 13.9. Sua `.env` nhung ung dung khong doi

Cach xu ly:

- Tat terminal backend/frontend.
- Chay lai `scripts\start-dev.bat`.
- Vite chi doc lai `.env` khi restart dev server.

## 14. Quy Trinh Cai Dat Nhanh Tren May Moi

1. Copy source project sang may moi.
2. Cai Node.js LTS va XAMPP/MySQL.
3. Tao database `lms_db`.
4. Import `database/lms_database.sql`.
5. Copy env:

```bat
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
```

6. Sua `backend/.env` neu MySQL co password.
7. Cai thu vien:

```bat
scripts\install.bat
```

8. Chay he thong:

```bat
scripts\start-dev.bat
```

9. Mo trinh duyet:

```text
http://localhost:5173
```
