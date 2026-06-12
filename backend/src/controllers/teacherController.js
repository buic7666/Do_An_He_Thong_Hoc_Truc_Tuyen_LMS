const teacherService = require('../services/teacherService');
const { successResponse } = require('../utils/response');

const getDashboardOverview = async (req, res, next) => {
  try {
    const result = await teacherService.getDashboardOverview(req.user);
    return successResponse(res, 'Teacher dashboard retrieved', result, 200);
  } catch (error) {
    return next(error);
  }
};
const getMyCourseLessons = async (req, res, next) => {
  try {
    const result = await teacherService.getMyCourseLessons(req.params.courseId, req.user);
    return successResponse(res, 'Teacher course lessons retrieved', result, 200);
  } catch (error) {
    return next(error);
  }
};
const getMyCourses = async (req, res, next) => {
  try {
    const result = await teacherService.getMyCourses(req.user);
    return successResponse(res, 'Teacher courses retrieved', result, 200);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getDashboardOverview,
  getMyCourses,
  getMyCourseLessons,
};