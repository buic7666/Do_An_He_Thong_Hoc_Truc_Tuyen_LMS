const { Op } = require('sequelize');
const { Question } = require('../models');
const { HttpError } = require('../utils/httpError');

const DIFFICULTY_MAP = {
  easy: 'EASY',
  medium: 'MEDIUM',
  hard: 'HARD',
};

const ALLOWED_TYPES = [
  'MULTIPLE_CHOICE',
  'TRUE_FALSE',
  'SHORT_ANSWER',
  'ESSAY',
];

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

const buildMetadataForType = (type, payload = {}, current = {}) => {
  const questionType = String(type || 'MULTIPLE_CHOICE').toUpperCase();

  switch (questionType) {
    case 'MULTIPLE_CHOICE': {
      const options = payload.options ?? current.options ?? [];
      const correctIndices = payload.correctIndices
        ?? (payload.correctIndex != null ? [Number(payload.correctIndex)] : undefined)
        ?? current.correctIndices
        ?? (current.correctIndex != null ? [Number(current.correctIndex)] : [0]);

      return {
        options,
        correctIndices,
        explanation: payload.explanation ?? current.explanation ?? null,
      };
    }

    case 'TRUE_FALSE':
      return {
        correctAnswer:
          payload.correctAnswer != null
            ? payload.correctAnswer === true || payload.correctAnswer === 'true'
            : current.correctAnswer === true,
        explanation: payload.explanation ?? current.explanation ?? null,
      };

    case 'SHORT_ANSWER':
      return {
        acceptedAnswers: payload.acceptedAnswers ?? current.acceptedAnswers ?? [],
        caseSensitive: payload.caseSensitive ?? current.caseSensitive ?? false,
        fuzzyMatch: payload.fuzzyMatch ?? current.fuzzyMatch ?? true,
        explanation: payload.explanation ?? current.explanation ?? null,
      };

    case 'ESSAY':
      return {
        instructions: payload.instructions ?? current.instructions ?? '',
        rubric: payload.rubric ?? current.rubric ?? [],
        wordLimit: payload.wordLimit ?? current.wordLimit ?? { min: 0, max: 2000 },
        aiModel: payload.aiModel ?? current.aiModel ?? null,
      };

    default:
      throw new HttpError(400, `Invalid question type: ${questionType}`);
  }
};

/**
 * Normalize question data - hỗ trợ cả format cũ và mới.
 */
const normalizeQuestion = (question) => {
  const plain = question.toJSON();
  const metadata = parseMetadata(plain.metadata);
  const questionType = plain.type || 'MULTIPLE_CHOICE';

  const normalized = {
    id: plain.id,
    content: plain.content,
    type: questionType,
    metadata,
    difficulty: mapDifficultyFromDb(plain.difficulty),
    isPublished: plain.isPublished || false,
    chapterId: metadata.chapterId != null ? Number(metadata.chapterId) : null,
    lectureId: plain.lectureId,
    courseId: plain.courseId,
    creator: plain.creator
      ? {
          id: plain.creator.id,
          name: plain.creator.name,
          email: plain.creator.email,
        }
      : null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };

  if (questionType === 'MULTIPLE_CHOICE') {
    const correctIndices = Array.isArray(metadata.correctIndices)
      ? metadata.correctIndices
      : (metadata.correctIndex != null ? [Number(metadata.correctIndex)] : [0]);

    normalized.questionText = plain.content;
    normalized.options = Array.isArray(metadata.options) ? metadata.options : [];
    normalized.correctIndices = correctIndices;
    normalized.correctIndex = correctIndices[0] ?? 0;
    normalized.explanation = metadata.explanation || null;
  }

  return normalized;
};

/**
 * Get all questions created by a user (question bank)
 */
const getQuestionsByCreator = async (creatorId) => {
  const questions = await Question.findAll({
    where: { createdBy: creatorId },
    include: [{ association: 'creator', attributes: ['id', 'name', 'email'] }],
    order: [['createdAt', 'DESC']],
  });

  return questions.map(normalizeQuestion);
};

/**
 * Get questions by difficulty
 */
const getQuestionsByDifficulty = async (creatorId, difficulty) => {
  const questions = await Question.findAll({
    where: {
      createdBy: creatorId,
      difficulty: mapDifficultyToDb(difficulty),
    },
    include: [{ association: 'creator', attributes: ['id', 'name', 'email'] }],
    order: [['createdAt', 'DESC']],
  });

  return questions.map(normalizeQuestion);
};

