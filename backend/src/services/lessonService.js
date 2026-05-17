const lessonRepository = require('../repositories/lessonRepository');
const enrollmentRepository = require('../repositories/enrollmentRepository');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');
const { Lesson, LessonSegment, LessonLabel } = require('../models');
const { HttpError } = require('../utils/httpError');

const SEGMENT_ITEM_TYPES = new Set(['text', 'document', 'question', 'quiz', 'videoClip']);

const parseId = (value, fieldName) => {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, `${fieldName} must be a positive integer`, 'VALIDATION_ERROR');
  }

  return id;
};

const mapLessonSegment = (segment) => {
  const plain = segment.toJSON ? segment.toJSON() : segment;
  const contentItems = coerceSegmentContentItems(plain.contentItems);

  return {
    id: plain.id,
    lessonId: plain.lessonId,
    startTime: plain.startTime,  // Now nullable - times managed at content item level
    endTime: plain.endTime,      // Now nullable - times managed at content item level
    duration: plain.duration,    // Now nullable
    title: plain.title,
    orderIndex: Number(plain.orderIndex || 1),
    contentItems: normalizeSegmentContentItems(contentItems),
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

const coerceSegmentContentItems = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (value == null) {
    return [];
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      if (parsed && typeof parsed === 'object' && parsed.type) {
        return [parsed];
      }
    } catch (_error) {
      return [];
    }
  }

  if (typeof value === 'object') {
    if (Array.isArray(value.items)) {
      return value.items;
    }

    if (value.type) {
      return [value];
    }

    return Object.values(value).filter((item) => item && typeof item === 'object');
  }

  return [];
};

const assertSegmentRange = (startTime, endTime) => {
  if (!Number.isInteger(startTime) || !Number.isInteger(endTime)) {
    throw new HttpError(400, 'Segment times must be integers', 'INVALID_SEGMENT_RANGE');
  }

  if (startTime < 0 || endTime <= startTime) {
    throw new HttpError(400, 'endTime must be greater than startTime', 'INVALID_SEGMENT_RANGE');
  }
};

const normalizeSegmentContentItems = (items = []) => {
  const normalizedInput = coerceSegmentContentItems(items);

  const toNullableInteger = (value) => {
    if (value == null || value === '') {
      return null;
    }

    const numericValue = Number(value);
    return Number.isInteger(numericValue) ? numericValue : null;
  };

  return normalizedInput
    .map((item, index) => {
      const type = String(item?.type || '').trim();

      if (!SEGMENT_ITEM_TYPES.has(type)) {
        throw new HttpError(400, `Invalid content item type at index ${index}`, 'INVALID_SEGMENT_CONTENT_ITEMS');
      }

      const payload = {
        type,
        title: item?.title ? String(item.title).trim() : null,
        content: item?.content ? String(item.content).trim() : null,
        resourceUrl: item?.resourceUrl ? String(item.resourceUrl).trim() : null,
        startTime: toNullableInteger(item?.startTime),
        endTime: toNullableInteger(item?.endTime),
        orderIndex: Number.isInteger(Number(item?.orderIndex)) && Number(item.orderIndex) > 0
          ? Number(item.orderIndex)
          : index + 1,
      };

      if (payload.type === 'videoClip') {
        const hasStart = Number.isInteger(payload.startTime);
        const hasEnd = Number.isInteger(payload.endTime);

        if (!hasStart && !hasEnd) {
          payload.startTime = null;
          payload.endTime = null;
        } else if (!hasStart || !hasEnd || payload.endTime <= payload.startTime) {
          throw new HttpError(400, 'videoClip requires valid startTime/endTime', 'INVALID_SEGMENT_CONTENT_ITEMS');
        }
      }

      return payload;
    })
    .sort((left, right) => left.orderIndex - right.orderIndex)
    .map((item, index) => ({
      ...item,
      orderIndex: index + 1,
    }));
};

const ensureSegmentOwnership = async (segmentId, currentUser) => {
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

  return segment;
};

