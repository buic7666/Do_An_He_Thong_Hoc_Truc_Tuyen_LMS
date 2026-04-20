const teacherProfileService = require('../services/teacherProfileService');
const { successResponse } = require('../utils/response');

const getProfile = async (req, res, next) => {
  try {
    const result = await teacherProfileService.getProfile(req.user);
    return successResponse(res, 'Teacher profile retrieved', result, 200);
  } catch (error) {
    return next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const result = await teacherProfileService.updateProfile(req.body, req.user);
    return successResponse(res, 'Teacher profile updated', result, 200);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
};
