const { Question, User } = require('../models');
const { HttpError } = require('../utils/httpError');

/**
 * Get all questions created by a user (question bank)
 */
const getQuestionsByCreator = async (creatorId, filters = {}) => {
  const where = { createdBy: creatorId };

  if (filters.difficulty) {
    where.difficulty = filters.difficulty;
  }

  const questions = await Question.findAll({
    where,
    include: [
      {
        association: 'creator',
        attributes: ['id', 'name', 'email'],
      },
    ],
    order: [['createdAt', 'DESC']],
  });

  return questions.map(normalizeQuestion);
};

/**
 * Get single question by ID
 */
const getQuestionById = async (questionId) => {
  const question = await Question.findOne({
    where: { id: questionId },
    include: [
      {
        association: 'creator',
        attributes: ['id', 'name'],
      },
    ],
  });

  if (!question) {
    throw new HttpError(404, 'Question not found', 'QUESTION_NOT_FOUND');
  }

  return normalizeQuestion(question);
};

/**
 * Create new question
 */
const createQuestion = async (payload, creatorId) => {
  const question = await Question.create({
    questionText: payload.questionText,
    optionsJson: JSON.stringify(payload.options || []),
    correctIndex: Number(payload.correctIndex || 0),
    explanation: payload.explanation,
    difficulty: payload.difficulty || 'medium',
    createdBy: creatorId,
  });

  return normalizeQuestion(question);
};

/**
 * Update question
 */
const updateQuestion = async (questionId, payload, creatorId) => {
  const question = await Question.findOne({
    where: { id: questionId, createdBy: creatorId },
  });

  if (!question) {
    throw new HttpError(
      403,
      'Question not found or you do not have permission',
      'FORBIDDEN',
    );
  }

  question.questionText = payload.questionText ?? question.questionText;
  question.optionsJson = payload.options
    ? JSON.stringify(payload.options)
    : question.optionsJson;
  question.correctIndex =
    payload.correctIndex != null
      ? Number(payload.correctIndex)
      : question.correctIndex;
  question.explanation = payload.explanation ?? question.explanation;
  question.difficulty = payload.difficulty ?? question.difficulty;

  await question.save();

  return normalizeQuestion(question);
};

/**
 * Delete question
 */
const deleteQuestion = async (questionId, creatorId) => {
  const question = await Question.findOne({
    where: { id: questionId, createdBy: creatorId },
  });

  if (!question) {
    throw new HttpError(
      403,
      'Question not found or you do not have permission',
      'FORBIDDEN',
    );
  }

  await question.destroy();

  return {
    id: questionId,
    deleted: true,
  };
};

/**
 * Get questions by difficulty
 */
const getQuestionsByDifficulty = async (creatorId, difficulty) => {
  const questions = await Question.findAll({
    where: { createdBy: creatorId, difficulty },
    order: [['createdAt', 'DESC']],
  });

  return questions.map(normalizeQuestion);
};

/**
 * Search questions
 */
const searchQuestions = async (creatorId, searchText) => {
  const { Op } = require('sequelize');

  const questions = await Question.findAll({
    where: {
      createdBy: creatorId,
      questionText: {
        [Op.like]: `%${searchText}%`,
      },
    },
    order: [['createdAt', 'DESC']],
  });

  return questions.map(normalizeQuestion);
};

/**
 * Normalize question data
 */
const normalizeQuestion = (question) => {
  const plain = question.toJSON();

  return {
    id: plain.id,
    questionText: plain.questionText,
    options: JSON.parse(plain.optionsJson || '[]'),
    correctIndex: plain.correctIndex,
    explanation: plain.explanation,
    difficulty: plain.difficulty,
    creator: plain.creator
      ? {
          id: plain.creator.id,
          name: plain.creator.name,
        }
      : null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

module.exports = {
  getQuestionsByCreator,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getQuestionsByDifficulty,
  searchQuestions,
};
