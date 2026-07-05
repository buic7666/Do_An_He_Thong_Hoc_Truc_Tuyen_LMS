import { getCurrentUserSafely } from './authRedirect';

const STUDENT_COURSE_PROGRESS_CACHE_PREFIX = 'lms-course-progress';

const getStudentKey = () => {
  const currentUser = getCurrentUserSafely();
  return currentUser?.id || currentUser?.email || 'guest';
};

const getCourseProgressCacheKey = (courseId) => {
  const parsedCourseId = Number(courseId);
  if (!parsedCourseId) {
    return null;
  }

  return `${STUDENT_COURSE_PROGRESS_CACHE_PREFIX}:${getStudentKey()}:${parsedCourseId}`;
};

const getCompletedIds = (progress) => (
  Array.isArray(progress?.completedLessonIds)
    ? progress.completedLessonIds.map(Number).filter(Boolean)
    : []
);

export const mergeCourseProgress = (baseProgress = {}, nextProgress = {}) => {
  const completedLessonIds = Array.from(new Set([
    ...getCompletedIds(baseProgress),
    ...getCompletedIds(nextProgress),
  ]));
  const totalLessons = Math.max(
    Number(baseProgress?.totalLessons || 0),
    Number(nextProgress?.totalLessons || 0),
  );
  const completedLessons = Math.max(
    Number(baseProgress?.completedLessons || 0),
    Number(nextProgress?.completedLessons || 0),
    completedLessonIds.length,
  );
  const completionPercent = totalLessons > 0
    ? Math.round((completedLessons * 10000) / totalLessons) / 100
    : Math.max(Number(baseProgress?.completionPercent || 0), Number(nextProgress?.completionPercent || 0));
  const resumePositionSeconds = Math.max(
    Number(baseProgress?.resumePositionSeconds || 0),
    Number(nextProgress?.resumePositionSeconds || 0),
  );

  return {
    ...baseProgress,
    ...nextProgress,
    totalLessons,
    completedLessons,
    completionPercent,
    completedLessonIds,
    resumeLessonId: nextProgress?.resumeLessonId || baseProgress?.resumeLessonId || null,
    resumePositionSeconds,
    resumeLastWatchedAt: nextProgress?.resumeLastWatchedAt || baseProgress?.resumeLastWatchedAt || null,
    resumeStudyState: nextProgress?.resumeStudyState || baseProgress?.resumeStudyState || {},
    cachedAt: new Date().toISOString(),
  };
};

export const readStudentCourseProgressCache = (courseId) => {
  const key = getCourseProgressCacheKey(courseId);
  if (!key || typeof window === 'undefined') {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(key);
    return rawValue ? JSON.parse(rawValue) : null;
  } catch (_error) {
    return null;
  }
};

export const writeStudentCourseProgressCache = (courseId, progress) => {
  const key = getCourseProgressCacheKey(courseId);
  if (!key || typeof window === 'undefined' || !progress) {
    return null;
  }

  const merged = mergeCourseProgress(readStudentCourseProgressCache(courseId) || {}, progress);

  try {
    window.localStorage.setItem(key, JSON.stringify(merged));
  } catch (_error) {
    // localStorage can be unavailable in private or restricted browser modes.
  }

  return merged;
};
