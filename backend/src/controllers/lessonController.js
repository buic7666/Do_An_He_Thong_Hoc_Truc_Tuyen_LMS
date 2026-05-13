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

const updateLesson = async (req, res, next) => {
  try {
    const result = await lessonService.updateLesson(req.params.id, req.body, req.user);
    return successResponse(res, 'Lesson updated successfully', result, 200);
  } catch (error) {
    return next(error);
  }
};

const deleteLesson = async (req, res, next) => {
  try {
    const result = await lessonService.deleteLesson(req.params.id, req.user);
    return successResponse(res, 'Lesson deleted successfully', result, 200);
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

const updateLessonSegment = async (req, res, next) => {
  try {
    const result = await lessonService.updateLessonSegment(req.params.segmentId, req.body, req.user);
    return successResponse(res, 'Segment updated', result, 200);
  } catch (error) {
    return next(error);
  }
};

const createLessonSegmentsBulk = async (req, res, next) => {
  try {
    const result = await lessonService.createLessonSegmentsBulk(req.params.id, req.body, req.user);
    return successResponse(res, 'Segments created', result, 201);
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

const getLessonLabels = async (req, res, next) => {
  try {
    const result = await lessonService.getLessonLabels(req.params.id, req.user);
    return successResponse(res, 'Lesson labels retrieved', result, 200);
  } catch (error) {
    return next(error);
  }
};

const createLessonLabel = async (req, res, next) => {
  try {
    const result = await lessonService.createLessonLabel(req.params.id, req.body, req.user);
    return successResponse(res, 'Lesson label created', result, 201);
  } catch (error) {
    return next(error);
  }
};

const updateLessonLabel = async (req, res, next) => {
  try {
    const result = await lessonService.updateLessonLabel(req.params.labelId, req.body, req.user);
    return successResponse(res, 'Lesson label updated', result, 200);
  } catch (error) {
    return next(error);
  }
};

const deleteLessonLabel = async (req, res, next) => {
  try {
    const result = await lessonService.deleteLessonLabel(req.params.labelId, req.user);
    return successResponse(res, 'Lesson label deleted', result, 200);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getLessonsByCourse,
  getLessonDetail,
  createLesson,
  updateLesson,
  deleteLesson,
  getLessonSegments,
  createLessonSegment,
  updateLessonSegment,
  createLessonSegmentsBulk,
  deleteLessonSegment,
  getLessonLabels,
  createLessonLabel,
  updateLessonLabel,
  deleteLessonLabel,
};