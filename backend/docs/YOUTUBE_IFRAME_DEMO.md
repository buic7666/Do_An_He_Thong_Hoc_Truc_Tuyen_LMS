# YouTube IFrame Demo Guide

## What is implemented

- Real YouTube playback via YouTube IFrame API on student learning screen.
- Resume lesson at last watched second.
- Auto-save watch position every 5 seconds while video is playing.
- Save watch position on pause/end and when switching lesson.
- Mark lesson complete at video end (auto) or by button.

## New backend APIs

- `GET /api/lessons/:id/watch-position`
- `POST /api/lessons/:id/watch-position`
  - body:
    ```json
    {
      "positionSeconds": 125
    }
    ```

Both endpoints require JWT token. For student role, enrollment is verified.

## Seed demo data

`backend/seeds/seed.sql` now includes:

- Valid bcrypt password hash for all seeded users.
- Real YouTube URLs in seeded lessons.

Demo credentials:

- `student1@lms.local` / `password123`
- `student2@lms.local` / `password123`
- `teacher@lms.local` / `password123`
- `admin@lms.local` / `password123`

## Run demo end-to-end

1. Seed database using `backend/seeds/seed.sql`.
2. Start backend: `npm start` in `backend`.
3. Start frontend: `npm run dev` in `frontend`.
4. Login with `student1@lms.local` / `password123`.
5. Open learning page:
   - `http://localhost:5173/learn?courseId=1&lessonId=1`
6. Play video for 10-20 seconds.
7. Refresh page or switch lesson and come back.
8. Player should seek to saved position automatically.

## Notes

- Watch position is stored in table `lesson_watch_positions`.
- This table is created automatically at backend startup via Sequelize sync.
- If your backend uses a different base URL/port, update `VITE_API_BASE_URL` in frontend env.
