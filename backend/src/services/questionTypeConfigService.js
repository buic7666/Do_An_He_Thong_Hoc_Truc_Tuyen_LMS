const { QuestionTypeConfig } = require('../models');
const HttpError = require('../utils/HttpError');

const maskToken = (config = {}) => {
  const nextConfig = { ...config };

  if (nextConfig.externalApiToken) {
    nextConfig.externalApiToken = '********';
  }

  return nextConfig;
};

const toSafeQuestionType = (item) => {
  const plain = typeof item.toJSON === 'function' ? item.toJSON() : item;

  return {
    ...plain,
    gradingConfig: maskToken(plain.gradingConfig || {}),
  };
};

const getQuestionTypes = async () => {
  const items = await QuestionTypeConfig.findAll({
    order: [['id', 'ASC']],
  });

  return items.map(toSafeQuestionType);
};

const getQuestionTypeByCode = async (code) => {
  const item = await QuestionTypeConfig.findOne({
    where: { code: String(code || '').toUpperCase() },
  });

  if (!item) {
    throw new HttpError(404, 'Không tìm thấy loại câu hỏi.', 'QUESTION_TYPE_NOT_FOUND');
  }

  return toSafeQuestionType(item);
};

const updateQuestionType = async (code, payload) => {
  const item = await QuestionTypeConfig.findOne({
    where: { code: String(code || '').toUpperCase() },
  });

  if (!item) {
    throw new HttpError(404, 'Không tìm thấy loại câu hỏi.', 'QUESTION_TYPE_NOT_FOUND');
  }

  const currentConfig = item.gradingConfig || {};
  const incomingConfig = payload.gradingConfig || {};

  const nextConfig = {
    ...currentConfig,
    ...incomingConfig,
  };

  // Nếu frontend gửi token rỗng hoặc ******** thì giữ token cũ
  if (
    incomingConfig.externalApiToken === ''
    || incomingConfig.externalApiToken === '********'
    || incomingConfig.externalApiToken == null
  ) {
    nextConfig.externalApiToken = currentConfig.externalApiToken || '';
  }

  await item.update({
    label: payload.label ?? item.label,
    description: payload.description ?? item.description,
    isEnabled:
      typeof payload.isEnabled === 'boolean'
        ? payload.isEnabled
        : item.isEnabled,
    gradingConfig: nextConfig,
  });

  return toSafeQuestionType(item);
};

module.exports = {
  getQuestionTypes,
  getQuestionTypeByCode,
  updateQuestionType,
};