const lessonRepository = require('../repositories/lessonRepository');
const enrollmentRepository = require('../repositories/enrollmentRepository');
const { HttpError } = require('../utils/httpError');

const parseId = (value, fieldName) => {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, `${fieldName} must be a positive integer`, 'VALIDATION_ERROR');
  }

  return id;
};

const getLessonsByCourse = async (courseId) => {
  const parsedCourseId = parseId(courseId, 'courseId');
  const lessons = await lessonRepository.findByCourseId(parsedCourseId);

  return lessons.map((lesson) => {
    const plain = lesson.toJSON();
    return {
      id: plain.id,
      courseId: plain.courseId,
      title: plain.title,
      videoUrl: plain.videoUrl,
      content: plain.content,
      orderIndex: plain.orderIndex,
      createdAt: plain.createdAt,
    };
  });
};

const getLessonDetail = async (lessonId, currentUser) => {
  const parsedLessonId = parseId(lessonId, 'lessonId');
  const lesson = await lessonRepository.findByIdWithCourse(parsedLessonId);

  if (!lesson) {
    throw new HttpError(404, 'Lesson not found', 'LESSON_NOT_FOUND');
  }

  const plain = lesson.toJSON();

  if (currentUser?.role === 'student') {
    const enrollment = await enrollmentRepository.isUserEnrolledActive(currentUser.id, plain.courseId);

    if (!enrollment) {
      throw new HttpError(403, 'You are not enrolled in this course', 'NOT_ENROLLED');
    }
  }

  return {
    id: plain.id,
    courseId: plain.courseId,
    title: plain.title,
    videoUrl: plain.videoUrl,
    content: plain.content,
    orderIndex: plain.orderIndex,
    createdAt: plain.createdAt,
    course: plain.course
      ? {
          id: plain.course.id,
          title: plain.course.title,
          description: plain.course.description,
        }
      : null,
  };
};

const createLesson = async (courseId, payload, currentUser) => {
  if (!currentUser?.id) {
    throw new HttpError(401, 'Unauthorized', 'UNAUTHORIZED');
  }

  const parsedCourseId = parseId(courseId, 'courseId');
  const existingAtOrder = await lessonRepository.findByCourseIdAndOrderIndex(parsedCourseId, payload.orderIndex);

  if (existingAtOrder) {
    throw new HttpError(409, 'Lesson order already exists in this course', 'LESSON_ORDER_EXISTS');
  }

  const created = await lessonRepository.createLesson({
    courseId: parsedCourseId,
    title: payload.title,
    videoUrl: payload.videoUrl || null,
    content: payload.content || null,
    orderIndex: payload.orderIndex,
  });

  const plain = created.toJSON();
  return {
    id: plain.id,
    courseId: plain.courseId,
    title: plain.title,
    videoUrl: plain.videoUrl,
    content: plain.content,
    orderIndex: plain.orderIndex,
    createdAt: plain.createdAt,
  };
};

module.exports = {
  getLessonsByCourse,
  getLessonDetail,
  createLesson,
};