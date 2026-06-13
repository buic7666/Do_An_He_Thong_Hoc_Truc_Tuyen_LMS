const axios = require('axios');
const HttpError = require('../utils/HttpError');
const { QuestionTypeConfig } = require('../models');

const parseMetadata = (value) => {
  if (!value) return {};

  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (_error) {
      return {};
    }
  }

  return typeof value === 'object' ? value : {};
};

const getByPath = (object, path) => {
  if (!path) return undefined;

  return String(path)
    .split('.')
    .reduce((current, key) => {
      if (current == null) return undefined;
      return current[key];
    }, object);
};

const toScore = (value) => {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(numberValue)));
};

const gradeEssayWithExternalApiConfig = async ({
  question,
  answerText,
  student,
  attempt,
}) => {
  const questionTypeConfig = await QuestionTypeConfig.findOne({
    where: { code: 'ESSAY' },
  });

  const gradingConfig = questionTypeConfig?.gradingConfig || {};

  if (!gradingConfig.externalApiEnabled) {
    throw new HttpError(
      400,
      'API chấm tự luận ngoài chưa được bật trong cấu hình hệ thống.',
      'ESSAY_EXTERNAL_API_DISABLED',
    );
  }

  const apiUrl = String(gradingConfig.externalApiUrl || '').trim();

  if (!apiUrl) {
    throw new HttpError(
      500,
      'Chưa cấu hình URL API chấm tự luận ngoài.',
      'ESSAY_EXTERNAL_API_URL_MISSING',
    );
  }

  const metadata = parseMetadata(question?.metadata);

  const payload = {
    questionId: question.id,
    questionContent: question.content || question.questionText || '',
    studentAnswer: String(answerText || ''),

    instructions: metadata.instructions || question.instructions || '',
    rubric: metadata.rubric || question.rubric || [],
    wordLimit: metadata.wordLimit || question.wordLimit || null,

    studentId: student?.id || null,
    attemptId: attempt?.id || null,
  };

  const headers = {
    'Content-Type': 'application/json',
  };

  const token = String(gradingConfig.externalApiToken || '').trim();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;

  try {
    response = await axios.post(apiUrl, payload, {
      timeout: Number(gradingConfig.timeoutMs || 30000),
      headers,
    });
  } catch (error) {
    throw new HttpError(
      502,
      error?.response?.data?.message || 'API chấm tự luận ngoài không phản hồi hoặc bị lỗi.',
      'ESSAY_EXTERNAL_API_FAILED',
    );
  }

  const data = response?.data || {};
  const scoreField = gradingConfig.scoreField || 'score';
  const feedbackField = gradingConfig.feedbackField || 'feedback';

  return {
    score: toScore(getByPath(data, scoreField)),
    feedback: String(getByPath(data, feedbackField) || ''),
    raw: data,
  };
};

module.exports = {
  gradeEssayWithExternalApiConfig,
};