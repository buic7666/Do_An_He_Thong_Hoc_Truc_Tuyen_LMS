const { Question, User, Lesson } = require('../models');
const { HttpError } = require('../utils/httpError');

const DIFFICULTY_MAP = {
  easy: 'EASY',
  medium: 'MEDIUM',
  hard: 'HARD',
};

const mapDifficultyToDb = (value) => {
  if (!value) {
    return 'MEDIUM';
  }
  const normalized = String(value).toLowerCase();
  return DIFFICULTY_MAP[normalized] || 'MEDIUM';
};

const mapDifficultyFromDb = (value) => {
  if (!value) {
    return 'medium';
  }
  return String(value).toLowerCase();
};

const parseMetadata = (metadata) => {
  if (!metadata) {
    return {};
  }

  if (typeof metadata === 'string') {
    try {
      return JSON.parse(metadata);
    } catch (_error) {
      return {};
    }
  }

  return metadata;
};

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
 * Get questions by lecture/lesson
 */
const getQuestionsByLecture = async (lectureId) => {
  const questions = await Question.findAll({
    where: { lectureId },
    order: [['createdAt', 'DESC']],
    include: [{ association: 'creator', attributes: ['id', 'name'] }],
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
    content: payload.questionText,
    type: 'MULTIPLE_CHOICE',
    metadata: {
      options: payload.options || [],
      correctIndex: Number(payload.correctIndex || 0),
      explanation: payload.explanation || null,
    },
    difficulty: mapDifficultyToDb(payload.difficulty),
    createdBy: creatorId,
    lectureId: payload.lectureId || null,
  });

  return getQuestionById(question.id);
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

  const currentMetadata = question.metadata || {};

  question.content = payload.questionText ?? question.content;
  question.metadata = {
    ...currentMetadata,
    options: payload.options ?? currentMetadata.options ?? [],
    correctIndex:
      payload.correctIndex != null
        ? Number(payload.correctIndex)
        : (currentMetadata.correctIndex ?? 0),
    explanation:
      payload.explanation !== undefined
        ? payload.explanation
        : (currentMetadata.explanation ?? null),
  };
  question.difficulty =
    payload.difficulty != null
      ? mapDifficultyToDb(payload.difficulty)
      : question.difficulty;
  question.lectureId = payload.lectureId ?? question.lectureId;

  await question.save();

  return getQuestionById(question.id);
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
    where: { createdBy: creatorId, difficulty: mapDifficultyToDb(difficulty) },
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
      content: {
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
  const metadata = parseMetadata(plain.metadata);

  return {
    id: plain.id,
    questionText: plain.content,
    options: Array.isArray(metadata.options) ? metadata.options : [],
    correctIndex: metadata.correctIndex != null ? Number(metadata.correctIndex) : 0,
    explanation: metadata.explanation || null,
    difficulty: mapDifficultyFromDb(plain.difficulty),
    lectureId: plain.lectureId,
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
  getQuestionsByLecture,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getQuestionsByDifficulty,
  searchQuestions,
};
