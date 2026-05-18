const reviewService = require('../services/reviewService');
const { successResponse } = require('../utils/response');

const createReview = async (req, res, next) => {
  try {
    const result = await reviewService.createReview(req.body, req.user);
    return successResponse(res, 'Review created', result, 201);
  } catch (error) {
    return next(error);
  }
};

const getReviewsByCourse = async (req, res, next) => {
  try {
    const result = await reviewService.fetchReviewsByCourse(req.params.courseId);
    return successResponse(res, 'Reviews retrieved', result, 200);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createReview,
  getReviewsByCourse,
};
