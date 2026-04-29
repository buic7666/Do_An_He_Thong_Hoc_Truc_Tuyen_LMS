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

const getLessonSegments = async (req, res, next) => {
  try {
    const result = await lessonService.getLessonSegments(req.params.id);
    return successResponse(res, 'Segments retrieved', result, 200);
  } catch (error) {
    return next(error);
  }
};

const createLessonSegment = async (req, res, next) => {
  try {
    const result = await lessonService.createLessonSegment(req.params.id, req.body, req.user);
    return successResponse(res, 'Segment created', result, 201);
  } catch (error) {
    return next(error);
  }
};

const deleteLessonSegment = async (req, res, next) => {
  try {
    const result = await lessonService.deleteLessonSegment(req.params.segmentId, req.user);
    return successResponse(res, 'Segment deleted', result, 200);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getLessonsByCourse,
  getLessonDetail,
  createLesson,
  getLessonSegments,
  createLessonSegment,
  deleteLessonSegment,
};