const quizService = require('../services/quizService');
const { successResponse } = require('../utils/response');

/**
 * POST /api/answers/:answerId/grade
 * Trigger grading for a single StudentAnswer (requires auth)
 */
const gradeAnswerNow = async (req, res, next) => {
  try {
    const { answerId } = req.params;
    const gradingProvider = req.body.gradingProvider || null;

    const result = await quizService.gradeStudentAnswer(answerId, gradingProvider);

    return successResponse(res, 'Answer graded', result, 200);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  gradeAnswerNow,
};