const mapLessonLabel = (label) => {
  const plain = label.toJSON ? label.toJSON() : label;
  return {
    id: plain.id,
    lessonId: plain.lessonId,
    teacherId: plain.teacherId,
    content: plain.content,
    labelType: plain.labelType || 'note',
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
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
        attributes: ['id', 'startTime', 'endTime', 'duration', 'title', 'orderIndex', 'contentItems'],
        order: [['orderIndex', 'ASC'], ['startTime', 'ASC']],
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
          orderIndex: Number(segment.orderIndex || 1),
          contentItems: normalizeSegmentContentItems(segment.contentItems || []),
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

  const maxOrderIndex = Number(
    (await LessonSegment.max('orderIndex', {
      where: { lessonId: parsedLessonId },
    })) || 0,
  );

  const requestedOrderIndex = Number(payload.orderIndex || maxOrderIndex + 1);
  const orderIndex = Number.isInteger(requestedOrderIndex) && requestedOrderIndex > 0
    ? Math.min(requestedOrderIndex, maxOrderIndex + 1)
    : maxOrderIndex + 1;

  const normalizedItems = normalizeSegmentContentItems(payload.contentItems || []);

  const created = await sequelize.transaction(async (transaction) => {
    if (orderIndex <= maxOrderIndex) {
      await LessonSegment.increment(
        { orderIndex: 1 },
        {
          where: {
            lessonId: parsedLessonId,
            orderIndex: { [Op.gte]: orderIndex },
          },
          transaction,
        },
      );
    }

    return LessonSegment.create({
      lessonId: parsedLessonId,
      title: payload.title?.trim() || null,
      orderIndex,
      contentItems: normalizedItems,
      // startTime, endTime, duration are now managed at content item level (videoClip)
    }, { transaction });
  });

  return mapLessonSegment(created);
};

const updateLessonSegment = async (segmentId, payload, currentUser) => {
  if (!currentUser?.id) {
    throw new HttpError(401, 'Unauthorized', 'UNAUTHORIZED');
  }

  const segment = await ensureSegmentOwnership(segmentId, currentUser);

  if (Object.prototype.hasOwnProperty.call(payload, 'contentItems')) {
    segment.contentItems = normalizeSegmentContentItems(payload.contentItems || []);
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'title')) {
    segment.title = payload.title?.trim() || null;
  }

  // Note: startTime, endTime are now managed at content item level (videoClip items)
  if (Object.prototype.hasOwnProperty.call(payload, 'orderIndex')) {
    const requestedOrderIndex = Number(payload.orderIndex);
    if (!Number.isInteger(requestedOrderIndex) || requestedOrderIndex <= 0) {
      throw new HttpError(400, 'orderIndex must be a positive integer', 'INVALID_SEGMENT_ORDER');
    }

    const lessonId = segment.lessonId;

    await sequelize.transaction(async (transaction) => {
      const maxOrderIndex = Number(
        (await LessonSegment.max('orderIndex', {
          where: { lessonId },
          transaction,
        })) || 0,
      );

      const oldOrderIndex = Number(segment.orderIndex || 1);
      const targetOrderIndex = Math.max(1, Math.min(requestedOrderIndex, maxOrderIndex));

      if (targetOrderIndex !== oldOrderIndex) {
        if (targetOrderIndex > oldOrderIndex) {
          await LessonSegment.increment(
            { orderIndex: -1 },
            {
              where: {
                lessonId,
                id: { [Op.ne]: segment.id },
                orderIndex: {
                  [Op.gt]: oldOrderIndex,
                  [Op.lte]: targetOrderIndex,
                },
              },
              transaction,
            },
          );
        } else {
          await LessonSegment.increment(
            { orderIndex: 1 },
            {
              where: {
                lessonId,
                id: { [Op.ne]: segment.id },
                orderIndex: {
                  [Op.gte]: targetOrderIndex,
                  [Op.lt]: oldOrderIndex,
                },
              },
              transaction,
            },
          );
        }

        segment.orderIndex = targetOrderIndex;
      }

      await segment.save({ transaction });
    });

    await segment.reload();
    return mapLessonSegment(segment);
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
      return {
        lessonId: parsedLessonId,
        orderIndex: index + 1,
        title: segment.title?.trim() || `Segment ${index + 1}`,
        contentItems: normalizeSegmentContentItems(segment.contentItems || []),
        // startTime, endTime, duration are now managed at content item level (videoClip)
      };
    });

  const createdSegments = await sequelize.transaction(async (transaction) => {
    return LessonSegment.bulkCreate(normalizedSegments, { transaction });
  });

  return createdSegments.map((segment) => mapLessonSegment(segment));
};

const getLessonSegments = async (lessonId) => {
  const parsedLessonId = parseId(lessonId, 'lessonId');

  const segments = await LessonSegment.findAll({
    where: { lessonId: parsedLessonId },
    order: [['orderIndex', 'ASC']],
  });

  return segments.map((segment) => mapLessonSegment(segment));
};

const getLessonSegmentById = async (lessonId, segmentId) => {
  const parsedLessonId = parseId(lessonId, 'lessonId');
  const parsedSegmentId = parseId(segmentId, 'segmentId');

  const segment = await LessonSegment.findOne({
    where: { id: parsedSegmentId, lessonId: parsedLessonId },
  });

  if (!segment) {
    throw new HttpError(404, 'Segment not found', 'SEGMENT_NOT_FOUND');
  }

  return mapLessonSegment(segment);
};

const deleteLessonSegment = async (segmentId, currentUser) => {
  if (!currentUser?.id) {
    throw new HttpError(401, 'Unauthorized', 'UNAUTHORIZED');
  }

  const segment = await ensureSegmentOwnership(segmentId, currentUser);
  const parsedSegmentId = Number(segment.id);
  const oldOrderIndex = Number(segment.orderIndex || 1);

  await sequelize.transaction(async (transaction) => {
    await segment.destroy({ transaction });
    await LessonSegment.increment(
      { orderIndex: -1 },
      {
        where: {
          lessonId: segment.lessonId,
          orderIndex: { [Op.gt]: oldOrderIndex },
        },
        transaction,
      },
    );
  });

  return { id: parsedSegmentId, deleted: true };
};

