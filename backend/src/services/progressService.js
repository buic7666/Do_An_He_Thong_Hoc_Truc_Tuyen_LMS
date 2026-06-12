const courseRepository = require('../repositories/courseRepository');
const lessonRepository = require('../repositories/lessonRepository');
const enrollmentRepository = require('../repositories/enrollmentRepository');
const progressRepository = require('../repositories/progressRepository');
const { HttpError } = require('../utils/httpError');

const parseId = (value, fieldName) => {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, `${fieldName} must be a positive integer`, 'VALIDATION_ERROR');
  }

  return id;
};

const ensureStudentEnrolled = async (user, courseId) => {
  if (user?.role !== 'student') {
    return;
  }

  const enrollment = await enrollmentRepository.isUserEnrolledActive(user.id, courseId);

  if (!enrollment) {
    throw new HttpError(403, 'You are not enrolled in this course', 'NOT_ENROLLED');
  }
};

const markLessonCompleted = async (lessonId, currentUser) => {
  if (!currentUser?.id) {
    throw new HttpError(401, 'Unauthorized', 'UNAUTHORIZED');
  }

  const parsedLessonId = parseId(lessonId, 'lessonId');
  const lesson = await lessonRepository.findById(parsedLessonId);

  if (!lesson) {
    throw new HttpError(404, 'Lesson not found', 'LESSON_NOT_FOUND');
  }

  const lessonPlain = lesson.toJSON();
  await ensureStudentEnrolled(currentUser, lessonPlain.courseId);

  const existingProgress = await progressRepository.findByUserAndLesson(currentUser.id, parsedLessonId);

  let savedProgress;
  if (existingProgress) {
    savedProgress = await progressRepository.updateProgress(existingProgress, {
      isCompleted: true,
      completedAt: new Date(),
    });
  } else {
    savedProgress = await progressRepository.createProgress({
      userId: currentUser.id,
      lessonId: parsedLessonId,
      isCompleted: true,
      completedAt: new Date(),
    });
  }

  const plain = savedProgress.toJSON();

  return {
    id: plain.id,
    userId: plain.userId,
    lessonId: plain.lessonId,
    isCompleted: plain.isCompleted,
    completedAt: plain.completedAt,
    updatedAt: plain.updatedAt,
  };
};

const getCourseProgress = async (courseId, currentUser) => {
  if (!currentUser?.id) {
    throw new HttpError(401, 'Unauthorized', 'UNAUTHORIZED');
  }

  const parsedCourseId = parseId(courseId, 'courseId');
  const course = await courseRepository.findById(parsedCourseId);

  if (!course) {
    throw new HttpError(404, 'Course not found', 'COURSE_NOT_FOUND');
  }

  await ensureStudentEnrolled(currentUser, parsedCourseId);

  const lessons = await courseRepository.findLessonsByCourseId(parsedCourseId);
  const lessonIds = lessons.map((lesson) => lesson.id);

  if (lessonIds.length === 0) {
    return {
      courseId: parsedCourseId,
      totalLessons: 0,
      completedLessons: 0,
      completionPercent: 0,
      completedLessonIds: [],
    };
  }

  const completedProgress = await progressRepository.findCompletedByUserAndLessonIds(currentUser.id, lessonIds);
  const completedLessons = completedProgress.length;
  const completionPercent = Math.round((completedLessons * 10000) / lessonIds.length) / 100;

  return {
    courseId: parsedCourseId,
    totalLessons: lessonIds.length,
    completedLessons,
    completionPercent,
    completedLessonIds: completedProgress.map((item) => Number(item.lessonId)).filter(Boolean),
  };
};

module.exports = {
  markLessonCompleted,
  getCourseProgress,
};
