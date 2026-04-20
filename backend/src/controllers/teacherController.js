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

module.exports = {
  getDashboardOverview,
};