/**
 * Search questions
 */
const searchQuestions = async (creatorId, searchText) => {
  const questions = await Question.findAll({
    where: {
      createdBy: creatorId,
      content: {
        [Op.like]: `%${searchText}%`,
      },
    },
    include: [{ association: 'creator', attributes: ['id', 'name', 'email'] }],
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
    include: [{ association: 'creator', attributes: ['id', 'name', 'email'] }],
    order: [['createdAt', 'DESC']],
  });

  return questions.map(normalizeQuestion);
};

/**
 * Get questions by course with filters
 */
const getQuestionsByCourse = async (courseId, filters = {}) => {
  const where = { courseId };

  if (filters.type) {
    where.type = String(filters.type).toUpperCase();
  }

  if (filters.difficulty) {
    where.difficulty = mapDifficultyToDb(filters.difficulty);
  }

  if (filters.isPublished != null) {
    where.isPublished = filters.isPublished;
  }

  const questions = await Question.findAll({
    where,
    include: [{ association: 'creator', attributes: ['id', 'name', 'email'] }],
    order: [['createdAt', 'DESC']],
  });

  const normalizedQuestions = questions.map(normalizeQuestion);

  if (filters.chapterId != null && String(filters.chapterId).trim() !== '') {
    const targetChapterId = Number(filters.chapterId);
    return normalizedQuestions.filter((question) => Number(question.chapterId) === targetChapterId);
  }

  return normalizedQuestions;
};

/**
 * Get single question by ID
 */
const getQuestionById = async (questionId) => {
  const question = await Question.findOne({
    where: { id: questionId },
    include: [{ association: 'creator', attributes: ['id', 'name', 'email'] }],
  });

  if (!question) {
    throw new HttpError(404, 'Question not found', 'QUESTION_NOT_FOUND');
  }

  return normalizeQuestion(question);
};

/**
 * Create new question - hỗ trợ 4 loại câu hỏi
 */
const createQuestion = async (payload, creatorId) => {
  const questionType = String(payload.type || 'MULTIPLE_CHOICE').toUpperCase();

  if (!ALLOWED_TYPES.includes(questionType)) {
    throw new HttpError(400, `Invalid question type: ${questionType}`);
  }

  const metadata = {
    ...buildMetadataForType(questionType, payload),
    chapterId: payload.chapterId ?? null,
  };

  const question = await Question.create({
    content: payload.content,
    type: questionType,
    metadata,
    difficulty: mapDifficultyToDb(payload.difficulty),
    createdBy: creatorId,
    lectureId: payload.lectureId || null,
    courseId: payload.courseId || null,
    isPublished: payload.isPublished === true,
  });

  return getQuestionById(question.id);
};

/**
 * Update question - hỗ trợ 4 loại câu hỏi
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

  const questionType = String(payload.type || question.type).toUpperCase();
  if (!ALLOWED_TYPES.includes(questionType)) {
    throw new HttpError(400, `Invalid question type: ${questionType}`);
  }

  const currentMetadata = parseMetadata(question.metadata);

  if (payload.content != null) {
    question.content = payload.content;
  }

  question.type = questionType;
  question.metadata = {
    ...buildMetadataForType(questionType, payload, currentMetadata),
    chapterId: payload.chapterId !== undefined ? payload.chapterId : (currentMetadata.chapterId ?? null),
  };

  if (payload.difficulty != null) {
    question.difficulty = mapDifficultyToDb(payload.difficulty);
  }

  if (payload.lectureId !== undefined) {
    question.lectureId = payload.lectureId;
  }

  if (payload.courseId !== undefined) {
    question.courseId = payload.courseId;
  }

  if (payload.chapterId !== undefined) {
    const nextMetadata = parseMetadata(question.metadata);
    nextMetadata.chapterId = payload.chapterId;
    question.metadata = nextMetadata;
  }

  if (payload.isPublished != null) {
    question.isPublished = payload.isPublished;
  }

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
  return true;
};

module.exports = {
  getQuestionsByCreator,
  getQuestionsByDifficulty,
  searchQuestions,
  getQuestionsByLecture,
  getQuestionsByCourse,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  normalizeQuestion,
};
