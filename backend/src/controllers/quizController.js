const quizService = require('../services/quizService');
const { successResponse } = require('../utils/response');

/**
 * Get all quizzes for a course
 */
const getQuizzesByCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { includeQuestions } = req.query;

    const quizzes = await quizService.getQuizzesByCourse(
      courseId,
      includeQuestions === 'true',
    );

    return successResponse(res, 'Quizzes retrieved', quizzes, 200);
  } catch (error) {
    return next(error);
  }
};

/**
 * Get quiz detail with all questions
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
 * Get student quiz attempts
 */
const getStudentQuizAttempts = async (req, res, next) => {
  try {
    const { quizId } = req.params;
    const { id: studentId } = req.user;

    const attempts = await quizService.getStudentQuizAttempts(quizId, studentId);

    return successResponse(res, 'Quiz attempts retrieved', attempts, 200);
  } catch (error) {
    return next(error);
  }
};

/**
 * Get latest quiz attempt
 */
const getLatestQuizAttempt = async (req, res, next) => {
  try {
    const { quizId } = req.params;
    const { id: studentId } = req.user;

    const attempt = await quizService.getLatestQuizAttempt(quizId, studentId);

    return successResponse(
      res,
      'Latest quiz attempt retrieved',
      attempt || {},
      200,
    );
  } catch (error) {
    return next(error);
  }
};

/**
 * Start quiz attempt
 */
const startQuizAttempt = async (req, res, next) => {
  try {
    const { quizId } = req.params;
    const { id: studentId } = req.user;

    const attempt = await quizService.startQuizAttempt(quizId, studentId);

    return successResponse(res, 'Quiz attempt started', attempt, 201);
  } catch (error) {
    return next(error);
  }
};

/**
 * Save quiz answer (auto-save)
 */
const saveQuizAnswer = async (req, res, next) => {
  try {
    const { quizId } = req.params;
    const { questionId, selectedIndex } = req.body;
    const { id: studentId } = req.user;

    const result = await quizService.saveQuizAnswer(
      quizId,
      studentId,
      questionId,
      selectedIndex,
    );

    return successResponse(res, 'Answer saved', result, 200);
  } catch (error) {
    return next(error);
  }
};

/**
 * Submit quiz
 */
const submitQuiz = async (req, res, next) => {
  try {
    const { quizId } = req.params;
    const { answers } = req.body;
    const { id: studentId } = req.user;

    const attempt = await quizService.submitQuiz(quizId, studentId, answers || {});

    return successResponse(res, 'Quiz submitted', attempt, 200);
  } catch (error) {
    return next(error);
  }
};

/**
 * Get quiz score (best attempt)
 */
const getQuizScore = async (req, res, next) => {
  try {
    const { quizId } = req.params;
    const { id: studentId } = req.user;

    const result = await quizService.getQuizScore(quizId, studentId);

    return successResponse(
      res,
      'Quiz score retrieved',
      result || { totalScore: null, isPassed: null },
      200,
    );
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getQuizzesByCourse,
  getQuizDetail,
  getStudentQuizAttempts,
  getLatestQuizAttempt,
  startQuizAttempt,
  saveQuizAnswer,
  submitQuiz,
  getQuizScore,
};
