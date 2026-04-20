const teacherInteractionService = require('../services/teacherInteractionService');
const { successResponse } = require('../utils/response');

const getInteractions = async (req, res, next) => {
  try {
    const result = await teacherInteractionService.getInteractions(req.user);
    return successResponse(res, 'Teacher interactions retrieved', result, 200);
  } catch (error) {
    return next(error);
  }
};

const replyInteraction = async (req, res, next) => {
  try {
    const result = await teacherInteractionService.replyInteraction(req.params.id, req.body, req.user);
    return successResponse(res, 'Reply sent', result, 200);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getInteractions,
  replyInteraction,
};
