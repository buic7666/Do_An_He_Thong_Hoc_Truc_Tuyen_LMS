const questionService = require('../services/questionService');
const { successResponse } = require('../utils/response');

/**
 * Get all questions (question bank) created by user
 */
const getQuestions = async (req, res, next) => {
  try {
    const { difficulty, search } = req.query;
    const { id: creatorId } = req.user;

    let questions;

    if (search) {
      questions = await questionService.searchQuestions(creatorId, search);
    } else if (difficulty) {
      questions = await questionService.getQuestionsByDifficulty(
        creatorId,
        difficulty,
      );
    } else {
      questions = await questionService.getQuestionsByCreator(creatorId);
    }

    return successResponse(res, 'Questions retrieved', questions, 200);
  } catch (error) {
    return next(error);
  }
};

/**
 * Get questions by lecture/lesson
 */
const getQuestionsByLecture = async (req, res, next) => {
  try {
    const { lectureId } = req.params;
    const questions = await questionService.getQuestionsByLecture(lectureId);

    return successResponse(res, 'Lecture questions retrieved', questions, 200);
  } catch (error) {
    return next(error);
  }
};

/**
 * Get single question detail
 */
const getQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;

    const question = await questionService.getQuestionById(id);

    return successResponse(res, 'Question retrieved', question, 200);
  } catch (error) {
    return next(error);
  }
};

/**
 * Create new question
 */
const createQuestion = async (req, res, next) => {
  try {
    const payload = req.body;
    const { id: creatorId } = req.user;

    const question = await questionService.createQuestion(payload, creatorId);

    return successResponse(res, 'Question created', question, 201);
  } catch (error) {
    return next(error);
  }
};

/**
 * Update question
 */
const updateQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payload = req.body;
    const { id: creatorId } = req.user;

    const question = await questionService.updateQuestion(
      id,
      payload,
      creatorId,
    );

    return successResponse(res, 'Question updated', question, 200);
  } catch (error) {
    return next(error);
  }
};

/**
 * Delete question
 */
const deleteQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { id: creatorId } = req.user;

    const result = await questionService.deleteQuestion(id, creatorId);

    return successResponse(res, 'Question deleted', result, 200);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getQuestions,
  getQuestionsByLecture,
  getQuestion,
  createQuestion,
  updateQuestion,
  deleteQuestion,
};
