const teacherQuestionService = require('../services/teacherQuestionService');
const { successResponse } = require('../utils/response');

const getQuestions = async (req, res, next) => {
  try {
    const result = await teacherQuestionService.getQuestions(req.user);
    return successResponse(res, 'Teacher questions retrieved', result, 200);
  } catch (error) {
    return next(error);
  }
};

const createQuestion = async (req, res, next) => {
  try {
    const result = await teacherQuestionService.createQuestion(req.body, req.user);
    return successResponse(res, 'Question created', result, 201);
  } catch (error) {
    return next(error);
  }
};

const updateQuestion = async (req, res, next) => {
  try {
    const result = await teacherQuestionService.updateQuestion(req.params.id, req.body, req.user);
    return successResponse(res, 'Question updated', result, 200);
  } catch (error) {
    return next(error);
  }
};

const deleteQuestion = async (req, res, next) => {
  try {
    const result = await teacherQuestionService.deleteQuestion(req.params.id, req.user);
    return successResponse(res, 'Question deleted', result, 200);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
};
