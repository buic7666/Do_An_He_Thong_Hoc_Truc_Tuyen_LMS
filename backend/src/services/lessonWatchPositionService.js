const lessonRepository = require('../repositories/lessonRepository');
const enrollmentRepository = require('../repositories/enrollmentRepository');
const lessonWatchPositionRepository = require('../repositories/lessonWatchPositionRepository');
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

const getLessonOrThrow = async (lessonId) => {
  const parsedLessonId = parseId(lessonId, 'lessonId');
  const lesson = await lessonRepository.findById(parsedLessonId);

  if (!lesson) {
    throw new HttpError(404, 'Lesson not found', 'LESSON_NOT_FOUND');
  }

  return lesson;
};

const getWatchPosition = async (lessonId, currentUser) => {
  if (!currentUser?.id) {
    throw new HttpError(401, 'Unauthorized', 'UNAUTHORIZED');
  }

  const lesson = await getLessonOrThrow(lessonId);
  const lessonPlain = lesson.toJSON();

  await ensureStudentEnrolled(currentUser, lessonPlain.courseId);

  const watchPosition = await lessonWatchPositionRepository.findByUserAndLesson(currentUser.id, lessonPlain.id);

  if (!watchPosition) {
    return {
      lessonId: lessonPlain.id,
      positionSeconds: 0,
      lastWatchedAt: null,
    };
  }

  const plain = watchPosition.toJSON();

  return {
    lessonId: plain.lessonId,
    positionSeconds: plain.positionSeconds,
    lastWatchedAt: plain.lastWatchedAt,
  };
};

const saveWatchPosition = async (lessonId, payload, currentUser) => {
  if (!currentUser?.id) {
    throw new HttpError(401, 'Unauthorized', 'UNAUTHORIZED');
  }

  const lesson = await getLessonOrThrow(lessonId);
  const lessonPlain = lesson.toJSON();

  await ensureStudentEnrolled(currentUser, lessonPlain.courseId);

  const parsedPositionSeconds = Number(payload?.positionSeconds);

  if (!Number.isFinite(parsedPositionSeconds) || parsedPositionSeconds < 0) {
    throw new HttpError(400, 'positionSeconds must be a non-negative number', 'VALIDATION_ERROR');
  }

  const normalizedPositionSeconds = Math.floor(parsedPositionSeconds);
  const now = new Date();

  const existing = await lessonWatchPositionRepository.findByUserAndLesson(currentUser.id, lessonPlain.id);

  let saved;
  if (existing) {
    saved = await lessonWatchPositionRepository.updateWatchPosition(existing, {
      positionSeconds: normalizedPositionSeconds,
      lastWatchedAt: now,
    });
  } else {
    saved = await lessonWatchPositionRepository.createWatchPosition({
      userId: currentUser.id,
      lessonId: lessonPlain.id,
      positionSeconds: normalizedPositionSeconds,
      lastWatchedAt: now,
    });
  }

  const plain = saved.toJSON();

  return {
    lessonId: plain.lessonId,
    positionSeconds: plain.positionSeconds,
    lastWatchedAt: plain.lastWatchedAt,
  };
};

module.exports = {
  getWatchPosition,
  saveWatchPosition,
};