const reorderLessonSegments = async (lessonId, payload, currentUser) => {
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

  const segmentIds = Array.isArray(payload.segmentIds)
    ? payload.segmentIds.map((id) => parseId(id, 'segmentId'))
    : [];

  if (!segmentIds.length) {
    throw new HttpError(400, 'segmentIds must be a non-empty array', 'INVALID_SEGMENT_ORDER');
  }

  const segments = await LessonSegment.findAll({
    where: { lessonId: parsedLessonId },
    attributes: ['id'],
  });

  if (segments.length !== segmentIds.length) {
    throw new HttpError(400, 'segmentIds must contain all lesson segments exactly once', 'INVALID_SEGMENT_ORDER');
  }

  const existingIdSet = new Set(segments.map((segment) => Number(segment.id)));
  const payloadIdSet = new Set(segmentIds);

  if (existingIdSet.size !== payloadIdSet.size) {
    throw new HttpError(400, 'segmentIds contains duplicates', 'INVALID_SEGMENT_ORDER');
  }

  for (const id of payloadIdSet) {
    if (!existingIdSet.has(id)) {
      throw new HttpError(400, 'segmentIds contains invalid segment', 'INVALID_SEGMENT_ORDER');
    }
  }

  await sequelize.transaction(async (transaction) => {
    for (let index = 0; index < segmentIds.length; index += 1) {
      await LessonSegment.update(
        { orderIndex: index + 1 },
        {
          where: { id: segmentIds[index], lessonId: parsedLessonId },
          transaction,
        },
      );
    }
  });

  return getLessonSegments(parsedLessonId);
};

const getLessonLabels = async (lessonId, currentUser) => {
  const parsedLessonId = parseId(lessonId, 'lessonId');
  const lesson = await Lesson.findByPk(parsedLessonId, {
    include: [{ association: 'course', attributes: ['id', 'instructorId'] }],
  });

  if (!lesson) {
    throw new HttpError(404, 'Lesson not found', 'LESSON_NOT_FOUND');
  }

  if (currentUser?.role === 'teacher' && lesson.course?.instructorId !== currentUser.id) {
    throw new HttpError(403, 'You are not the instructor', 'FORBIDDEN');
  }

  const labels = await LessonLabel.findAll({
    where: { lessonId: parsedLessonId },
    order: [['createdAt', 'DESC']],
  });

  return labels.map((item) => mapLessonLabel(item));
};

const createLessonLabel = async (lessonId, payload, currentUser) => {
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

  if (currentUser.role !== 'admin' && lesson.course?.instructorId !== currentUser.id) {
    throw new HttpError(403, 'You are not the instructor', 'FORBIDDEN');
  }

  const created = await LessonLabel.create({
    lessonId: parsedLessonId,
    teacherId: currentUser.id,
    content: payload.content.trim(),
    labelType: payload.labelType || 'note',
  });

  return mapLessonLabel(created);
};

const updateLessonLabel = async (labelId, payload, currentUser) => {
  if (!currentUser?.id) {
    throw new HttpError(401, 'Unauthorized', 'UNAUTHORIZED');
  }

  const parsedLabelId = parseId(labelId, 'labelId');
  const label = await LessonLabel.findByPk(parsedLabelId, {
    include: [
      {
        association: 'lesson',
        include: [{ association: 'course', attributes: ['id', 'instructorId'] }],
      },
    ],
  });

  if (!label) {
    throw new HttpError(404, 'Lesson label not found', 'LESSON_LABEL_NOT_FOUND');
  }

  if (currentUser.role !== 'admin' && label.lesson?.course?.instructorId !== currentUser.id) {
    throw new HttpError(403, 'You are not the instructor', 'FORBIDDEN');
  }

  label.content = payload.content.trim();
  label.labelType = payload.labelType || label.labelType || 'note';
  await label.save();
  return mapLessonLabel(label);
};

const deleteLessonLabel = async (labelId, currentUser) => {
  if (!currentUser?.id) {
    throw new HttpError(401, 'Unauthorized', 'UNAUTHORIZED');
  }

  const parsedLabelId = parseId(labelId, 'labelId');
  const label = await LessonLabel.findByPk(parsedLabelId, {
    include: [
      {
        association: 'lesson',
        include: [{ association: 'course', attributes: ['id', 'instructorId'] }],
      },
    ],
  });

  if (!label) {
    throw new HttpError(404, 'Lesson label not found', 'LESSON_LABEL_NOT_FOUND');
  }

  if (currentUser.role !== 'admin' && label.lesson?.course?.instructorId !== currentUser.id) {
    throw new HttpError(403, 'You are not the instructor', 'FORBIDDEN');
  }

  await label.destroy();
  return { id: parsedLabelId, deleted: true };
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
  getLessonSegmentById,
  deleteLessonSegment,
  reorderLessonSegments,
  getLessonLabels,
  createLessonLabel,
  updateLessonLabel,
  deleteLessonLabel,
};