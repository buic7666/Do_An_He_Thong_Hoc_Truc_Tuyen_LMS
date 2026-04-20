const adminService = require('../services/adminService');
const { successResponse } = require('../utils/response');

const getDashboardOverview = async (req, res, next) => {
  try {
    const result = await adminService.getDashboardOverview(req.user);
    return successResponse(res, 'Admin dashboard retrieved', result, 200);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getDashboardOverview,
};
