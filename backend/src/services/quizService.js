const {
  Quiz,
  QuizQuestion,
  Question,
  StudentQuizAttempt,
  Course,
} = require('../models');
const { Op } = require('sequelize');
const { HttpError } = require('../utils/httpError');

const shuffleArray = (items) => {
  const copied = [...items];

  for (let index = copied.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copied[index], copied[swapIndex]] = [copied[swapIndex], copied[index]];
  }

  return copied;
};

const refreshChapterQuizQuestions = async (quiz) => {
  if (quiz.lessonId) {
    return;
  }

  const lessonQuizzes = await Quiz.findAll({
    where: {
      courseId: quiz.courseId,
      isPublished: true,
      lessonId: { [Op.ne]: null },
    },
    include: [
      {
        association: 'questions',
        through: { attributes: ['points'] },
        attributes: ['id'],
      },
    ],
  });

  const poolMap = new Map();
  for (const lessonQuiz of lessonQuizzes) {
    const plain = lessonQuiz.toJSON();
    const linkedQuestions = Array.isArray(plain.questions) ? plain.questions : [];

    for (const item of linkedQuestions) {
      if (!poolMap.has(item.id)) {
        poolMap.set(item.id, {
          questionId: item.id,
          points: Number(item?.QuizQuestion?.points || 1),
        });
      }
    }
  }

  const questionPool = Array.from(poolMap.values());
  if (questionPool.length === 0) {
    return;
  }

  const existingCount = await QuizQuestion.count({ where: { quizId: quiz.id } });
  const desiredCount = existingCount > 0 ? Math.min(existingCount, questionPool.length) : Math.min(10, questionPool.length);
  const selected = shuffleArray(questionPool).slice(0, desiredCount);

  await QuizQuestion.destroy({ where: { quizId: quiz.id } });
  await QuizQuestion.bulkCreate(
    selected.map((item, index) => ({
      quizId: quiz.id,
      questionId: item.questionId,
      order: index + 1,
      points: item.points,
    })),
  );
};

/**
 * Get all quizzes for a course
 */
const getQuizzesByCourse = async (courseId, includeQuestions = false) => {
  const quizzes = await Quiz.findAll({
    where: { courseId, isPublished: true },
    include: includeQuestions
      ? [
          {
            association: 'questions',
            through: { attributes: ['order', 'points'] },
            attributes: ['id', 'questionText'],
          },
        ]
      : [],
    order: [['createdAt', 'DESC']],
  });

  return quizzes.map((quiz) => normalizeQuiz(quiz, includeQuestions));
};

/**
 * Get quiz details with all questions
 */
const getQuizDetail = async (quizId) => {
  const quiz = await Quiz.findOne({
    where: { id: quizId },
    include: [
      {
        association: 'questions',
        through: { attributes: ['order', 'points'] },
        attributes: ['id', 'questionText', 'optionsJson'],
      },
    ],
  });

  if (!quiz) {
    throw new HttpError(404, 'Quiz not found', 'QUIZ_NOT_FOUND');
  }

  return normalizeQuizWithQuestions(quiz);
};

/**
 * Get quiz results for a student
 */
const getStudentQuizAttempts = async (quizId, studentId) => {
  const attempts = await StudentQuizAttempt.findAll({
    where: { quizId, studentId },
    include: [
      {
        association: 'quiz',
        attributes: ['title', 'passScore'],
      },
    ],
    order: [['attemptNumber', 'ASC']],
  });

  return attempts.map(normalizeQuizAttempt);
};

/**
 * Get latest quiz attempt
 */
const getLatestQuizAttempt = async (quizId, studentId) => {
  const attempt = await StudentQuizAttempt.findOne({
    where: { quizId, studentId },
    include: [
      {
        association: 'quiz',
        attributes: ['title', 'passScore', 'maxAttempts'],
      },
    ],
    order: [['attemptNumber', 'DESC']],
  });

  return attempt ? normalizeQuizAttempt(attempt) : null;
};

/**
 * Start a new quiz attempt
 */
const startQuizAttempt = async (quizId, studentId) => {
  const quiz = await Quiz.findOne({
    where: { id: quizId, isPublished: true },
  });

  if (!quiz) {
    throw new HttpError(404, 'Quiz not found', 'QUIZ_NOT_FOUND');
  }

  await refreshChapterQuizQuestions(quiz);

  // Check max attempts
  const attemptCount = await StudentQuizAttempt.count({
    where: { quizId, studentId },
  });

  if (attemptCount >= quiz.maxAttempts) {
    throw new HttpError(
      400,
      `Bạn đã hết lần làm bài. Số lần tối đa: ${quiz.maxAttempts}`,
      'MAX_ATTEMPTS_EXCEEDED',
    );
  }

  // Check if there's an incomplete attempt
  let attempt = await StudentQuizAttempt.findOne({
    where: {
      quizId,
      studentId,
      submittedAt: null,
    },
  });

  if (attempt) {
    // Reset the attempt
    attempt.answersJson = null;
    attempt.startedAt = new Date();
    await attempt.save();
    return normalizeQuizAttempt(attempt);
  }

  // Create new attempt
  attempt = await StudentQuizAttempt.create({
    quizId,
    studentId,
    attemptNumber: attemptCount + 1,
    startedAt: new Date(),
  });

  return normalizeQuizAttempt(attempt);
};

