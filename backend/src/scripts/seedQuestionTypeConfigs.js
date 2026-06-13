require('dotenv').config();

const { sequelize } = require('../config/database');
const { QuestionTypeConfig } = require('../models');

const DEFAULT_QUESTION_TYPES = [
  {
    code: 'MULTIPLE_CHOICE',
    label: 'Trắc nghiệm',
    description: 'Câu hỏi có nhiều lựa chọn đáp án.',
    isEnabled: true,
    gradingConfig: {},
  },
  {
    code: 'TRUE_FALSE',
    label: 'Đúng/Sai',
    description: 'Câu hỏi chọn đúng hoặc sai.',
    isEnabled: true,
    gradingConfig: {},
  },
  {
    code: 'SHORT_ANSWER',
    label: 'Trả lời ngắn',
    description: 'Câu hỏi yêu cầu học viên nhập đáp án ngắn.',
    isEnabled: true,
    gradingConfig: {},
  },
  {
    code: 'ESSAY',
    label: 'Tự luận',
    description: 'Câu hỏi tự luận, có thể chấm thủ công, AI hoặc API ngoài.',
    isEnabled: true,
    gradingConfig: {
      externalApiEnabled: false,
      externalApiUrl: '',
      externalApiToken: '',
      timeoutMs: 30000,
      scoreField: 'score',
      feedbackField: 'feedback',
    },
  },
  {
    code: 'CLOZE',
    label: 'Câu hỏi bài đọc',
    description: 'Câu hỏi gồm đoạn đọc và nhiều câu hỏi nhỏ.',
    isEnabled: true,
    gradingConfig: {},
  },
];

const run = async () => {
  await sequelize.authenticate();

  for (const item of DEFAULT_QUESTION_TYPES) {
    const existing = await QuestionTypeConfig.findOne({
      where: { code: item.code },
    });

    if (!existing) {
      await QuestionTypeConfig.create(item);
      console.log(`Created question type: ${item.code}`);
    }
  }

  console.log('Seed question type configs done.');
  process.exit(0);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});