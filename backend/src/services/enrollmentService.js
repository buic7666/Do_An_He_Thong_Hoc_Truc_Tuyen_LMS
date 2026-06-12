const enrollmentRepository = require('../repositories/enrollmentRepository');
const courseRepository = require('../repositories/courseRepository');
const { HttpError } = require('../utils/httpError');

const parseId = (value, fieldName) => {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, `${fieldName} must be a positive integer`, 'VALIDATION_ERROR');
  }

  return id;
};

const enrollCourse = async (payload, currentUser) => {
  if (!currentUser?.id) {
    throw new HttpError(401, 'Unauthorized', 'UNAUTHORIZED');
  }

  if (currentUser.role !== 'student') {
    throw new HttpError(403, 'Only student can enroll in a course', 'FORBIDDEN');
  }

  const courseId = parseId(payload?.courseId, 'courseId');
  const course = await courseRepository.findById(courseId);

  if (!course) {
    throw new HttpError(404, 'Course not found', 'COURSE_NOT_FOUND');
  }

  const existingEnrollment = await enrollmentRepository.findByUserAndCourse(currentUser.id, courseId);

  if (existingEnrollment) {
    throw new HttpError(409, 'You already enrolled in this course', 'ENROLLMENT_ALREADY_EXISTS');
  }

  const enrollment = await enrollmentRepository.createEnrollment({
    userId: currentUser.id,
    courseId,
    status: 'active',
  });

  const enrollmentPlain = enrollment.toJSON();
  const coursePlain = course.toJSON();

  return {
    id: enrollmentPlain.id,
    userId: enrollmentPlain.userId,
    courseId: enrollmentPlain.courseId,
    status: enrollmentPlain.status,
    createdAt: enrollmentPlain.createdAt,
    course: {
      id: coursePlain.id,
      title: coursePlain.title,
      description: coursePlain.description,
      price: Number(coursePlain.price || 0),
    },
  };
};

const getMyEnrollments = async (currentUser) => {
  if (!currentUser?.id) {
    throw new HttpError(401, 'Unauthorized', 'UNAUTHORIZED');
  }

  const enrollments = await enrollmentRepository.findByUserId(currentUser.id);

  return enrollments.map((enrollment) => {
    const plain = enrollment.toJSON();

    return {
      id: plain.id,
      userId: plain.userId,
      courseId: plain.courseId,
      status: plain.status,
      createdAt: plain.createdAt,
      course: plain.course
        ? {
            id: plain.course.id,
            title: plain.course.title,
            description: plain.course.description,
            price: Number(plain.course.price || 0),
            instructorId: plain.course.instructorId,
          }
        : null,
    };
  });
};

module.exports = {
  enrollCourse,
  getMyEnrollments,
};