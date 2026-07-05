const courseRepository = require('../repositories/courseRepository');
const lessonRepository = require('../repositories/lessonRepository');
const enrollmentRepository = require('../repositories/enrollmentRepository');
const progressRepository = require('../repositories/progressRepository');
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

const normalizeContentItems = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_error) {
      return [];
    }
  }

  return [];
};

const isStudyContentItem = (item) => {
  return item && String(item.type || '').trim().toLowerCase() !== 'question';
};

const getContentViewedKey = (segmentId, itemIndex) => `${segmentId}-${itemIndex}`;

const isVideoCompleted = (positionSeconds, item, segment) => {
  const start = toNumber(item.startTime ?? segment.startTime, 0);
  const end = toNumber(item.endTime ?? segment.endTime, 0);

  if (end <= start) {
    return false;
  }

  return toNumber(positionSeconds, 0) >= start + ((end - start) * 0.5);
};

const getQuizCompletionScore = (completion) => {
  if (isPlainObject(completion)) {
    return toNumber(completion.score, 0);
  }

  return toNumber(completion, 0);
};

const mergeCompletionStudyState = (previousState = {}, nextState = {}) => {
  const previous = parsePlainObject(previousState);
  const next = parsePlainObject(nextState);
  const merged = { ...previous, ...next };

  if (isPlainObject(next.viewedContentItems)) {
    merged.viewedContentItems = {
      ...(isPlainObject(previous.viewedContentItems) ? previous.viewedContentItems : {}),
    };
    Object.entries(next.viewedContentItems).forEach(([key, value]) => {
      if (value) {
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
      const previousScore = getQuizCompletionScore(previousCompletions[key]);
      const nextScore = getQuizCompletionScore(value);
      if (!merged.quizCompletions[key] || nextScore >= previousScore) {
        merged.quizCompletions[key] = value;
      }
    });
  }

  merged.updatedAt = new Date().toISOString();
  return merged;
};

const getWatchPositionUpdatedTime = (watchPosition) => {
  if (!watchPosition) {
    return 0;
  }

  const candidates = [
    watchPosition.lastWatchedAt,
    watchPosition.updatedAt,
    watchPosition.createdAt,
  ];

  return candidates.reduce((latest, value) => {
    const time = value ? new Date(value).getTime() : 0;
    return Number.isFinite(time) && time > latest ? time : latest;
  }, 0);
};

const countStudyContentItems = (lesson) => {
  const plain = typeof lesson.toJSON === 'function' ? lesson.toJSON() : lesson;
  const segments = Array.isArray(plain.segments) ? plain.segments : [];

  return segments.reduce((total, segment) => {
    return total + normalizeContentItems(segment.contentItems).filter(isStudyContentItem).length;
  }, 0);
};

const isLessonCompletedByStudyState = (lesson, studyState) => {
  const normalizedStudyState = parsePlainObject(studyState);
  const plain = typeof lesson.toJSON === 'function' ? lesson.toJSON() : lesson;
  const segments = Array.isArray(plain.segments) ? plain.segments : [];
  const viewedContentItems = isPlainObject(normalizedStudyState.viewedContentItems) ? normalizedStudyState.viewedContentItems : {};
  const videoPositions = isPlainObject(normalizedStudyState.videoPositions) ? normalizedStudyState.videoPositions : {};
  const quizCompletions = isPlainObject(normalizedStudyState.quizCompletions) ? normalizedStudyState.quizCompletions : {};

  let totalItems = 0;
  let completedItems = 0;

  segments.forEach((segment) => {
    normalizeContentItems(segment.contentItems).forEach((item, itemIndex) => {
      if (!isStudyContentItem(item)) {
        return;
      }

      totalItems += 1;
      const key = getContentViewedKey(segment.id, itemIndex);
      const type = String(item.type || '').trim().toLowerCase();

      if (type === 'videoclip' || type === 'video' || type === 'youtube') {
        if (viewedContentItems[key] === true || isVideoCompleted(videoPositions[key], item, segment)) {
          completedItems += 1;
        }
        return;
      }

      if (type === 'quiz' || type === 'exercise') {
        if (viewedContentItems[key] === true || getQuizCompletionScore(quizCompletions[key]) >= 50) {
          completedItems += 1;
        }
        return;
      }

      if (viewedContentItems[key] === true) {
        completedItems += 1;
      }
    });
  });

  return totalItems > 0 && completedItems >= totalItems;
};

const markLessonCompleted = async (lessonId, currentUser, payload = {}) => {
  if (!currentUser?.id) {
    throw new HttpError(401, 'Unauthorized', 'UNAUTHORIZED');
  }

  const parsedLessonId = parseId(lessonId, 'lessonId');
  const lesson = await lessonRepository.findByIdWithSegments(parsedLessonId);

  if (!lesson) {
    throw new HttpError(404, 'Lesson not found', 'LESSON_NOT_FOUND');
  }

  const lessonPlain = lesson.toJSON();
  await ensureStudentEnrolled(currentUser, lessonPlain.courseId);

  const existingWatchPosition = await lessonWatchPositionRepository.findByUserAndLesson(currentUser.id, parsedLessonId);
  const existingWatchPositionPlain = existingWatchPosition?.toJSON ? existingWatchPosition.toJSON() : existingWatchPosition;
  const existingStudyState = parsePlainObject(existingWatchPositionPlain?.studyState);
  const requestedStudyState = parsePlainObject(payload?.studyState);
  const studyStateForValidation = mergeCompletionStudyState(existingStudyState, requestedStudyState);
  const requestedPositionSeconds = toNumber(payload?.positionSeconds, 0);
  const hasStructuredStudyItems = countStudyContentItems(lesson) > 0;

  if (hasStructuredStudyItems && !isLessonCompletedByStudyState(lesson, studyStateForValidation)) {
    throw new HttpError(
      400,
      'Lesson has not completed all required content items',
      'LESSON_NOT_COMPLETED',
    );
  }

  const nextStudyState = {
    ...studyStateForValidation,
    lessonCompleted: true,
    lessonCompletedAt: new Date().toISOString(),
  };
  const nextPositionSeconds = Math.max(
    toNumber(existingWatchPositionPlain?.positionSeconds, 0),
    requestedPositionSeconds,
    toNumber(nextStudyState.resumeSeconds, 0),
  );

  if (existingWatchPosition) {
    await lessonWatchPositionRepository.updateWatchPosition(existingWatchPosition, {
      studyState: nextStudyState,
      positionSeconds: nextPositionSeconds,
      lastWatchedAt: new Date(),
    });
  } else {
    await lessonWatchPositionRepository.createWatchPosition({
      userId: currentUser.id,
      lessonId: parsedLessonId,
      positionSeconds: nextPositionSeconds,
      lastWatchedAt: new Date(),
      studyState: nextStudyState,
    });
  }

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

  const lessons = await courseRepository.findLessonsWithSegmentsByCourseId(parsedCourseId);
  const lessonIds = lessons.map((lesson) => lesson.id);

  if (lessonIds.length === 0) {
    return {
      courseId: parsedCourseId,
      totalLessons: 0,
      completedLessons: 0,
      completionPercent: 0,
      completedLessonIds: [],
      resumeLessonId: null,
      resumePositionSeconds: 0,
      resumeLastWatchedAt: null,
      resumeStudyState: {},
    };
  }

  const [completedProgress, watchPositions] = await Promise.all([
    progressRepository.findCompletedByUserAndLessonIds(currentUser.id, lessonIds),
    lessonWatchPositionRepository.findByUserAndLessonIds(currentUser.id, lessonIds),
  ]);
  const completedProgressLessonIds = new Set(completedProgress.map((item) => Number(item.lessonId)).filter(Boolean));
  const completedLessonIds = new Set();
  const watchPositionByLessonId = new Map();
  const plainWatchPositions = watchPositions.map((item) => item.toJSON());

  plainWatchPositions.forEach((plain) => {
    const lessonId = Number(plain.lessonId);
    const existing = watchPositionByLessonId.get(lessonId);
    if (!existing || getWatchPositionUpdatedTime(plain) > getWatchPositionUpdatedTime(existing)) {
      watchPositionByLessonId.set(lessonId, plain);
    }
  });

  const latestWatchPosition = plainWatchPositions
    .sort((left, right) => getWatchPositionUpdatedTime(right) - getWatchPositionUpdatedTime(left))[0] || null;
  const latestStudyState = parsePlainObject(latestWatchPosition?.studyState);

  lessons.forEach((lesson) => {
    const lessonId = Number(lesson.id);
    const watchPosition = watchPositionByLessonId.get(lessonId);
    const studyState = parsePlainObject(watchPosition?.studyState);
    const hasStructuredStudyItems = countStudyContentItems(lesson) > 0;

    if (studyState.lessonCompleted === true) {
      completedLessonIds.add(lessonId);
      return;
    }

    if (isLessonCompletedByStudyState(lesson, studyState)) {
      completedLessonIds.add(lessonId);
      return;
    }

    if (!hasStructuredStudyItems && completedProgressLessonIds.has(lessonId)) {
      completedLessonIds.add(lessonId);
    }
  });

  const completedLessons = completedLessonIds.size;
  const completionPercent = Math.round((completedLessons * 10000) / lessonIds.length) / 100;

  return {
    courseId: parsedCourseId,
    totalLessons: lessonIds.length,
    completedLessons,
    completionPercent,
    completedLessonIds: Array.from(completedLessonIds),
    resumeLessonId: latestWatchPosition ? Number(latestWatchPosition.lessonId) : null,
    resumePositionSeconds: latestWatchPosition ? toNumber(latestWatchPosition.positionSeconds, 0) : 0,
    resumeLastWatchedAt: latestWatchPosition?.lastWatchedAt || latestWatchPosition?.updatedAt || null,
    resumeStudyState: latestStudyState,
  };
};

module.exports = {
  markLessonCompleted,
  getCourseProgress,
};
