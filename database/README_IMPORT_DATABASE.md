# Huong Dan Export/Import Database MySQL Cho Do An LMS

Thu muc `database/` dung de dat file database export khi chuyen do an sang may khac.

Ten file SQL khuyen nghi:

```text
database/lms_database.sql
```

## 1. Khi nao can export database?

Can export database tu may dang phat trien khi ban muon mang toan bo du lieu hien co sang may khac, vi du may cua giang vien phan bien.

Du lieu nen co san:

- Tai khoan Admin, Giang vien, Hoc vien.
- Khoa hoc, chuong, bai hoc, phan bai hoc.
- Ngan hang cau hoi.
- Bai kiem tra/quiz.
- Ghi danh hoc vien, tien do hoc tap neu can demo.

## 2. Export bang phpMyAdmin

1. Mo XAMPP va start `Apache`, `MySQL`.
2. Vao `http://localhost/phpmyadmin`.
3. Chon database dang dung, mac dinh theo `.env.example` la `lms_db`.
4. Chon tab `Export`.
5. Chon `Quick` va format `SQL`.
6. Bam `Export`.
7. Luu file thanh:

```text
database/lms_database.sql
```

## 3. Export bang mysqldump

Mo Command Prompt tai thu muc goc project va chay:

```bat
mysqldump -u root -p lms_db > database\lms_database.sql
```

Neu MySQL cua XAMPP khong co password, khi hoi password chi can bam Enter.

Neu Windows bao khong nhan lenh `mysqldump`, dung duong dan day du, vi du:

```bat
"C:\xampp\mysql\bin\mysqldump.exe" -u root -p lms_db > database\lms_database.sql
```

## 4. Tao database tren may moi

Co the tao bang phpMyAdmin:

1. Mo `http://localhost/phpmyadmin`.
2. Chon `New`.
3. Nhap database name: `lms_db`.
4. Collation khuyen nghi: `utf8mb4_unicode_ci`.
5. Bam `Create`.

Hoac tao bang MySQL CLI:

```sql
CREATE DATABASE lms_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## 5. Import bang phpMyAdmin

1. Mo `http://localhost/phpmyadmin`.
2. Chon database `lms_db`.
3. Chon tab `Import`.
4. Chon file `database/lms_database.sql`.
5. Bam `Import`.

## 6. Import bang mysql CLI

```bat
mysql -u root -p lms_db < database\lms_database.sql
```

Neu dung XAMPP va Windows khong nhan lenh `mysql`:

```bat
"C:\xampp\mysql\bin\mysql.exe" -u root -p lms_db < database\lms_database.sql
```

## 7. Seed/script co san trong project

Project backend hien co mot so script seed trong `backend/package.json`:

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

Ngoai ra co file SQL mau:

```text
backend/seeds/seed.sql
backend/seeds/001_add_question_types_and_student_answers.sql
backend/seeds/002_create_survey_tables.sql
backend/seeds/migration_lesson_segments.sql
backend/seeds/migration_lesson_segments_content_items.sql
backend/seeds/migration_lesson_labels.sql
```

Luu y: de demo on dinh tren may khac, cach tot nhat la export database dang chay ra `database/lms_database.sql` roi import lai. Cac script seed phu hop khi can tao du lieu mau moi, nhung co the khong day du bang database that ban dang demo.

## 8. Tai khoan mau neu dung `backend/seeds/seed.sql`

Mat khau chung:

```text
password123
```

Tai khoan:

```text
Admin:      admin@lms.local
Giang vien: teacher@lms.local
Hoc vien 1: student1@lms.local
Hoc vien 2: student2@lms.local
```
