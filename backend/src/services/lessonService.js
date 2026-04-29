const lessonRepository = require('../repositories/lessonRepository');
const enrollmentRepository = require('../repositories/enrollmentRepository');
const { sequelize } = require('../config/database');
const { Lesson, LessonSegment } = require('../models');
const { HttpError } = require('../utils/httpError');

const parseId = (value, fieldName) => {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, `${fieldName} must be a positive integer`, 'VALIDATION_ERROR');
  }

  return id;
};

const mapLessonSegment = (segment) => {
  const plain = segment.toJSON ? segment.toJSON() : segment;

  return {
    id: plain.id,
    lessonId: plain.lessonId,
    startTime: plain.startTime,
    endTime: plain.endTime,
    duration: plain.duration,
    title: plain.title,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

const assertSegmentRange = (startTime, endTime) => {
  if (!Number.isInteger(startTime) || !Number.isInteger(endTime)) {
    throw new HttpError(400, 'Segment times must be integers', 'INVALID_SEGMENT_RANGE');
  }

  if (startTime < 0 || endTime <= startTime) {
    throw new HttpError(400, 'endTime must be greater than startTime', 'INVALID_SEGMENT_RANGE');
  }
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
      chapterId: plain.chapterId,
      createdAt: plain.createdAt,
    };
  });
};

const getLessonDetail = async (lessonId, currentUser) => {
  const parsedLessonId = parseId(lessonId, 'lessonId');
  const lesson = await Lesson.findByPk(parsedLessonId, {
    include: [
      {
        association: 'course',
        attributes: ['id', 'title', 'description'],
      },
      {
        association: 'segments',
        attributes: ['id', 'startTime', 'endTime', 'duration', 'title'],
        order: [['startTime', 'ASC']],
      },
    ],
  });

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
    chapterId: plain.chapterId,
    segments: Array.isArray(plain.segments)
      ? plain.segments.map((segment) => ({
          id: segment.id,
          startTime: segment.startTime,
          endTime: segment.endTime,
          duration: segment.duration,
          title: segment.title,
        }))
      : [],
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
    chapterId: payload.chapterId || null,
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
    chapterId: plain.chapterId,
    createdAt: plain.createdAt,
  };
};

