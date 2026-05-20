const {
  Quiz,
  QuizQuestion,
  Question,
  StudentQuizAttempt,
  StudentAnswer,
  Course,
} = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const { HttpError } = require('../utils/httpError');
const { gradeAnswer } = require('./gradingService');

const parseJsonField = (value, fallback = null) => {
  if (value == null) {
    return fallback;
  }

  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (_error) {
      return fallback;
    }
  }

  return value;
};

const shuffleArray = (items) => {
  const copied = [...items];

  for (let index = copied.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copied[index], copied[swapIndex]] = [copied[swapIndex], copied[index]];
  }

  return copied;
};

const DEFAULT_QUIZ_QUESTION_QUOTAS = {
  multipleChoice: 3,
  trueFalse: 3,
  shortAnswer: 3,
  essay: 1,
};

const resolveQuizQuestionQuotas = (payload = {}) => {
  const provided = payload.questionQuotas || {};

  return [
    {
      type: 'MULTIPLE_CHOICE',
      count: Number(provided.multipleChoice ?? DEFAULT_QUIZ_QUESTION_QUOTAS.multipleChoice),
    },
    {
      type: 'TRUE_FALSE',
      count: Number(provided.trueFalse ?? DEFAULT_QUIZ_QUESTION_QUOTAS.trueFalse),
    },
    {
      type: 'SHORT_ANSWER',
      count: Number(provided.shortAnswer ?? DEFAULT_QUIZ_QUESTION_QUOTAS.shortAnswer),
    },
    {
      type: 'ESSAY',
      count: Number(provided.essay ?? DEFAULT_QUIZ_QUESTION_QUOTAS.essay),
    },
  ];
};

const getQuestionChapterId = (question) => {
  const metadata = parseJsonField(question.metadata, {});
  return metadata.chapterId != null ? Number(metadata.chapterId) : null;
};

