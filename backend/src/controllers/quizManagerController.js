const quizService = require('../services/quizService');
const { successResponse } = require('../utils/response');

// ===== TEACHER ENDPOINTS =====

/**
 * Create quiz
 */
const createQuiz = async (req, res, next) => {
  try {
    const payload = req.body;
    const quiz = await quizService.createQuizByTeacher(payload, req.user);

    return successResponse(res, 'Quiz created', quiz, 201);
  } catch (error) {
    return next(error);
  }
};

/**
 * Get all quizzes created by teacher
 */
const getTeacherQuizzes = async (req, res, next) => {
  try {
    const quizzes = await quizService.getTeacherQuizzes(req.user);

    return successResponse(res, 'Quizzes retrieved', quizzes, 200);
  } catch (error) {
    return next(error);
  }
};

/**
 * Get quiz detail
 */
const getQuizDetail = async (req, res, next) => {
  try {
    const { quizId } = req.params;
    const quiz = await quizService.getQuizDetail(quizId);

    return successResponse(res, 'Quiz detail retrieved', quiz, 200);
  } catch (error) {
    return next(error);
  }
};

/**
 * Update quiz
 */
const updateQuiz = async (req, res, next) => {
  try {
    const { quizId } = req.params;
    const payload = req.body;
    const quiz = await quizService.updateQuizByTeacher(quizId, payload, req.user);

    return successResponse(res, 'Quiz updated', quiz, 200);
  } catch (error) {
    return next(error);
  }
};

/**
 * Publish quiz
 */
const publishQuiz = async (req, res, next) => {
  try {
    const { quizId } = req.params;
    const quiz = await quizService.publishQuizByTeacher(quizId, req.user);

    return successResponse(res, 'Quiz published', quiz, 200);
  } catch (error) {
    return next(error);
  }
};

/**
 * Delete quiz
 */
const deleteQuiz = async (req, res, next) => {
  try {
    const { quizId } = req.params;
    const result = await quizService.deleteQuizByTeacher(quizId, req.user);

    return successResponse(res, 'Quiz deleted', result, 200);
  } catch (error) {
    return next(error);
  }
};

/**
 * Add question to quiz
 */
const addQuestionToQuiz = async (req, res, next) => {
  try {
    const { quizId, questionId } = req.params;
    const payload = req.body;
    const result = await quizService.addQuestionToQuizByTeacher(quizId, questionId, payload, req.user);

    return successResponse(res, 'Question added to quiz', result, 201);
  } catch (error) {
    return next(error);
  }
};

/**
 * Remove question from quiz
 */
const removeQuestionFromQuiz = async (req, res, next) => {
  try {
    const { quizId, questionId } = req.params;
    const result = await quizService.removeQuestionFromQuizByTeacher(quizId, questionId, req.user);

    return successResponse(res, 'Question removed from quiz', result, 200);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createQuiz,
  getTeacherQuizzes,
  getQuizDetail,
  updateQuiz,
  publishQuiz,
  deleteQuiz,
  addQuestionToQuiz,
  removeQuestionFromQuiz,
};