const updateLesson = async (lessonId, payload, currentUser) => {
  if (!currentUser?.id) {
    throw new HttpError(401, 'Unauthorized', 'UNAUTHORIZED');
  }

  const parsedLessonId = parseId(lessonId, 'lessonId');
  const lesson = await Lesson.findByPk(parsedLessonId, {
    include: [{ association: 'course', attributes: ['id', 'instructorId'] }],
  });

  if (!lesson) {
    throw new HttpError(404, 'Lesson not found', 'LESSON_NOT_FOUND');
  }

  if (lesson.course?.instructorId !== currentUser.id) {
    throw new HttpError(403, 'You are not the instructor', 'FORBIDDEN');
  }

  if (payload.orderIndex) {
    const duplicate = await lessonRepository.findByCourseIdAndOrderIndex(lesson.courseId, payload.orderIndex);
    if (duplicate && Number(duplicate.id) !== Number(lesson.id)) {
      throw new HttpError(409, 'Lesson order already exists in this course', 'LESSON_ORDER_EXISTS');
    }
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'chapterId')) {
    lesson.chapterId = payload.chapterId || null;
  }

  lesson.title = payload.title ?? lesson.title;
  lesson.videoUrl = payload.videoUrl ?? lesson.videoUrl;
  lesson.content = payload.content ?? lesson.content;
  lesson.orderIndex = payload.orderIndex ?? lesson.orderIndex;

  await lesson.save();

  const plain = lesson.toJSON();
  return {
    id: plain.id,
    courseId: plain.courseId,
    chapterId: plain.chapterId,
    title: plain.title,
    videoUrl: plain.videoUrl,
    content: plain.content,
    orderIndex: plain.orderIndex,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

const deleteLesson = async (lessonId, currentUser) => {
  if (!currentUser?.id) {
    throw new HttpError(401, 'Unauthorized', 'UNAUTHORIZED');
  }

  const parsedLessonId = parseId(lessonId, 'lessonId');
  const lesson = await Lesson.findByPk(parsedLessonId, {
    include: [{ association: 'course', attributes: ['id', 'instructorId'] }],
  });

  if (!lesson) {
    throw new HttpError(404, 'Lesson not found', 'LESSON_NOT_FOUND');
  }

  if (lesson.course?.instructorId !== currentUser.id) {
    throw new HttpError(403, 'You are not the instructor', 'FORBIDDEN');
  }

  await lesson.destroy();
  return { id: parsedLessonId, deleted: true };
};

const createLessonSegment = async (lessonId, payload, currentUser) => {
  if (!currentUser?.id) {
    throw new HttpError(401, 'Unauthorized', 'UNAUTHORIZED');
  }

  const parsedLessonId = parseId(lessonId, 'lessonId');
  const lesson = await Lesson.findByPk(parsedLessonId, {
    include: [{ association: 'course', attributes: ['id', 'instructorId'] }],
  });

  if (!lesson) {
    throw new HttpError(404, 'Lesson not found', 'LESSON_NOT_FOUND');
  }

  if (lesson.course?.instructorId !== currentUser.id) {
    throw new HttpError(403, 'You are not the instructor', 'FORBIDDEN');
  }

  const startTime = Number(payload.startTime);
  const endTime = Number(payload.endTime);
  assertSegmentRange(startTime, endTime);

  const created = await LessonSegment.create({
    lessonId: parsedLessonId,
    startTime,
    endTime,
    duration: endTime - startTime,
    title: payload.title?.trim() || null,
  });

  return mapLessonSegment(created);
};

const updateLessonSegment = async (segmentId, payload, currentUser) => {
  if (!currentUser?.id) {
    throw new HttpError(401, 'Unauthorized', 'UNAUTHORIZED');
  }

  const parsedSegmentId = parseId(segmentId, 'segmentId');
  const segment = await LessonSegment.findByPk(parsedSegmentId, {
    include: [
      {
        association: 'lesson',
        include: [{ association: 'course', attributes: ['id', 'instructorId'] }],
      },
    ],
  });

  if (!segment) {
    throw new HttpError(404, 'Segment not found', 'SEGMENT_NOT_FOUND');
  }

  if (segment.lesson?.course?.instructorId !== currentUser.id) {
    throw new HttpError(403, 'You are not the instructor', 'FORBIDDEN');
  }

  const nextStartTime = Object.prototype.hasOwnProperty.call(payload, 'startTime')
    ? Number(payload.startTime)
    : segment.startTime;
  const nextEndTime = Object.prototype.hasOwnProperty.call(payload, 'endTime')
    ? Number(payload.endTime)
    : segment.endTime;

  assertSegmentRange(nextStartTime, nextEndTime);

  segment.startTime = nextStartTime;
  segment.endTime = nextEndTime;
  segment.duration = nextEndTime - nextStartTime;

  if (Object.prototype.hasOwnProperty.call(payload, 'title')) {
    segment.title = payload.title?.trim() || null;
  }

  await segment.save();
  return mapLessonSegment(segment);
};

const createLessonSegmentsBulk = async (lessonId, payload, currentUser) => {
  if (!currentUser?.id) {
    throw new HttpError(401, 'Unauthorized', 'UNAUTHORIZED');
  }

  const parsedLessonId = parseId(lessonId, 'lessonId');
  const lesson = await Lesson.findByPk(parsedLessonId, {
    include: [{ association: 'course', attributes: ['id', 'instructorId'] }],
  });

  if (!lesson) {
    throw new HttpError(404, 'Lesson not found', 'LESSON_NOT_FOUND');
  }

  if (lesson.course?.instructorId !== currentUser.id) {
    throw new HttpError(403, 'You are not the instructor', 'FORBIDDEN');
  }

  if (!Array.isArray(payload.segments) || payload.segments.length === 0) {
    throw new HttpError(400, 'segments must be a non-empty array', 'INVALID_SEGMENT_RANGE');
  }

  const normalizedSegments = payload.segments
    .map((segment, index) => {
      const startTime = Number(segment.startTime);
      const endTime = Number(segment.endTime);
      assertSegmentRange(startTime, endTime);

      return {
        lessonId: parsedLessonId,
        startTime,
        endTime,
        duration: endTime - startTime,
        title: segment.title?.trim() || `Segment ${index + 1}`,
      };
    })
    .sort((left, right) => left.startTime - right.startTime || left.endTime - right.endTime);

  for (let index = 1; index < normalizedSegments.length; index += 1) {
    if (normalizedSegments[index].startTime < normalizedSegments[index - 1].endTime) {
      throw new HttpError(400, 'Segments must not overlap', 'INVALID_SEGMENT_RANGE');
    }
  }

  const createdSegments = await sequelize.transaction(async (transaction) => {
    return LessonSegment.bulkCreate(normalizedSegments, { transaction });
  });

  return createdSegments.map((segment) => mapLessonSegment(segment));
};

const getLessonSegments = async (lessonId) => {
  const parsedLessonId = parseId(lessonId, 'lessonId');

  const segments = await LessonSegment.findAll({
    where: { lessonId: parsedLessonId },
    order: [['startTime', 'ASC']],
  });

  return segments.map((segment) => mapLessonSegment(segment));
};

const deleteLessonSegment = async (segmentId, currentUser) => {
  if (!currentUser?.id) {
    throw new HttpError(401, 'Unauthorized', 'UNAUTHORIZED');
  }

  const parsedSegmentId = parseId(segmentId, 'segmentId');
  const segment = await LessonSegment.findByPk(parsedSegmentId, {
    include: [
      {
        association: 'lesson',
        include: [{ association: 'course', attributes: ['id', 'instructorId'] }],
      },
    ],
  });

  if (!segment) {
    throw new HttpError(404, 'Segment not found', 'SEGMENT_NOT_FOUND');
  }

  if (segment.lesson?.course?.instructorId !== currentUser.id) {
    throw new HttpError(403, 'You are not the instructor', 'FORBIDDEN');
  }

  await segment.destroy();
  return { id: parsedSegmentId, deleted: true };
};

module.exports = {
  getLessonsByCourse,
  getLessonDetail,
  createLesson,
  updateLesson,
  deleteLesson,
  createLessonSegment,
  updateLessonSegment,
  createLessonSegmentsBulk,
  getLessonSegments,
  deleteLessonSegment,
};