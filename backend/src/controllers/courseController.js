const courseService = require('../services/courseService');
const progressService = require('../services/progressService');
const { successResponse } = require('../utils/response');

const getAllCourses = async (_req, res, next) => {
  try {
    const result = await courseService.getAllCourses();
    return successResponse(res, 'Courses retrieved', result, 200);
  } catch (error) {
    return next(error);
  }
};

const getCourseDetail = async (req, res, next) => {
  try {
    const result = await courseService.getCourseDetail(req.params.id);
    return successResponse(res, 'Course detail retrieved', result, 200);
  } catch (error) {
    return next(error);
  }
};

const getLessonsByCourse = async (req, res, next) => {
  try {
    const result = await courseService.getLessonsByCourse(req.params.id);
    return successResponse(res, 'Lessons retrieved', result, 200);
  } catch (error) {
    return next(error);
  }
};

const getCourseProgress = async (req, res, next) => {
  try {
    const result = await progressService.getCourseProgress(req.params.courseId, req.user);
    return successResponse(res, 'Course progress retrieved', result, 200);
  } catch (error) {
    return next(error);
  }
};

const createCourse = async (req, res, next) => {
  try {
    const result = await courseService.createCourse(req.body, req.user);
    return successResponse(res, 'Course created successfully', result, 201);
  } catch (error) {
    return next(error);
  }
};
const updateCourse = async (req, res, next) => {
  try {
    const result = await courseService.updateCourse(req.params.id, req.body, req.user);
    return successResponse(res, 'Course updated successfully', result, 200);
  } catch (error) {
    return next(error);
  }
};
const deleteCourse = async (req, res, next) => {
  try {
    const result = await courseService.deleteCourse(req.params.id, req.user);
    return successResponse(res, 'Course deleted successfully', result, 200);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getAllCourses,
  getCourseDetail,
  getLessonsByCourse,
  getCourseProgress,
  createCourse,
  updateCourse,
  deleteCourse,
};