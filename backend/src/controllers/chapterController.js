const chapterService = require('../services/chapterService');
const { successResponse } = require('../utils/response');
const { Course } = require('../models');

/**
 * Create chapter for course
 */
const createChapter = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const payload = req.body;
    const chapter = await chapterService.createChapter(courseId, payload, req.user);

    // Đưa khóa học về chờ duyệt
    await Course.update({
      approvalStatus: 'PENDING',
      status: 'pending',
      isPublished: false
    }, { where: { id: courseId } });

    return successResponse(res, 'Chapter created', chapter, 201);
  } catch (error) {
    return next(error);
  }
};

/**
 * Get chapters by course
 */
const getChapters = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const chapters = await chapterService.getChaptersByCourse(courseId, req.user);

    return successResponse(res, 'Chapters retrieved', chapters, 200);
  } catch (error) {
    return next(error);
  }
};

/**
 * Get chapter detail
 */
const getChapterDetail = async (req, res, next) => {
  try {
    const { chapterId } = req.params;
    const chapter = await chapterService.getChapterDetail(chapterId, req.user);

    return successResponse(res, 'Chapter detail retrieved', chapter, 200);
  } catch (error) {
    return next(error);
  }
};

/**
 * Update chapter
 */
const updateChapter = async (req, res, next) => {
  try {
    const { chapterId } = req.params;
    const payload = req.body;
    const chapter = await chapterService.updateChapter(chapterId, payload, req.user);

    // Đưa khóa học về chờ duyệt
    if (chapter && chapter.courseId) {
      await Course.update({
        approvalStatus: 'PENDING',
        status: 'pending',
        isPublished: false
      }, { where: { id: chapter.courseId } });
    }

    return successResponse(res, 'Chapter updated', chapter, 200);
  } catch (error) {
    return next(error);
  }
};

/**
 * Delete chapter
 */
const deleteChapter = async (req, res, next) => {
  try {
    const { chapterId } = req.params;
    const result = await chapterService.deleteChapter(chapterId, req.user);

    return successResponse(res, 'Chapter deleted', result, 200);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createChapter,
  getChapters,
  getChapterDetail,
  updateChapter,
  deleteChapter,
};
