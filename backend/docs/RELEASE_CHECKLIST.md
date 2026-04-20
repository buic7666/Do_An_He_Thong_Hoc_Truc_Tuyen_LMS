# Backend Release And Deploy Checklist

## 1. Pre-release validation

- [ ] Pull latest code and install dependencies (`npm ci`)
- [ ] Run lint (`npm run lint`)
- [ ] Run unit tests (`npm run test:unit`)
- [ ] Run integration tests (`npm run test:integration`)
- [ ] Run full test suite (`npm run test`)
- [ ] Verify `.env` values for production
- [ ] Check DB migration/seed compatibility with current schema

## 2. Security hardening checks

- [ ] `helmet` enabled in app middleware
- [ ] Rate limit configured (`RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`)
- [ ] JWT secret is strong and rotated if required
- [ ] CORS origin list limited for production
- [ ] Input validation enabled on all critical routes
- [ ] No sensitive data in API error responses

## 3. Runtime and monitoring

- [ ] Request logging enabled (`x-request-id` + morgan logs)
- [ ] Health endpoint responds (`/health`)
- [ ] Alerting/monitoring connected (if using external service)
- [ ] Node process manager configured (PM2, Docker, systemd)

## 4. Deploy steps

- [ ] Backup database before deploy
- [ ] Deploy backend artifact/container
- [ ] Apply DB migration scripts (if any)
- [ ] Restart backend process
- [ ] Run smoke tests against deployed URL

## 5. Smoke test checklist after deploy

- [ ] `POST /api/auth/register` -> 201
- [ ] `POST /api/auth/login` -> 200
- [ ] `GET /api/auth/me` -> 200 with token
- [ ] `GET /api/courses` -> 200
- [ ] `POST /api/enrollments` -> 201 (student)
- [ ] `POST /api/courses` -> 201 (teacher/admin only)
- [ ] `POST /api/lessons/course/:courseId` -> 201 (teacher/admin only)
- [ ] `POST /api/lessons/:id/progress` -> 200

## 6. Rollback plan

- [ ] Keep previous backend artifact available
- [ ] Keep DB backup snapshot ready
- [ ] Define rollback trigger threshold (error rate / latency)
- [ ] Verify rollback procedure in staging environment