/**
 * Save quiz answer (auto-save)
 */
const saveQuizAnswer = async (quizId, studentId, questionId, selectedIndex) => {
  const attempt = await StudentQuizAttempt.findOne({
    where: {
      quizId,
      studentId,
      submittedAt: null,
    },
  });

  if (!attempt) {
    throw new HttpError(
      400,
      'Quiz attempt not found or already submitted',
      'ATTEMPT_NOT_FOUND',
    );
  }

  const answers = attempt.answersJson ? JSON.parse(attempt.answersJson) : {};
  answers[questionId] = selectedIndex;

  attempt.answersJson = JSON.stringify(answers);
  await attempt.save();

  return {
    quizId,
    questionId,
    savedAt: new Date(),
  };
};

/**
 * Submit quiz and calculate score
 */
const submitQuiz = async (quizId, studentId, answers = {}) => {
  const attempt = await StudentQuizAttempt.findOne({
    where: {
      quizId,
      studentId,
      submittedAt: null,
    },
    include: [
      {
        association: 'quiz',
        attributes: ['passScore', 'id'],
      },
    ],
  });

  if (!attempt) {
    throw new HttpError(
      400,
      'Quiz attempt not found or already submitted',
      'ATTEMPT_NOT_FOUND',
    );
  }

  // Calculate score
  const quizQuestions = await QuizQuestion.findAll({
    where: { quizId },
    include: [
      {
        association: 'question',
        attributes: ['id', 'correctIndex'],
      },
    ],
  });

  let correctCount = 0;
  let totalPoints = 0;

  for (const qq of quizQuestions) {
    const studentAnswer = answers[qq.questionId] ?? JSON.parse(attempt.answersJson || '{}')[qq.questionId];
    totalPoints += qq.points;

    if (studentAnswer != null && Number(studentAnswer) === qq.question.correctIndex) {
      correctCount += qq.points;
    }
  }

  const percentage = totalPoints > 0 ? Math.round((correctCount / totalPoints) * 100) : 0;
  const isPassed = percentage >= attempt.quiz.passScore;

  attempt.answersJson = JSON.stringify(answers);
  attempt.submittedAt = new Date();
  attempt.totalScore = percentage;
  attempt.isPassed = isPassed;

  await attempt.save();

  return normalizeQuizAttempt(attempt);
};

/**
 * Get quiz score for student (best attempt)
 */
const getQuizScore = async (quizId, studentId) => {
  const attempt = await StudentQuizAttempt.findOne({
    where: {
      quizId,
      studentId,
      submittedAt: { [Op.ne]: null },
    },
    order: [['totalScore', 'DESC']],
  });

  return attempt ? normalizeQuizAttempt(attempt) : null;
};

/**
 * Normalize quiz data
 */
const normalizeQuiz = (quiz, includeQuestions = false) => {
  const plain = quiz.toJSON();

  return {
    id: plain.id,
    courseId: plain.courseId,
    lessonId: plain.lessonId,
    title: plain.title,
    description: plain.description,
    duration: plain.duration,
    passScore: plain.passScore,
    maxAttempts: plain.maxAttempts,
    isPublished: plain.isPublished,
    questions: includeQuestions ? (plain.questions || []).length : undefined,
    createdAt: plain.createdAt,
  };
};

/**
 * Normalize quiz with full question data
 */
const normalizeQuizWithQuestions = (quiz) => {
  const plain = quiz.toJSON();
  const questions = (plain.questions || []).map((q) => ({
    id: q.id,
    questionText: q.questionText,
    options: JSON.parse(q.optionsJson || '[]'),
    QuizQuestion: {
      order: q.QuizQuestion?.order,
      points: q.QuizQuestion?.points,
    },
  }));

  return {
    id: plain.id,
    courseId: plain.courseId,
    lessonId: plain.lessonId,
    title: plain.title,
    description: plain.description,
    duration: plain.duration,
    passScore: plain.passScore,
    maxAttempts: plain.maxAttempts,
    isPublished: plain.isPublished,
    questions: questions.sort((a, b) => a.QuizQuestion.order - b.QuizQuestion.order),
    createdAt: plain.createdAt,
  };
};

/**
 * Normalize quiz attempt
 */
const normalizeQuizAttempt = (attempt) => {
  const plain = attempt.toJSON();

  return {
    id: plain.id,
    quizId: plain.quizId,
    studentId: plain.studentId,
    attemptNumber: plain.attemptNumber,
    startedAt: plain.startedAt,
    submittedAt: plain.submittedAt,
    totalScore: plain.totalScore,
    isPassed: plain.isPassed,
    answers: plain.answersJson ? JSON.parse(plain.answersJson) : {},
    quiz: plain.quiz,
  };
};

module.exports = {
  getQuizzesByCourse,
  getQuizDetail,
  getStudentQuizAttempts,
  getLatestQuizAttempt,
  startQuizAttempt,
  saveQuizAnswer,
  submitQuiz,
  getQuizScore,
};
