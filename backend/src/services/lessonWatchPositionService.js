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

const isPlainObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const parsePlainObject = (value) => {
  if (isPlainObject(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return isPlainObject(parsed) ? parsed : {};
    } catch (_error) {
      return {};
    }
  }

  return {};
};

const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const mergeStudyState = (previousState = {}, nextState = {}) => {
  const previous = parsePlainObject(previousState);
  const next = parsePlainObject(nextState);
  const merged = { ...previous, ...next };

  if (isPlainObject(next.viewedContentItems)) {
    merged.viewedContentItems = {
      ...(isPlainObject(previous.viewedContentItems) ? previous.viewedContentItems : {}),
    };
    Object.entries(next.viewedContentItems).forEach(([key, isViewed]) => {
      if (isViewed) {
        merged.viewedContentItems[key] = true;
      }
    });
  }

  if (isPlainObject(next.videoPositions)) {
    const previousPositions = isPlainObject(previous.videoPositions) ? previous.videoPositions : {};
    merged.videoPositions = { ...previousPositions };

    Object.entries(next.videoPositions).forEach(([key, value]) => {
      merged.videoPositions[key] = Math.max(
        toNumber(previousPositions[key], 0),
        toNumber(value, 0),
      );
    });
  }

  if (isPlainObject(next.quizCompletions)) {
    const previousCompletions = isPlainObject(previous.quizCompletions) ? previous.quizCompletions : {};
    merged.quizCompletions = { ...previousCompletions };

    Object.entries(next.quizCompletions).forEach(([key, value]) => {
      const previousScore = toNumber(previousCompletions[key]?.score ?? previousCompletions[key], -1);
      const nextScore = toNumber(value?.score ?? value, -1);

      if (!merged.quizCompletions[key] || nextScore >= previousScore) {
        merged.quizCompletions[key] = value;
      }
    });
  }

  merged.updatedAt = new Date().toISOString();
  return merged;
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
      studyState: {},
    };
  }

  const plain = watchPosition.toJSON();

  return {
    lessonId: plain.lessonId,
    positionSeconds: plain.positionSeconds,
    lastWatchedAt: plain.lastWatchedAt,
    studyState: parsePlainObject(plain.studyState),
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
  const existingPlain = existing?.toJSON ? existing.toJSON() : existing;
  const nextStudyState = mergeStudyState(existingPlain?.studyState, payload?.studyState);
  const nextPositionSeconds = Math.max(
    Number(existingPlain?.positionSeconds || 0),
    normalizedPositionSeconds,
  );

  let saved;
  if (existing) {
    saved = await lessonWatchPositionRepository.updateWatchPosition(existing, {
      positionSeconds: nextPositionSeconds,
      lastWatchedAt: now,
      studyState: nextStudyState,
    });
  } else {
    saved = await lessonWatchPositionRepository.createWatchPosition({
      userId: currentUser.id,
      lessonId: lessonPlain.id,
      positionSeconds: nextPositionSeconds,
      lastWatchedAt: now,
      studyState: nextStudyState,
    });
  }

  const plain = saved.toJSON();

  return {
    lessonId: plain.lessonId,
    positionSeconds: plain.positionSeconds,
    lastWatchedAt: plain.lastWatchedAt,
    studyState: parsePlainObject(plain.studyState),
  };
};

module.exports = {
  getWatchPosition,
  saveWatchPosition,
};
