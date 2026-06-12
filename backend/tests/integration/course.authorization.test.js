const jwt = require('jsonwebtoken');
const request = require('supertest');

const { createApp } = require('../../src/app');
const { env } = require('../../src/config/env');

describe('Course authorization integration', () => {
  const app = createApp();

  const signToken = (role) => {
    return jwt.sign(
      {
        id: 999,
        email: `${role}@example.com`,
        role,
      },
      env.jwtSecret,
      { expiresIn: '10m' },
    );
  };

  it('POST /api/courses requires authentication', async () => {
    const response = await request(app).post('/api/courses').send({
      title: 'Course test',
      description: 'desc',
      price: 0,
    });

    expect(response.status).toBe(401);
  });

  it('POST /api/courses forbids student role', async () => {
    const token = signToken('student');

    const response = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Course test',
        description: 'desc',
        price: 0,
      });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('FORBIDDEN');
  });

  it('POST /api/courses validates payload shape', async () => {
    const token = signToken('teacher');

    const response = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'No',
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('VALIDATION_ERROR');
  });
});
