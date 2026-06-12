const { Chapter, Course, Lesson } = require('../models');
const { HttpError } = require('../utils/httpError');

/**
 * Create chapter for a course
 */
const createChapter = async (courseId, payload, user) => {
  // Verify course exists and user is instructor
  const course = await Course.findOne({ where: { id: courseId } });
  if (!course) {
    throw new HttpError(404, 'Course not found', 'COURSE_NOT_FOUND');
  }

  if (course.instructorId !== user.id) {
    throw new HttpError(403, 'You are not the instructor of this course', 'FORBIDDEN');
  }

  const chapter = await Chapter.create({
    courseId,
    title: payload.title,
    description: payload.description || null,
    orderIndex: payload.orderIndex || 0,
  });

  return chapter;
};

/**
 * Get chapters for a course
 */
const getChaptersByCourse = async (courseId, user) => {
  const course = await Course.findOne({ where: { id: courseId } });
  if (!course) {
    throw new HttpError(404, 'Course not found', 'COURSE_NOT_FOUND');
  }

  const chapters = await Chapter.findAll({
    where: { courseId },
    include: [
      {
        association: 'lessons',
        attributes: ['id', 'title', 'orderIndex'],
      },
    ],
    order: [['orderIndex', 'ASC']],
  });

  return chapters;
};

/**
 * Get chapter detail with lessons
 */
const getChapterDetail = async (chapterId, user) => {
  const chapter = await Chapter.findOne({
    where: { id: chapterId },
    include: [
      {
        association: 'course',
        attributes: ['id', 'title', 'instructorId'],
      },
      {
        association: 'lessons',
        attributes: ['id', 'title', 'orderIndex', 'videoUrl'],
      },
    ],
  });

  if (!chapter) {
    throw new HttpError(404, 'Chapter not found', 'CHAPTER_NOT_FOUND');
  }

  return chapter;
};

/**
 * Update chapter
 */
const updateChapter = async (chapterId, payload, user) => {
  const chapter = await Chapter.findOne({
    where: { id: chapterId },
    include: [{ association: 'course' }],
  });

  if (!chapter) {
    throw new HttpError(404, 'Chapter not found', 'CHAPTER_NOT_FOUND');
  }

  if (chapter.course.instructorId !== user.id) {
    throw new HttpError(403, 'You are not the instructor', 'FORBIDDEN');
  }

  chapter.title = payload.title ?? chapter.title;
  chapter.description = payload.description ?? chapter.description;
  chapter.orderIndex = payload.orderIndex ?? chapter.orderIndex;

  await chapter.save();

  return chapter;
};

/**
 * Delete chapter
 */
const deleteChapter = async (chapterId, user) => {
  const chapter = await Chapter.findOne({
    where: { id: chapterId },
    include: [{ association: 'course' }],
  });

  if (!chapter) {
    throw new HttpError(404, 'Chapter not found', 'CHAPTER_NOT_FOUND');
  }

  if (chapter.course.instructorId !== user.id) {
    throw new HttpError(403, 'You are not the instructor', 'FORBIDDEN');
  }

  await chapter.destroy();

  return { id: chapterId, deleted: true };
};

module.exports = {
  createChapter,
  getChaptersByCourse,
  getChapterDetail,
  updateChapter,
  deleteChapter,
};
