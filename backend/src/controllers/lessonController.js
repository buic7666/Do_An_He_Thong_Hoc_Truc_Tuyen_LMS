const lessonService = require('../services/lessonService');
const { successResponse } = require('../utils/response');

const getLessonsByCourse = async (req, res, next) => {
  try {
    const result = await lessonService.getLessonsByCourse(req.params.courseId);
    return successResponse(res, 'Lessons retrieved', result, 200);
  } catch (error) {
    return next(error);
  }
};

const getLessonDetail = async (req, res, next) => {
  try {
    const result = await lessonService.getLessonDetail(req.params.id, req.user);
    return successResponse(res, 'Lesson detail retrieved', result, 200);
  } catch (error) {
    return next(error);
  }
};

const createLesson = async (req, res, next) => {
  try {
    const result = await lessonService.createLesson(req.params.courseId, req.body, req.user);
    return successResponse(res, 'Lesson created successfully', result, 201);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getLessonsByCourse,
  getLessonDetail,
  createLesson,
};