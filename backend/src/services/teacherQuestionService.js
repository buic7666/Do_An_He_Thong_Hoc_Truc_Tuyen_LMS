const { TeacherQuestion } = require('../models');
const { HttpError } = require('../utils/httpError');

const normalizeQuestion = (item) => {
  const plain = item.toJSON();

  return {
    id: plain.id,
    testName: plain.testName,
    duration: plain.duration,
    passScore: plain.passScore,
    content: plain.content,
    options: JSON.parse(plain.optionsJson || '[]'),
    correctIndex: plain.correctIndex,
    createdAt: plain.createdAt,
  };
};

const ensureDefaultQuestions = async (teacherId) => {
  const count = await TeacherQuestion.count({ where: { teacherId } });

  if (count > 0) {
    return;
  }

  await TeacherQuestion.bulkCreate([
    {
      teacherId,
      testName: 'Kiem tra Cuoi ky - Flutter UI & State Management',
      duration: 45,
      passScore: 70,
      content: 'Trong Flutter, cach tot nhat de render mot danh sach dai ma khong gay tran bo nho la gi?',
      optionsJson: JSON.stringify(['Su dung Column', 'Su dung ListView.builder', 'Su dung Stack', 'Su dung SingleChildScrollView']),
      correctIndex: 1,
    },
    {
      teacherId,
      testName: 'Kiem tra Cuoi ky - Flutter UI & State Management',
      duration: 45,
      passScore: 70,
      content: 'Thu vien nao pho bien nhat de ma hoa mat khau trong Node.js?',
      optionsJson: JSON.stringify(['jsonwebtoken', 'passport', 'bcrypt', 'axios']),
      correctIndex: 2,
    },
  ]);
};

const getQuestions = async (currentUser) => {
  if (!currentUser?.id) {
    throw new HttpError(401, 'Unauthorized', 'UNAUTHORIZED');
  }

  await ensureDefaultQuestions(currentUser.id);

  const questions = await TeacherQuestion.findAll({
    where: { teacherId: currentUser.id },
    order: [['createdAt', 'DESC']],
  });

  if (questions.length === 0) {
    return {
      config: {
        testName: 'Kiem tra Cuoi ky',
        duration: 45,
        passScore: 70,
      },
      questions: [],
    };
  }

  const normalized = questions.map(normalizeQuestion);

  return {
    config: {
      testName: normalized[0].testName,
      duration: normalized[0].duration,
      passScore: normalized[0].passScore,
    },
    questions: normalized,
  };
};

const createQuestion = async (payload, currentUser) => {
  if (!currentUser?.id) {
    throw new HttpError(401, 'Unauthorized', 'UNAUTHORIZED');
  }

  const created = await TeacherQuestion.create({
    teacherId: currentUser.id,
    testName: payload.testName,
    duration: Number(payload.duration || 45),
    passScore: Number(payload.passScore || 70),
    content: payload.content,
    optionsJson: JSON.stringify(payload.options || []),
    correctIndex: Number(payload.correctIndex || 0),
  });

  return normalizeQuestion(created);
};

const updateQuestion = async (id, payload, currentUser) => {
  if (!currentUser?.id) {
    throw new HttpError(401, 'Unauthorized', 'UNAUTHORIZED');
  }

  const question = await TeacherQuestion.findOne({
    where: {
      id,
      teacherId: currentUser.id,
    },
  });

  if (!question) {
    throw new HttpError(404, 'Question not found', 'QUESTION_NOT_FOUND');
  }

  question.testName = payload.testName ?? question.testName;
  question.duration = payload.duration != null ? Number(payload.duration) : question.duration;
  question.passScore = payload.passScore != null ? Number(payload.passScore) : question.passScore;
  question.content = payload.content ?? question.content;
  question.optionsJson = payload.options ? JSON.stringify(payload.options) : question.optionsJson;
  question.correctIndex = payload.correctIndex != null ? Number(payload.correctIndex) : question.correctIndex;

  await question.save();

  return normalizeQuestion(question);
};

const deleteQuestion = async (id, currentUser) => {
  if (!currentUser?.id) {
    throw new HttpError(401, 'Unauthorized', 'UNAUTHORIZED');
  }

  const deleted = await TeacherQuestion.destroy({
    where: {
      id,
      teacherId: currentUser.id,
    },
  });

  if (!deleted) {
    throw new HttpError(404, 'Question not found', 'QUESTION_NOT_FOUND');
  }

  return {
    id,
    deleted: true,
  };
};

module.exports = {
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
};
