const enrollmentService = require('../services/enrollmentService');
const { successResponse } = require('../utils/response');

const enrollCourse = async (req, res, next) => {
  try {
    const result = await enrollmentService.enrollCourse(req.body, req.user);
    return successResponse(res, 'Enrolled successfully', result, 201);
  } catch (error) {
    return next(error);
  }
};

const getMyEnrollments = async (req, res, next) => {
  try {
    const result = await enrollmentService.getMyEnrollments(req.user);
    return successResponse(res, 'Enrollments retrieved', result, 200);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  enrollCourse,
  getMyEnrollments,
};