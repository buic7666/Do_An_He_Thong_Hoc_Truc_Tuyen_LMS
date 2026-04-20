const lessonWatchPositionService = require('../services/lessonWatchPositionService');
const { successResponse } = require('../utils/response');

const getWatchPosition = async (req, res, next) => {
  try {
    const result = await lessonWatchPositionService.getWatchPosition(req.params.id, req.user);
    return successResponse(res, 'Lesson watch position retrieved', result, 200);
  } catch (error) {
    return next(error);
  }
};

const saveWatchPosition = async (req, res, next) => {
  try {
    const result = await lessonWatchPositionService.saveWatchPosition(req.params.id, req.body, req.user);
    return successResponse(res, 'Lesson watch position saved', result, 200);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getWatchPosition,
  saveWatchPosition,
};