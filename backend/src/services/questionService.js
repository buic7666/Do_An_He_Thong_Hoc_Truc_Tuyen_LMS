const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const { Question, Lesson } = require('../models');
const {
  collectLocalUploadFiles,
  deleteLocalUploadFiles,
} = require('../utils/uploadCleanup');
const { HttpError } = require('../utils/httpError');
const { normalizeRichBlocks, richBlocksToPlainText } = require('../utils/richContent');

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
  'CLOZE',
];

const getYouTubeEmbedUrl = (rawUrl) => {
  if (!rawUrl) {
    return null;
  }

  try {
    const url = new URL(String(rawUrl).trim());
    const host = url.hostname.replace('www.', '').toLowerCase();

    if (host === 'youtu.be') {
      const id = url.pathname.slice(1).split(/[?&#]/)[0];
      return id ? `https://www.youtube.com/watch?v=${id}` : null;
    }

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (url.pathname === '/watch') {
        const id = url.searchParams.get('v');
        return id ? `https://www.youtube.com/watch?v=${id}` : null;
      }

      if (url.pathname.startsWith('/embed/')) {
        const id = url.pathname.split('/embed/')[1]?.split(/[?&#]/)[0];
        return id ? `https://www.youtube.com/watch?v=${id}` : null;
      }

      if (url.pathname.startsWith('/shorts/')) {
        const id = url.pathname.split('/shorts/')[1]?.split(/[?&#]/)[0];
        return id ? `https://www.youtube.com/watch?v=${id}` : null;
      }
    }
  } catch (_error) {
    return null;
  }

  return null;
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
    let parsed = metadata;
    // Attempt to parse up to two times to handle double-encoded JSON strings
    for (let i = 0; i < 2; i += 1) {
      try {
        parsed = JSON.parse(parsed);
      } catch (_err) {
        break;
      }
      if (parsed == null || typeof parsed !== 'string') break;
    }

    return (parsed && typeof parsed === 'object') ? parsed : (typeof parsed === 'string' ? (() => { try { return JSON.parse(parsed); } catch { return {}; } })() : {});
  }

  return metadata;
};

const normalizeClozeInnerQuestions = (value) => {
  const normalizeInnerQuestionItem = (item) => {
    if (!item || typeof item !== 'object') {
      return {};
    }

    const type = String(item.type || 'MULTIPLE_CHOICE').toUpperCase();
    const normalized = {
      ...item,
      type,
      points: Number(item.points) || 1,
      content: String(item.content || '').trim(),
      contentBlocks: normalizeRichBlocks(item.contentBlocks),
      explanation: String(item.explanation || '').trim(),
      isPublished: Boolean(item.isPublished),
    };

    if (type === 'MULTIPLE_CHOICE') {
      normalized.options = Array.isArray(item.options) ? item.options : [];
      normalized.correctIndices = Array.isArray(item.correctIndices)
        ? item.correctIndices.map((indexValue) => Number(indexValue)).filter((indexValue) => Number.isFinite(indexValue))
        : (item.correct != null && String(item.correct).trim() !== '' ? [String(item.correct).trim()] : []);
      normalized.allowMultipleCorrect = Boolean(item.allowMultipleCorrect);
    } else if (type === 'TRUE_FALSE') {
      if (typeof item.correctAnswer === 'boolean') {
        normalized.correctAnswer = item.correctAnswer;
      } else if (item.correct != null) {
        normalized.correctAnswer = item.correct === true || String(item.correct).toLowerCase() === 'true';
      }
    } else if (type === 'SHORT_ANSWER') {
      normalized.acceptedAnswers = Array.isArray(item.acceptedAnswers) ? item.acceptedAnswers : (item.correct ? [item.correct] : []);
      normalized.caseSensitive = Boolean(item.caseSensitive);
      normalized.fuzzyMatch = item.fuzzyMatch != null ? Boolean(item.fuzzyMatch) : true;
    } else if (type === 'NUMERICAL') {
      normalized.correct = item.correct != null ? Number(item.correct) : null;
      normalized.tolerance = Number.isFinite(Number(item.tolerance)) ? Number(item.tolerance) : 0;
    } else if (type === 'ESSAY') {
      normalized.instructions = String(item.instructions || '').trim();
      normalized.rubric = Array.isArray(item.rubric) ? item.rubric : [];
    }

    return normalized;
  };

  if (Array.isArray(value)) {
    return value.reduce((accumulator, item, index) => {
      accumulator[`q${index + 1}`] = normalizeInnerQuestionItem(item);
      return accumulator;
    }, {});
  }

  if (!value || typeof value !== 'object') {
    return {};
  }

  return Object.entries(value).reduce((accumulator, [key, item], index) => {
    const normalizedKey = String(key || '').trim() || `q${index + 1}`;
    accumulator[normalizedKey] = normalizeInnerQuestionItem(item);
    return accumulator;
  }, {});
};

const buildMetadataForType = (type, payload = {}, current = {}) => {
  const questionType = String(type || 'MULTIPLE_CHOICE').toUpperCase();
  const incomingContentBlocks = normalizeRichBlocks(payload.contentBlocks ?? current.contentBlocks);
  const contentFromPayload = String(payload.content || current.content || '').trim();
  const contentUrl = getYouTubeEmbedUrl(contentFromPayload);
  const contentBlocks = incomingContentBlocks.length > 0
    ? incomingContentBlocks
    : (contentUrl
      ? [{ type: 'video', url: contentUrl, title: String(payload.title ?? current.title ?? '').trim() }]
      : []);

  switch (questionType) {
    case 'MULTIPLE_CHOICE': {
      const options = payload.options ?? current.options ?? [];
      const optionsRich = Array.isArray(payload.optionsRich)
        ? payload.optionsRich.map(normalizeRichBlocks)
        : (Array.isArray(current.optionsRich) ? current.optionsRich.map(normalizeRichBlocks) : []);
      const correctIndices = payload.correctIndices
        ?? (payload.correctIndex != null ? [Number(payload.correctIndex)] : undefined)
        ?? current.correctIndices
        ?? (current.correctIndex != null ? [Number(current.correctIndex)] : [0]);

      return {
        contentBlocks,
        options,
        optionsRich,
        correctIndices,
        explanation: payload.explanation ?? current.explanation ?? null,
      };
    }

    case 'TRUE_FALSE':
      return {
        contentBlocks,
        correctAnswer:
          payload.correctAnswer != null
            ? payload.correctAnswer === true || payload.correctAnswer === 'true'
            : current.correctAnswer === true,
        explanation: payload.explanation ?? current.explanation ?? null,
      };

    case 'SHORT_ANSWER':
      return {
        contentBlocks,
        acceptedAnswers: payload.acceptedAnswers ?? current.acceptedAnswers ?? [],
        caseSensitive: payload.caseSensitive ?? current.caseSensitive ?? false,
        fuzzyMatch: payload.fuzzyMatch ?? current.fuzzyMatch ?? true,
        explanation: payload.explanation ?? current.explanation ?? null,
      };

    case 'ESSAY':
      const hasExternalApiUrl = Object.prototype.hasOwnProperty.call(payload, 'externalApiUrl');
      const hasExternalApiAuthHeader = Object.prototype.hasOwnProperty.call(payload, 'externalApiAuthHeader');
      return {
        contentBlocks,
        instructions: payload.instructions ?? current.instructions ?? '',
        instructionsBlocks: normalizeRichBlocks(payload.instructionsBlocks ?? current.instructionsBlocks),
        rubric: payload.rubric ?? current.rubric ?? [],
        wordLimit: payload.wordLimit ?? current.wordLimit ?? { min: 0, max: 2000 },
        aiModel: payload.aiModel ?? current.aiModel ?? null,
        gradingMethod: payload.gradingMethod ?? current.gradingMethod ?? 'ai',
        externalApiUrl: hasExternalApiUrl ? payload.externalApiUrl : (current.externalApiUrl ?? null),
        externalApiAuthHeader: hasExternalApiAuthHeader ? payload.externalApiAuthHeader : (current.externalApiAuthHeader ?? null),
      };

    case 'CLOZE':
      return {
        contentBlocks,
        text_template: payload.metadata?.text_template ?? current.text_template ?? payload.content ?? '',
        inner_questions: normalizeClozeInnerQuestions(payload.metadata?.inner_questions ?? current.inner_questions ?? {}),
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
    parentQuestionId: plain.parentQuestionId,
    orderIndex: plain.orderIndex,
    segmentId: metadata.segmentId != null ? Number(metadata.segmentId) : null,
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

  const resolvedBlocks = Array.isArray(metadata.contentBlocks)
    ? metadata.contentBlocks
    : Array.isArray(metadata.blocks)
      ? metadata.blocks
      : Array.isArray(metadata.richContent?.blocks)
        ? metadata.richContent.blocks
        : [];

  normalized.contentBlocks = normalizeRichBlocks(resolvedBlocks);

  if (questionType === 'MULTIPLE_CHOICE') {
    const correctIndices = Array.isArray(metadata.correctIndices)
      ? metadata.correctIndices
      : (metadata.correctIndex != null ? [Number(metadata.correctIndex)] : [0]);

    normalized.questionText = plain.content;
    normalized.options = Array.isArray(metadata.options) ? metadata.options : [];
    normalized.optionsRich = Array.isArray(metadata.optionsRich) ? metadata.optionsRich : [];
    normalized.correctIndices = correctIndices;
    normalized.correctIndex = correctIndices[0] ?? 0;
    normalized.explanation = metadata.explanation || null;
  } else if (questionType === 'CLOZE') {
    normalized.metadata = {
      ...metadata,
      inner_questions: normalizeClozeInnerQuestions(metadata.inner_questions || {}),
    };
    normalized.contentBlocks = Array.isArray(normalized.metadata.contentBlocks) ? normalized.metadata.contentBlocks : [];
  }

  return normalized;
};

/**
 * Get all questions created by a user (question bank)
 */
const getQuestionsByCreator = async (creatorId) => {
  const questions = await Question.findAll({
    where: { createdBy: creatorId, parentQuestionId: null },
    include: [{ association: 'creator', attributes: ['id', 'name', 'email'] }],
    order: [['parentQuestionId', 'ASC'], ['orderIndex', 'ASC'], ['createdAt', 'DESC']],
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
      parentQuestionId: null,
    },
    include: [{ association: 'creator', attributes: ['id', 'name', 'email'] }],
    order: [['parentQuestionId', 'ASC'], ['orderIndex', 'ASC'], ['createdAt', 'DESC']],
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
      parentQuestionId: null,
      content: {
        [Op.like]: `%${searchText}%`,
      },
    },
    include: [{ association: 'creator', attributes: ['id', 'name', 'email'] }],
    order: [['parentQuestionId', 'ASC'], ['orderIndex', 'ASC'], ['createdAt', 'DESC']],
  });

  return questions.map(normalizeQuestion);
};

/**
 * Get questions by lecture/lesson
 */
const getQuestionsByLecture = async (lectureId) => {
  const questions = await Question.findAll({
    where: { lectureId, parentQuestionId: null },
    include: [{ association: 'creator', attributes: ['id', 'name', 'email'] }],
    order: [['parentQuestionId', 'ASC'], ['orderIndex', 'ASC'], ['createdAt', 'DESC']],
  });

  return questions.map(normalizeQuestion);
};

/**
 * Get questions by course with filters
 */
const getQuestionsByCourse = async (courseId, filters = {}) => {
  const where = { courseId, parentQuestionId: null };

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
    order: [['parentQuestionId', 'ASC'], ['orderIndex', 'ASC'], ['createdAt', 'DESC']],
  });

  const normalizedQuestions = questions.map(normalizeQuestion);
  const lessonIds = [
    ...new Set(
      normalizedQuestions
        .map((question) => Number(question.lectureId ?? question.lessonId))
        .filter((id) => Number.isFinite(id) && id > 0),
    ),
  ];
  const lessons = lessonIds.length
    ? await Lesson.findAll({
        where: { id: { [Op.in]: lessonIds } },
        attributes: ['id', 'chapterId'],
      })
    : [];
  const lessonChapterById = new Map(
    lessons.map((lesson) => [Number(lesson.id), Number(lesson.chapterId)]),
  );
  const getResolvedQuestionChapterId = (question) => {
    const directChapterId = Number(question.chapterId);
    if (Number.isFinite(directChapterId) && directChapterId > 0) {
      return directChapterId;
    }

    return lessonChapterById.get(Number(question.lectureId ?? question.lessonId)) || null;
  };

  if (filters.chapterId != null && String(filters.chapterId).trim() !== '') {
    const targetChapterId = Number(filters.chapterId);
    const byChapter = normalizedQuestions.filter((question) => Number(getResolvedQuestionChapterId(question)) === targetChapterId);

    if (filters.lectureId != null && String(filters.lectureId).trim() !== '') {
      const targetLectureId = Number(filters.lectureId);
      const byLecture = byChapter.filter((question) => Number(question.lectureId) === targetLectureId);

      if (filters.segmentId != null && String(filters.segmentId).trim() !== '') {
        const targetSegmentId = Number(filters.segmentId);
        return byLecture.filter((question) => Number(question.segmentId) === targetSegmentId);
      }

      return byLecture;
    }

    return byChapter;
  }

  if (filters.lectureId != null && String(filters.lectureId).trim() !== '') {
    const targetLectureId = Number(filters.lectureId);
    const byLecture = normalizedQuestions.filter((question) => Number(question.lectureId) === targetLectureId);

    if (filters.segmentId != null && String(filters.segmentId).trim() !== '') {
      const targetSegmentId = Number(filters.segmentId);
      return byLecture.filter((question) => Number(question.segmentId) === targetSegmentId);
    }

    return byLecture;
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
  // Normalize and defensively enrich contentBlocks from legacy metadata or raw HTML
  const normalized = normalizeQuestion(question);

  try {
    const plain = typeof question.toJSON === 'function' ? question.toJSON() : (question || {});
    const metaRaw = plain.metadata;

    const extractImageFromHtml = (html) => {
      if (!html || typeof html !== 'string') return null;
      try {
        const m = html.match(/<img[^>]+src=["']?([^"' >]+)["']?[^>]*>/i);
        if (m && m[1]) return m[1];
      } catch (e) {}
      return null;
    };

    const findFirstImageUrl = (text) => {
      if (!text) return null;
      const dataMatch = text.match(/(data:image\/[a-zA-Z0-9.+-]+;base64,[^\s"'>]+)/i);
      if (dataMatch) return dataMatch[1];
      const urlMatch = text.match(/(https?:\/\/[^\s"'>]+\.(?:png|jpe?g|gif|webp|bmp|svg)(?:\?[^\s"'>]*)?)/i);
      if (urlMatch) return urlMatch[1];
      const upMatch = text.match(/(\/uploads\/images\/[^\s"'>]+)/i);
      if (upMatch) return upMatch[1].startsWith('/') ? (`http://localhost:5000${upMatch[1]}`) : upMatch[1];
      return null;
    };

    if ((!Array.isArray(normalized.contentBlocks) || normalized.contentBlocks.length === 0)) {
      let candidate = null;

      const meta = (metaRaw && typeof metaRaw === 'object') ? metaRaw : (typeof metaRaw === 'string' ? (() => { try { return JSON.parse(metaRaw); } catch { return {}; } })() : {});

      if (Array.isArray(meta.contentBlocks) && meta.contentBlocks.length > 0) {
        normalized.contentBlocks = normalizeRichBlocks(meta.contentBlocks);
      } else if (Array.isArray(meta.blocks) && meta.blocks.length > 0) {
        normalized.contentBlocks = normalizeRichBlocks(meta.blocks);
      } else if (meta.richContent && Array.isArray(meta.richContent.blocks) && meta.richContent.blocks.length > 0) {
        normalized.contentBlocks = normalizeRichBlocks(meta.richContent.blocks);
      } else {
        if (typeof plain.metadata === 'string') {
          candidate = extractImageFromHtml(plain.metadata) || findFirstImageUrl(plain.metadata);
        }

        if (!candidate && typeof plain.content === 'string') {
          candidate = extractImageFromHtml(plain.content) || findFirstImageUrl(plain.content);
        }

        if (candidate) {
          normalized.contentBlocks = normalizeRichBlocks([{ type: 'image', url: candidate, alt: '' }]);
        }
      }
    }
  } catch (e) {
    // non-fatal
  }

  return normalized;
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
    segmentId: payload.segmentId ?? null,
  };

  const richContentText = richBlocksToPlainText(metadata.contentBlocks);

  const question = await Question.create({
    content: payload.content || richContentText,
    type: questionType,
    metadata,
    difficulty: mapDifficultyToDb(payload.difficulty),
    createdBy: creatorId,
    lectureId: payload.lectureId || null,
    courseId: payload.courseId || null,
    parentQuestionId: payload.parentQuestionId || null,
    orderIndex: payload.orderIndex || null,
    isPublished: true,
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

  if (payload.contentBlocks) {
    const nextMetadata = parseMetadata(question.metadata);
    nextMetadata.contentBlocks = normalizeRichBlocks(payload.contentBlocks);
    question.metadata = nextMetadata;
    if (!payload.content) {
      question.content = richBlocksToPlainText(nextMetadata.contentBlocks) || question.content;
    }
  }

  question.type = questionType;
  question.metadata = {
    ...buildMetadataForType(questionType, payload, currentMetadata),
    chapterId: payload.chapterId !== undefined ? payload.chapterId : (currentMetadata.chapterId ?? null),
    segmentId: payload.segmentId !== undefined ? payload.segmentId : (currentMetadata.segmentId ?? null),
  };

  if (payload.difficulty != null) {
    question.difficulty = mapDifficultyToDb(payload.difficulty);
  }

  if (payload.lectureId !== undefined) {
    question.lectureId = payload.lectureId;
  }

  if (payload.parentQuestionId !== undefined) {
    question.parentQuestionId = payload.parentQuestionId;
  }

  if (payload.orderIndex !== undefined) {
    question.orderIndex = payload.orderIndex;
  }

  if (payload.courseId !== undefined) {
    question.courseId = payload.courseId;
  }

  if (payload.chapterId !== undefined) {
    const nextMetadata = parseMetadata(question.metadata);
    nextMetadata.chapterId = payload.chapterId;
    question.metadata = nextMetadata;
  }

  if (payload.segmentId !== undefined) {
    const nextMetadata = parseMetadata(question.metadata);
    nextMetadata.segmentId = payload.segmentId;
    question.metadata = nextMetadata;
  }

  question.isPublished = true;

  await question.save();

  return getQuestionById(question.id);
};
const isUploadFileUsedByOtherQuestions = async (relativePath, questionId) => {
  const pattern = `%${relativePath}%`;

  const reusedQuestion = await Question.findOne({
    where: {
      id: {
        [Op.ne]: questionId,
      },
      [Op.or]: [
        {
          content: {
            [Op.like]: pattern,
          },
        },
        sequelize.where(
          sequelize.cast(sequelize.col('metadata'), 'CHAR'),
          {
            [Op.like]: pattern,
          },
        ),
      ],
    },
    attributes: ['id'],
  });

  return Boolean(reusedQuestion);
};

const deleteUnusedQuestionUploadFiles = async (files, questionId) => {
  const unusedFiles = [];

  for (const file of files) {
    const isUsed = await isUploadFileUsedByOtherQuestions(
      file.relativePath,
      questionId,
    );

    if (!isUsed) {
      unusedFiles.push(file);
    }
  }

  return deleteLocalUploadFiles(unusedFiles);
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

  const plainQuestion = typeof question.toJSON === 'function'
    ? question.toJSON()
    : question;

  const uploadFiles = collectLocalUploadFiles(
    plainQuestion.content,
    plainQuestion.metadata,
    plainQuestion.tags,
  );

  await question.destroy();

  const deletedFiles = await deleteUnusedQuestionUploadFiles(
    uploadFiles,
    question.id,
  );

  return {
    deleted: true,
    deletedFiles,
  };
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
