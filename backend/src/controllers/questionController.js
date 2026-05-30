const questionService = require('../services/questionService');
const { successResponse } = require('../utils/response');

/**
 * Get questions by course with filters
 * Hỗ trợ filter: type, difficulty, isPublished
 */
const getQuestionsByCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { type, difficulty, isPublished, chapterId, lectureId, segmentId } = req.query;

    const questions = await questionService.getQuestionsByCourse(
      courseId,
      {
        type,
        difficulty,
        chapterId,
        lectureId,
        segmentId,
        isPublished: isPublished === 'true' ? true : isPublished === 'false' ? false : undefined,
      },
    );

    return successResponse(res, 'Course questions retrieved', questions, 200);
  } catch (error) {
    return next(error);
  }
};

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

        let question = await questionService.getQuestionById(id);

        // Defensive enrichment: ensure `metadata` is parsed and `contentBlocks`/
        // `options` are available on the returned object even if stored as a
        // stringified JSON in the DB. This avoids clients receiving empty
        // fields when legacy records exist.
        try {
          const { normalizeRichBlocks } = require('../utils/richContent');
          const parse = (v) => {
            if (v == null) return {};
            if (typeof v === 'string') {
              try { return JSON.parse(v); } catch (_) { return {}; }
            }
            return v;
          };

          const meta = parse(question.metadata || {});
          question.metadata = meta;

          if ((!Array.isArray(question.contentBlocks) || question.contentBlocks.length === 0)) {
            const resolved = Array.isArray(meta.contentBlocks)
              ? normalizeRichBlocks(meta.contentBlocks)
              : Array.isArray(meta.blocks)
                ? normalizeRichBlocks(meta.blocks)
                : Array.isArray(meta.richContent?.blocks)
                  ? normalizeRichBlocks(meta.richContent.blocks)
                  : [];
            question.contentBlocks = resolved;
          }

          if ((!Array.isArray(question.options) || question.options.length === 0) && Array.isArray(meta.options)) {
            question.options = meta.options;
          }

          if ((!Array.isArray(question.optionsRich) || question.optionsRich.length === 0) && Array.isArray(meta.optionsRich)) {
            question.optionsRich = meta.optionsRich;
          }
        } catch (e) {
          // Non-fatal — return original question when enrichment fails
          // eslint-disable-next-line no-console
          console.warn('Failed to enrich question metadata defensively', e?.message || e);
        }

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
  getQuestionsByCourse,
  getQuestionsByLecture,
  getQuestion,
  createQuestion,
  updateQuestion,
  deleteQuestion,
};
