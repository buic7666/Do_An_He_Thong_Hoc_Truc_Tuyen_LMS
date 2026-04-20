const progressService = require('../services/progressService');
const { successResponse } = require('../utils/response');

const markLessonCompleted = async (req, res, next) => {
  try {
    const result = await progressService.markLessonCompleted(req.params.id, req.user);
    return successResponse(res, 'Lesson progress updated', result, 200);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  markLessonCompleted,
};