const autoPopulateQuizQuestions = async (quiz, transaction, questionQuotas = null) => {
  if (!quiz.chapterId) {
    throw new HttpError(400, 'Quiz phải thuộc một chương cụ thể', 'CHAPTER_REQUIRED');
  }

  const quotas = questionQuotas || resolveQuizQuestionQuotas();
  const totalRequestedQuestions = quotas.reduce((sum, quota) => sum + Number(quota.count || 0), 0);

  if (totalRequestedQuestions <= 0) {
    throw new HttpError(400, 'Cần cấu hình ít nhất 1 câu hỏi để tạo quiz', 'QUIZ_QUOTA_REQUIRED');
  }

  const chapterQuestions = await Question.findAll({
    where: {
      courseId: quiz.courseId,
      isPublished: true,
    },
    transaction,
  });

  const normalizedQuestions = chapterQuestions
    .map((item) => item.toJSON())
    .map((item) => ({
      id: item.id,
      type: item.type,
      chapterId: getQuestionChapterId(item),
    }))
    .filter((item) => Number(item.chapterId) === Number(quiz.chapterId));

  const selectedQuestions = [];

  for (const quota of quotas) {
    const pool = normalizedQuestions.filter((question) => question.type === quota.type);

    if (pool.length < quota.count) {
      throw new HttpError(
        400,
        `Chưa đủ câu hỏi ${quota.type} trong chương này để tạo quiz. Cần ${quota.count}, hiện có ${pool.length}.`,
        'NOT_ENOUGH_QUESTIONS',
      );
    }

    selectedQuestions.push(...shuffleArray(pool).slice(0, quota.count));
  }

  const randomizedQuestions = shuffleArray(selectedQuestions);

  await QuizQuestion.bulkCreate(
    randomizedQuestions.map((item, index) => ({
      quizId: quiz.id,
      questionId: item.id,
      order: index + 1,
      points: 1,
    })),
    { transaction },
  );

  return randomizedQuestions.length;
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
            attributes: ['id', 'content', 'type', 'metadata'],
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
        attributes: ['id', 'content', 'type', 'metadata'],
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

  // Check max attempts
  const attemptCount = await StudentQuizAttempt.count({
    where: { quizId, studentId },
  });

  if (Number(quiz.maxAttempts) > 0 && attemptCount >= quiz.maxAttempts) {
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
const saveQuizAnswer = async (quizId, studentId, questionId, answer) => {
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
  answers[questionId] = answer;

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
/**
 * Submit Quiz - Hỗ trợ 4 loại câu hỏi
 *
 * @param {number} quizId
 * @param {number} studentId
 * @param {object} answers - Các câu trả lời
 *   {
 *     questionId: {
 *       type: 'MULTIPLE_CHOICE|TRUE_FALSE|SHORT_ANSWER|ESSAY',
 *       value: ... (tuỳ theo type)
 *     }
 *   }
 * @returns {Promise<object>} attempt với chi tiết
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
        attributes: ['passScore', 'id', 'title'],
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

  // Lấy tất cả questions của quiz
  const quizQuestions = await QuizQuestion.findAll({
    where: { quizId },
    include: [
      {
        association: 'question',
        attributes: ['id', 'content', 'type', 'metadata'],
      },
    ],
  });

  if (quizQuestions.length === 0) {
    throw new HttpError(400, 'No questions found for this quiz');
  }

  // Chấm từng câu và lưu StudentAnswer
  const studentAnswers = [];
  const scores = [];
  let totalScore = 0;

  for (const qq of quizQuestions) {
    const question = qq.question;
    const studentAnswer = answers[question.id];
    const questionMetadata = parseJsonField(question.metadata, {});

    if (!studentAnswer) {
      console.warn(`No answer provided for question ${question.id}`);
      continue;
    }

    try {
      // Gọi GradingService để chấm
      const gradingResult = await gradeAnswer(
        studentAnswer.value,
        questionMetadata,
        question.type,
        question.content
      );

      scores.push(gradingResult.score);

      // Tạo StudentAnswer record
      const sa = await StudentAnswer.create({
        attemptId: attempt.id,
        questionId: question.id,
        answerType: question.type,
        answerValue: studentAnswer.value,
        score: gradingResult.score,
        gradingDetails: gradingResult.details || null,
        aiFeedback: gradingResult.aiFeedback?.overallFeedback || null,
      });

      studentAnswers.push(sa);
    } catch (error) {
      console.error(`Error grading question ${question.id}:`, error);
      // Nếu lỗi, lưu điểm 0
      const sa = await StudentAnswer.create({
        attemptId: attempt.id,
        questionId: question.id,
        answerType: question.type,
        answerValue: studentAnswer.value,
        score: 0,
        gradingDetails: { error: error.message },
        aiFeedback: null,
      });

      studentAnswers.push(sa);
      scores.push(0);
    }
  }

  // Tính totalScore = trung bình tất cả scores
  totalScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b) / scores.length) : 0;
  const isPassed = totalScore >= attempt.quiz.passScore;

  // Update attempt
  attempt.submittedAt = new Date();
  attempt.totalScore = totalScore;
  attempt.isPassed = isPassed;

  await attempt.save();

  // Return attempt với chi tiết
  return {
    ...normalizeQuizAttempt(attempt),
    answers: studentAnswers.map((sa) => ({
      questionId: sa.questionId,
      answerType: sa.answerType,
      score: sa.score,
      gradingDetails: sa.gradingDetails,
      aiFeedback: sa.aiFeedback,
    })),
  };
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
    chapterId: plain.chapterId,
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
  const questions = (plain.questions || []).map((q) => {
    const metadata = parseJsonField(q.metadata, {});
    const resolvedContentBlocks = Array.isArray(metadata?.contentBlocks)
      ? metadata.contentBlocks
      : Array.isArray(metadata?.blocks)
        ? metadata.blocks
        : Array.isArray(metadata?.richContent?.blocks)
          ? metadata.richContent.blocks
          : [];
    const resolvedQuestionText = String(
      q.content || metadata?.questionText || metadata?.title || '',
    ).trim();

    return {
      metadata: metadata,
      id: q.id,
      content: resolvedQuestionText,
      type: q.type || 'MULTIPLE_CHOICE',
      questionText: resolvedQuestionText,
      options: metadata?.options || [],
      contentBlocks: resolvedContentBlocks,
      QuizQuestion: {
        order: q.QuizQuestion?.order,
        points: q.QuizQuestion?.points,
      },
    };
  });

  return {
    id: plain.id,
    courseId: plain.courseId,
    chapterId: plain.chapterId,
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
/**
 * Get quiz attempt with detailed answers (for viewing results)
 * Hỗ trợ 4 loại câu hỏi + AI feedback cho ESSAY
 *
 * @param {number} attemptId
 * @param {number} studentId
 * @returns {Promise<object>}
 */
const getQuizAttemptDetails = async (attemptId, studentId) => {
  const attempt = await StudentQuizAttempt.findOne({
    where: { id: attemptId, studentId },
    include: [
      {
        association: 'quiz',
        attributes: ['title', 'passScore', 'id'],
      },
      {
        association: 'answers',
        include: [
          {
            association: 'question',
            attributes: ['id', 'content', 'type', 'metadata'],
          },
        ],
      },
    ],
  });

  if (!attempt) {
    throw new HttpError(404, 'Attempt not found', 'ATTEMPT_NOT_FOUND');
  }

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
    quiz: plain.quiz,
    answers: plain.answers
      .map((sa) => ({
        questionId: sa.questionId,
        question: {
          id: sa.question.id,
          content: sa.question.content,
          type: sa.question.type,
          metadata: parseJsonField(sa.question.metadata, {}),
        },
        answerType: sa.answerType,
        answerValue: parseJsonField(sa.answerValue, sa.answerValue),
        score: sa.score,
        gradingDetails: parseJsonField(sa.gradingDetails, sa.gradingDetails),
        aiFeedback: sa.aiFeedback, // Chi tiết AI feedback cho ESSAY
      }))
      .sort((a, b) => a.questionId - b.questionId),
  };
};

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

// ===== TEACHER MANAGEMENT FUNCTIONS =====

/**
 * Create quiz by teacher
 */
const createQuizByTeacher = async (payload, user) => {
  const courseId = payload.courseId;
  const chapterId = payload.chapterId || null;
  const questionQuotas = resolveQuizQuestionQuotas(payload);

  const course = await Course.findOne({ where: { id: courseId } });
  if (!course) {
    throw new HttpError(404, 'Course not found', 'COURSE_NOT_FOUND');
  }

  if (course.instructorId !== user.id) {
    throw new HttpError(403, 'You are not the instructor', 'FORBIDDEN');
  }

  return sequelize.transaction(async (transaction) => {
    const quiz = await Quiz.create({
      courseId,
      chapterId,
      lessonId: payload.lessonId || null,
      title: payload.title,
      description: payload.description || null,
      duration: payload.duration || 45,
      passScore: payload.passScore || 70,
      maxAttempts: payload.maxAttempts ?? 0,
      isPublished: false,
      createdBy: user.id,
    }, { transaction });

    await autoPopulateQuizQuestions(quiz, transaction, questionQuotas);

    return quiz;
  });
};

/**
 * Add question to quiz
 */
const addQuestionToQuizByTeacher = async (quizId, questionId, payload, user) => {
  const quiz = await Quiz.findOne({
    where: { id: quizId },
    include: [{ association: 'course' }],
  });

  if (!quiz) {
    throw new HttpError(404, 'Quiz not found', 'QUIZ_NOT_FOUND');
  }

  if (quiz.course.instructorId !== user.id) {
    throw new HttpError(403, 'You are not the instructor', 'FORBIDDEN');
  }

  const question = await Question.findOne({ where: { id: questionId } });
  if (!question) {
    throw new HttpError(404, 'Question not found', 'QUESTION_NOT_FOUND');
  }

  const existing = await QuizQuestion.findOne({
    where: { quizId, questionId },
  });
  if (existing) {
    throw new HttpError(409, 'Question already in quiz', 'DUPLICATE');
  }

  const quizQuestion = await QuizQuestion.create({
    quizId,
    questionId,
    order: payload.order || 0,
    points: payload.points || 1,
  });

  return quizQuestion;
};

/**
 * Remove question from quiz
 */
const removeQuestionFromQuizByTeacher = async (quizId, questionId, user) => {
  const quiz = await Quiz.findOne({
    where: { id: quizId },
    include: [{ association: 'course' }],
  });

  if (!quiz) {
    throw new HttpError(404, 'Quiz not found', 'QUIZ_NOT_FOUND');
  }

  if (quiz.course.instructorId !== user.id) {
    throw new HttpError(403, 'You are not the instructor', 'FORBIDDEN');
  }

  await QuizQuestion.destroy({
    where: { quizId, questionId },
  });

  return { quizId, questionId, deleted: true };
};

/**
 * Update quiz
 */
const updateQuizByTeacher = async (quizId, payload, user) => {
  const quiz = await Quiz.findOne({
    where: { id: quizId },
    include: [{ association: 'course' }],
  });

  if (!quiz) {
    throw new HttpError(404, 'Quiz not found', 'QUIZ_NOT_FOUND');
  }

  if (quiz.course.instructorId !== user.id) {
    throw new HttpError(403, 'You are not the instructor', 'FORBIDDEN');
  }

  quiz.title = payload.title ?? quiz.title;
  quiz.description = payload.description ?? quiz.description;
  quiz.duration = payload.duration ?? quiz.duration;
  quiz.passScore = payload.passScore ?? quiz.passScore;
  quiz.maxAttempts = payload.maxAttempts ?? quiz.maxAttempts;

  await quiz.save();

  return quiz;
};

/**
 * Publish quiz
 */
const publishQuizByTeacher = async (quizId, user) => {
  const quiz = await Quiz.findOne({
    where: { id: quizId },
    include: [{ association: 'course' }],
  });

  if (!quiz) {
    throw new HttpError(404, 'Quiz not found', 'QUIZ_NOT_FOUND');
  }

  if (quiz.course.instructorId !== user.id) {
    throw new HttpError(403, 'You are not the instructor', 'FORBIDDEN');
  }

  const questionCount = await QuizQuestion.count({ where: { quizId } });
  if (questionCount === 0) {
    throw new HttpError(400, 'Cannot publish quiz without questions', 'NO_QUESTIONS');
  }

  quiz.isPublished = true;

  await quiz.save();

  return quiz;
};

/**
 * Delete quiz
 */
const deleteQuizByTeacher = async (quizId, user) => {
  const quiz = await Quiz.findOne({
    where: { id: quizId },
    include: [{ association: 'course' }],
  });

  if (!quiz) {
    throw new HttpError(404, 'Quiz not found', 'QUIZ_NOT_FOUND');
  }

  if (quiz.course.instructorId !== user.id) {
    throw new HttpError(403, 'You are not the instructor', 'FORBIDDEN');
  }

  await quiz.destroy();

  return { id: quizId, deleted: true };
};

/**
 * Get all quizzes created by teacher
 */
const getTeacherQuizzes = async (user) => {
  const quizzes = await Quiz.findAll({
    where: { createdBy: user.id },
    include: [
      { association: 'course', attributes: ['id', 'title'] },
      {
        association: 'questions',
        attributes: ['id'],
        through: { attributes: [] },
      },
    ],
    order: [['createdAt', 'DESC']],
  });

  return quizzes.map((quiz) => {
    const plain = quiz.toJSON();
    return {
      ...plain,
      questionCount: (plain.questions || []).length,
    };
  });
};

module.exports = {
  getQuizzesByCourse,
  getQuizDetail,
  getStudentQuizAttempts,
  getLatestQuizAttempt,
  getQuizAttemptDetails,
  startQuizAttempt,
  saveQuizAnswer,
  submitQuiz,
  getQuizScore,
  // Teacher methods
  createQuizByTeacher,
  addQuestionToQuizByTeacher,
  removeQuestionFromQuizByTeacher,
  updateQuizByTeacher,
  publishQuizByTeacher,
  deleteQuizByTeacher,
  getTeacherQuizzes,
};
