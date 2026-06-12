const request = require('supertest');

jest.mock('../../src/services/authService', () => ({
  register: jest.fn(),
  login: jest.fn(),
  getCurrentUser: jest.fn(),
}));

const authService = require('../../src/services/authService');
const { createApp } = require('../../src/app');

describe('Auth routes integration', () => {
  const app = createApp();

  it('POST /api/auth/register returns 201 when service succeeds', async () => {
    authService.register.mockResolvedValue({ id: 1, email: 'a@b.com' });

    const response = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'a@b.com',
      password: 'password123',
      role: 'student',
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(1);
  });

  it('POST /api/auth/login returns 400 on schema validation failure', async () => {
    const response = await request(app).post('/api/auth/login').send({
      password: 'password123',
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('VALIDATION_ERROR');
  });

  it('GET /api/auth/me returns 401 without bearer token', async () => {
    const response = await request(app).get('/api/auth/me');

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('UNAUTHORIZED');
  });
});
