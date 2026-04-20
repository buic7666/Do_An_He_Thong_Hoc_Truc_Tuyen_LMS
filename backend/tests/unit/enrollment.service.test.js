jest.mock('../../src/repositories/enrollmentRepository', () => ({
  createEnrollment: jest.fn(),
  findByUserAndCourse: jest.fn(),
  isUserEnrolledActive: jest.fn(),
  findByUserId: jest.fn(),
}));

jest.mock('../../src/repositories/courseRepository', () => ({
  findById: jest.fn(),
}));

const enrollmentService = require('../../src/services/enrollmentService');
const enrollmentRepository = require('../../src/repositories/enrollmentRepository');
const courseRepository = require('../../src/repositories/courseRepository');

describe('Enrollment service unit', () => {
  it('throws 403 when non-student tries to enroll', async () => {
    await expect(
      enrollmentService.enrollCourse({ courseId: 1 }, { id: 1, role: 'teacher' }),
    ).rejects.toMatchObject({ statusCode: 403, errorCode: 'FORBIDDEN' });
  });

  it('throws 409 when duplicate enrollment exists', async () => {
    courseRepository.findById.mockResolvedValue({ id: 1, toJSON: () => ({ id: 1, title: 'C1' }) });
    enrollmentRepository.findByUserAndCourse.mockResolvedValue({ id: 1 });

    await expect(
      enrollmentService.enrollCourse({ courseId: 1 }, { id: 10, role: 'student' }),
    ).rejects.toMatchObject({ statusCode: 409, errorCode: 'ENROLLMENT_ALREADY_EXISTS' });
  });

  it('creates enrollment when payload valid', async () => {
    courseRepository.findById.mockResolvedValue({
      toJSON: () => ({ id: 1, title: 'Course', description: '', price: 0 }),
    });
    enrollmentRepository.findByUserAndCourse.mockResolvedValue(null);
    enrollmentRepository.createEnrollment.mockResolvedValue({
      toJSON: () => ({ id: 5, userId: 10, courseId: 1, status: 'active', createdAt: '2026-01-01' }),
    });

    const result = await enrollmentService.enrollCourse({ courseId: 1 }, { id: 10, role: 'student' });

    expect(result.id).toBe(5);
    expect(result.courseId).toBe(1);
    expect(result.status).toBe('active');
  });
});
