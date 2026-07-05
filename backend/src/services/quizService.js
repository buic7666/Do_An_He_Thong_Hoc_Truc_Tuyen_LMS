const {
  Quiz,
  QuizQuestion,
  Question,
  StudentQuizAttempt,
  StudentAnswer,
  Course,
  Lesson,
} = require('../models');
const {
  gradeEssayWithExternalApiConfig,
} = require('./externalEssayGradingService');
const questionService = require('./questionService');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const { HttpError } = require('../utils/httpError');
const { gradeAnswer } = require('./gradingService');
const { normalizeRichBlocks } = require('../utils/richContent');

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

const normalizeQuestionType = (type) => {
  const normalized = String(type || '').toUpperCase();
  return normalized === 'MULTICHOICE' ? 'MULTIPLE_CHOICE' : normalized;
};

const normalizeClozeInnerFromChild = (childQuestion, fallbackInner = {}) => {
  const childPlain = typeof childQuestion?.toJSON === 'function' ? childQuestion.toJSON() : childQuestion;
  const childMetadata = parseJsonField(childPlain?.metadata, {}) || {};
  const childType = normalizeQuestionType(childPlain?.type || fallbackInner?.type || 'SHORT_ANSWER');

  const base = {
    ...fallbackInner,
    type: childType,
    content: String(childPlain?.content || fallbackInner?.content || '').trim(),
    contentBlocks: Array.isArray(childMetadata.contentBlocks)
      ? normalizeRichBlocks(childMetadata.contentBlocks)
      : (Array.isArray(fallbackInner.contentBlocks) ? fallbackInner.contentBlocks : []),
    explanation: childMetadata.explanation ?? fallbackInner.explanation ?? null,
    isPublished: Boolean(childPlain?.isPublished ?? fallbackInner?.isPublished ?? false),
  };

  if (childType === 'MULTIPLE_CHOICE') {
    const correctIndices = Array.isArray(childMetadata.correctIndices)
      ? childMetadata.correctIndices
      : (typeof childMetadata.correctIndex === 'number' ? [Number(childMetadata.correctIndex)] : []);

    return {
      ...base,
      options: Array.isArray(childMetadata.options)
        ? childMetadata.options
        : (Array.isArray(fallbackInner.options) ? fallbackInner.options : []),
      optionsRich: Array.isArray(childMetadata.optionsRich)
        ? childMetadata.optionsRich
        : (Array.isArray(fallbackInner.optionsRich) ? fallbackInner.optionsRich : []),
      correctIndices,
    };
  }

  if (childType === 'TRUE_FALSE') {
    return {
      ...base,
      correctAnswer: childMetadata.correctAnswer === true,
    };
  }

  if (childType === 'SHORT_ANSWER') {
    const acceptedAnswers = Array.isArray(childMetadata.acceptedAnswers)
      ? childMetadata.acceptedAnswers
      : (Array.isArray(fallbackInner.acceptedAnswers) ? fallbackInner.acceptedAnswers : []);

    return {
      ...base,
      acceptedAnswers,
      caseSensitive: Boolean(childMetadata.caseSensitive ?? fallbackInner.caseSensitive ?? false),
      fuzzyMatch: childMetadata.fuzzyMatch !== false,
    };
  }

  if (childType === 'ESSAY') {
    return {
      ...base,
      instructions: String(childMetadata.instructions || fallbackInner.instructions || '').trim(),
      rubric: Array.isArray(childMetadata.rubric)
        ? childMetadata.rubric
        : (Array.isArray(fallbackInner.rubric) ? fallbackInner.rubric : []),
      wordLimit: childMetadata.wordLimit || fallbackInner.wordLimit || { min: 0, max: 2000 },
    };
  }

  return base;
};

const mergeClozeMetadataWithChildren = (metadata = {}, childQuestions = []) => {
  const baseMetadata = metadata && typeof metadata === 'object' ? metadata : {};
  const existingInner = baseMetadata.inner_questions && typeof baseMetadata.inner_questions === 'object'
    ? baseMetadata.inner_questions
    : {};
  const existingKeys = Object.keys(existingInner);
  const orderedChildren = [...childQuestions].sort((a, b) => {
    const orderA = Number(a?.orderIndex || 0);
    const orderB = Number(b?.orderIndex || 0);
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    return Number(a?.id || 0) - Number(b?.id || 0);
  });

  const innerQuestions = {};

  orderedChildren.forEach((child, index) => {
    const key = existingKeys[index] || `q${Number(child?.orderIndex || index + 1)}`;
    const fallbackInner = existingInner[key] && typeof existingInner[key] === 'object' ? existingInner[key] : {};
    innerQuestions[key] = normalizeClozeInnerFromChild(child, fallbackInner);
  });

  Object.entries(existingInner).forEach(([key, value]) => {
    if (!innerQuestions[key]) {
      innerQuestions[key] = value;
    }
  });

  return {
    ...baseMetadata,
    text_template: String(baseMetadata.text_template || ''),
    inner_questions: innerQuestions,
  };
};

const loadChildQuestionsByParentIds = async (parentIds = []) => {
  if (!Array.isArray(parentIds) || parentIds.length === 0) {
    return new Map();
  }

  const children = await Question.findAll({
    where: {
      parentQuestionId: {
        [Op.in]: parentIds,
      },
    },
    attributes: ['id', 'parentQuestionId', 'orderIndex', 'content', 'type', 'metadata', 'isPublished'],
    order: [['parentQuestionId', 'ASC'], ['orderIndex', 'ASC'], ['id', 'ASC']],
  });

  const grouped = new Map();
  children.forEach((child) => {
    const plain = child.toJSON();
    const parentId = Number(plain.parentQuestionId);
    if (!grouped.has(parentId)) {
      grouped.set(parentId, []);
    }
    grouped.get(parentId).push(plain);
  });

  return grouped;
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
  const chapterId = question.chapterId ?? metadata.chapterId;
  return chapterId != null ? Number(chapterId) : null;
};

const resolveQuestionChapterId = async (question, transaction) => {
  const directChapterId = getQuestionChapterId(question);
  if (directChapterId) {
    return directChapterId;
  }

  const lectureId = question.lectureId ?? question.lessonId;
  if (!lectureId) {
    return null;
  }

  const lesson = await Lesson.findByPk(lectureId, {
    attributes: ['id', 'chapterId'],
    transaction,
  });

  return lesson?.chapterId != null ? Number(lesson.chapterId) : null;
};

const assertQuizInstructor = (quiz, user) => {
  if (!quiz) {
    throw new HttpError(404, 'Quiz not found', 'QUIZ_NOT_FOUND');
  }

  if (
    user?.role !== 'admin'
    && Number(quiz.course?.instructorId) !== Number(user?.id)
  ) {
    throw new HttpError(403, 'You are not the instructor', 'FORBIDDEN');
  }
};

const hasQuestionSelectionPayload = (payload = {}) => {
  return (
    Object.prototype.hasOwnProperty.call(payload, 'questionIds')
    || Object.prototype.hasOwnProperty.call(payload, 'randomize')
    || Object.prototype.hasOwnProperty.call(payload, 'randomCount')
  );
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
  const course = await Course.findByPk(courseId, {
    attributes: ['id', 'approvalStatus', 'status', 'isPublished'],
  });

  const isCourseApproved = course
    && (
      course.isPublished === true
      || String(course.approvalStatus || '').toUpperCase() === 'APPROVED'
      || String(course.status || '').toLowerCase() === 'approved'
    );

  if (!isCourseApproved) {
    return [];
  }

  const quizzes = await Quiz.findAll({
    where: { courseId, lessonId: null, isPublished: true },
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

  return await normalizeQuizWithQuestions(quiz);
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
    where: { id: quizId },
    include: [{ association: 'course', attributes: ['id', 'approvalStatus', 'status', 'isPublished'] }],
  });

  const course = quiz?.course;
  const isCourseApproved = course
    && (
      course.isPublished === true
      || String(course.approvalStatus || '').toUpperCase() === 'APPROVED'
      || String(course.status || '').toLowerCase() === 'approved'
    );

  if (!quiz || (!quiz.isPublished && !isCourseApproved)) {
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

  const clozeParentIds = quizQuestions
    .map((item) => item.question)
    .filter((question) => normalizeQuestionType(question?.type) === 'CLOZE')
    .map((question) => Number(question.id));
  const childMapByParentId = await loadChildQuestionsByParentIds(clozeParentIds);

  // Chấm từng câu và lưu StudentAnswer
  const studentAnswers = [];
  let totalScore = 0;
  let earnedPoints = 0;
  const getQuizQuestionPoints = (quizQuestion) => {
    const points = Number(quizQuestion?.points || 0);
    return Number.isFinite(points) && points > 0 ? points : 1;
  };
  const totalPossiblePoints = quizQuestions.reduce((sum, quizQuestion) => sum + getQuizQuestionPoints(quizQuestion), 0);
  const normalizeScorePercent = (score) => {
    const scorePercent = Number(score || 0);
    return Number.isFinite(scorePercent) ? Math.max(0, Math.min(100, scorePercent)) : 0;
  };

  for (const qq of quizQuestions) {
    const question = qq.question;
    const studentAnswer = answers[question.id];
    const questionPoints = getQuizQuestionPoints(qq);
    let questionMetadata = parseJsonField(question.metadata, {});
    if (normalizeQuestionType(question.type) === 'CLOZE') {
      questionMetadata = mergeClozeMetadataWithChildren(
        questionMetadata,
        childMapByParentId.get(Number(question.id)) || [],
      );
    }

    if (!studentAnswer) {
      console.warn(`No answer provided for question ${question.id}`);
      continue;
    }

try {
  const normalizedType = normalizeQuestionType(question.type);
  const gradingMethod = String(
    questionMetadata.gradingMethod || 'ai'
  ).toLowerCase();

  let gradingResult;

  if (normalizedType === 'ESSAY' && gradingMethod === 'external_api') {
    const externalResult = await gradeEssayWithExternalApiConfig({
      question: {
        id: question.id,
        content: question.content,
        type: question.type,
        metadata: questionMetadata,
      },
      answerText: String(
        typeof studentAnswer.value === 'object'
          ? studentAnswer.value?.text
            || studentAnswer.value?.answer
            || studentAnswer.value?.content
            || studentAnswer.value?.value
            || JSON.stringify(studentAnswer.value)
          : studentAnswer.value || ''
      ),
      student: {
        id: studentId,
      },
      attempt,
    });

    gradingResult = {
      score: externalResult.score,
      details: {
        method: 'external_api',
        raw: externalResult.raw,
      },
      aiFeedback: {
        overallFeedback: externalResult.feedback,
      },
    };
  } else {
    // Gọi GradingService để chấm các loại câu hỏi còn lại
    gradingResult = await gradeAnswer(
      studentAnswer.value,
      questionMetadata,
      question.type,
      question.content
    );
  }

  const scorePercent = normalizeScorePercent(gradingResult.score);
  const earnedQuestionPoints = (scorePercent / 100) * questionPoints;
  earnedPoints += earnedQuestionPoints;

  // Tạo StudentAnswer record
  const sa = await StudentAnswer.create({
    attemptId: attempt.id,
    questionId: question.id,
    answerType: question.type,
    answerValue: studentAnswer.value,
    score: scorePercent,
    gradingDetails: {
      ...(gradingResult.details || {}),
      scorePercent,
      questionPoints,
      earnedPoints: Number(earnedQuestionPoints.toFixed(2)),
    },
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
        gradingDetails: {
          error: error.message,
          scorePercent: 0,
          questionPoints,
          earnedPoints: 0,
        },
        aiFeedback: null,
      });

      studentAnswers.push(sa);
    }
  }

  // Tổng điểm = tổng(score% từng câu * điểm tối đa câu) / tổng điểm tối đa toàn bài.
  totalScore = totalPossiblePoints > 0 ? Number(((earnedPoints / totalPossiblePoints) * 100).toFixed(2)) : 0;
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

const resolveQuestionSnapshot = (question) => {
  const plain = typeof question?.toJSON === 'function' ? question.toJSON() : (question || {});
  const metadata = parseJsonField(plain.metadata, {}) || {};
  const contentBlocks = Array.isArray(metadata.contentBlocks)
    ? normalizeRichBlocks(metadata.contentBlocks)
    : Array.isArray(metadata.blocks)
      ? normalizeRichBlocks(metadata.blocks)
      : Array.isArray(metadata.richContent?.blocks)
        ? normalizeRichBlocks(metadata.richContent.blocks)
        : [];
  const questionText = String(plain.content || metadata.questionText || metadata.title || '').trim();

  return {
    id: plain.id,
    content: questionText,
    type: plain.type || 'MULTIPLE_CHOICE',
    questionText,
    metadata,
    options: Array.isArray(metadata.options) ? metadata.options : [],
    optionsRich: Array.isArray(metadata.optionsRich) ? metadata.optionsRich : [],
    contentBlocks,
  };
};

const hydrateQuestionsFromFreshRows = async (questions = []) => {
  const ids = Array.from(new Set(
    questions
      .map((question) => Number(question?.id))
      .filter((id) => Number.isFinite(id)),
  ));

  if (ids.length === 0) {
    return questions;
  }

  const freshResults = await Promise.allSettled(ids.map((id) => questionService.getQuestionById(id)));
  const freshMap = new Map();
  freshResults.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value) {
      freshMap.set(ids[index], result.value);
    }
  });

  return questions.map((question) => {
    const fresh = freshMap.get(Number(question.id));
    if (!fresh) {
      return question;
    }

    const nextContentBlocks = Array.isArray(fresh.contentBlocks) && fresh.contentBlocks.length > 0
      ? fresh.contentBlocks
      : (Array.isArray(question.contentBlocks) ? question.contentBlocks : []);
    const nextOptions = Array.isArray(fresh.options) && fresh.options.length > 0
      ? fresh.options
      : (Array.isArray(question.options) ? question.options : []);
    const nextOptionsRich = Array.isArray(fresh.optionsRich) && fresh.optionsRich.length > 0
      ? fresh.optionsRich
      : (Array.isArray(question.optionsRich) ? question.optionsRich : []);
    const nextQuestionText = fresh.questionText || question.questionText || question.content || '';

    return {
      ...question,
      ...fresh,
      content: nextQuestionText,
      questionText: nextQuestionText,
      contentBlocks: nextContentBlocks,
      options: nextOptions,
      optionsRich: nextOptionsRich,
      QuizQuestion: question.QuizQuestion,
    };
  });
};

/**
 * Normalize quiz with full question data
 */
const normalizeQuizWithQuestions = async (quiz) => {
  const plain = quiz.toJSON();
  const baseQuestions = (plain.questions || []).map((q) => {
    const metadata = parseJsonField(q.metadata, {});
    const resolvedContentBlocks = Array.isArray(metadata?.contentBlocks)
      ? normalizeRichBlocks(metadata.contentBlocks)
      : Array.isArray(metadata?.blocks)
        ? normalizeRichBlocks(metadata.blocks)
        : Array.isArray(metadata?.richContent?.blocks)
          ? normalizeRichBlocks(metadata.richContent.blocks)
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

  const resolvedBaseQuestions = await hydrateQuestionsFromFreshRows(baseQuestions);

  const clozeParentIds = baseQuestions
    .filter((question) => normalizeQuestionType(question.type) === 'CLOZE')
    .map((question) => Number(question.id));
  const childMapByParentId = await loadChildQuestionsByParentIds(clozeParentIds);

  const questions = resolvedBaseQuestions.map((question) => {
    if (normalizeQuestionType(question.type) !== 'CLOZE') {
      return question;
    }

    return {
      ...question,
      metadata: mergeClozeMetadataWithChildren(
        question.metadata,
        childMapByParentId.get(Number(question.id)) || [],
      ),
    };
  });

  // Defensive: ensure every question has normalized contentBlocks populated.
  const questionsWithBlocks = questions.map((q) => {
    try {
      const hasBlocks = Array.isArray(q.contentBlocks) && q.contentBlocks.length > 0;
      if (hasBlocks) return q;

      // Use resolveQuestionSnapshot to derive blocks from metadata/legacy shapes
      const snapshot = resolveQuestionSnapshot(q);
      return {
        ...q,
        contentBlocks: Array.isArray(snapshot.contentBlocks) ? snapshot.contentBlocks : [],
      };
    } catch (e) {
      return q;
    }
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
    questions: questionsWithBlocks.sort((a, b) => a.QuizQuestion.order - b.QuizQuestion.order),
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
        questionContentBlocks: normalizeRichBlocks(parseJsonField(sa.question.metadata, {})?.contentBlocks || []),
        question: {
          id: sa.question.id,
          content: sa.question.content,
          type: sa.question.type,
          metadata: {
            ...parseJsonField(sa.question.metadata, {}),
            contentBlocks: normalizeRichBlocks(parseJsonField(sa.question.metadata, {})?.contentBlocks || []),
          },
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

const buildManualQuizQuestions = async (payload, transaction) => {
  const selectedQuestionIds = Array.isArray(payload.questionIds)
    ? [...new Set(payload.questionIds.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0))]
    : [];
  const randomCount = payload.randomize === true || Number(payload.randomCount || 0) > 0
    ? Number(payload.randomCount || 0)
    : 0;

  if (selectedQuestionIds.length + randomCount <= 0) {
    throw new HttpError(400, 'Hãy chọn ít nhất 1 câu hỏi hoặc nhập số câu random', 'QUIZ_QUESTION_REQUIRED');
  }

  const selectedQuestions = selectedQuestionIds.length
    ? await Question.findAll({
        where: {
          id: { [Op.in]: selectedQuestionIds },
          courseId: payload.courseId,
        },
        transaction,
      })
    : [];

  const selectedPlain = selectedQuestions.map((item) => item.toJSON());
  const foundIds = new Set(selectedPlain.map((item) => Number(item.id)));
  const missingIds = selectedQuestionIds.filter((id) => !foundIds.has(Number(id)));

  if (missingIds.length) {
    throw new HttpError(400, 'Một số câu hỏi đã chọn không tồn tại trong khóa học này', 'INVALID_SELECTED_QUESTIONS');
  }

  const selectedWithChapter = await Promise.all(
    selectedPlain.map(async (question) => ({
      question,
      chapterId: await resolveQuestionChapterId(question, transaction),
    })),
  );
  const selectedWrongChapter = selectedWithChapter.filter((item) => Number(item.chapterId) !== Number(payload.chapterId));
  if (selectedWrongChapter.length) {
    throw new HttpError(400, 'Một số câu hỏi đã chọn không thuộc chương này', 'QUESTION_CHAPTER_MISMATCH');
  }

  let randomPlain = [];

  if (randomCount > 0) {
    const allChapterQuestions = await Question.findAll({
      where: {
        courseId: payload.courseId,
      },
      transaction,
    });

    const selectedIdSet = new Set(selectedQuestionIds.map((id) => Number(id)));
    const allPlainQuestions = allChapterQuestions.map((item) => item.toJSON());
    const allWithChapter = await Promise.all(
      allPlainQuestions.map(async (question) => ({
        question,
        chapterId: await resolveQuestionChapterId(question, transaction),
      })),
    );
    const randomPool = allWithChapter
      .filter((item) => Number(item.chapterId) === Number(payload.chapterId))
      .map((item) => item.question)
      .filter((question) => !selectedIdSet.has(Number(question.id)));

    if (randomPool.length < randomCount) {
      throw new HttpError(
        400,
        `Không đủ câu hỏi để random. Cần ${randomCount}, hiện có ${randomPool.length}.`,
        'NOT_ENOUGH_RANDOM_QUESTIONS',
      );
    }

    randomPlain = shuffleArray(randomPool).slice(0, randomCount);
  }

  const selectedOrdered = selectedQuestionIds
    .map((id) => selectedPlain.find((question) => Number(question.id) === Number(id)))
    .filter(Boolean);

  return [...selectedOrdered, ...randomPlain];
};

/**
 * Create quiz by teacher
 */
const createQuizByTeacher = async (payload, user) => {
  const courseId = payload.courseId;
  const chapterId = payload.chapterId || null;
  const useManualQuestions = Array.isArray(payload.questionIds) || Number(payload.randomCount || 0) > 0;
  const questionQuotas = useManualQuestions ? null : resolveQuizQuestionQuotas(payload);

  const course = await Course.findOne({ where: { id: courseId } });
  if (!course) {
    throw new HttpError(404, 'Course not found', 'COURSE_NOT_FOUND');
  }

  if (user?.role !== 'admin' && Number(course.instructorId) !== Number(user.id)) {
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

    if (useManualQuestions) {
      const selectedQuestions = await buildManualQuizQuestions(payload, transaction);

      await QuizQuestion.bulkCreate(
        selectedQuestions.map((item, index) => ({
          quizId: quiz.id,
          questionId: item.id,
          order: index + 1,
          points: 1,
        })),
        { transaction },
      );
    } else {
      await autoPopulateQuizQuestions(quiz, transaction, questionQuotas);
    }

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

  assertQuizInstructor(quiz, user);

  const question = await Question.findOne({
    where: {
      id: questionId,
      courseId: quiz.courseId,
    },
  });
  if (!question) {
    throw new HttpError(404, 'Question not found in this course', 'QUESTION_NOT_FOUND');
  }

  const questionPlain = question.toJSON ? question.toJSON() : question;
  const questionChapterId = await resolveQuestionChapterId(questionPlain);

  if (quiz.chapterId && Number(questionChapterId) !== Number(quiz.chapterId)) {
    throw new HttpError(400, 'Question does not belong to this quiz chapter', 'QUESTION_CHAPTER_MISMATCH');
  }

  const existing = await QuizQuestion.findOne({
    where: { quizId, questionId },
  });
  if (existing) {
    throw new HttpError(409, 'Question already in quiz', 'DUPLICATE');
  }

  const maxOrder = Number(await QuizQuestion.max('order', { where: { quizId } }) || 0);
  const requestedOrder = Number(payload.order || 0);
  const quizQuestion = await sequelize.transaction(async (transaction) => {
    const created = await QuizQuestion.create({
      quizId,
      questionId,
      order: Number.isInteger(requestedOrder) && requestedOrder > 0 ? requestedOrder : maxOrder + 1,
      points: payload.points || 1,
    }, { transaction });

    if (quiz.isPublished) {
      quiz.isPublished = false;
      await quiz.save({ transaction });
    }

    return created;
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

  assertQuizInstructor(quiz, user);

  const deletedCount = await sequelize.transaction(async (transaction) => {
    const count = await QuizQuestion.destroy({
      where: { quizId, questionId },
      transaction,
    });

    if (count > 0 && quiz.isPublished) {
      quiz.isPublished = false;
      await quiz.save({ transaction });
    }

    return count;
  });

  return { quizId, questionId, deleted: deletedCount > 0 };
};

/**
 * Update quiz
 */
const updateQuizByTeacher = async (quizId, payload, user) => {
  const quiz = await Quiz.findOne({
    where: { id: quizId },
    include: [{ association: 'course' }],
  });

  assertQuizInstructor(quiz, user);

  quiz.title = payload.title ?? quiz.title;
  quiz.description = payload.description ?? quiz.description;
  quiz.duration = payload.duration ?? quiz.duration;
  quiz.passScore = payload.passScore ?? quiz.passScore;
  quiz.maxAttempts = payload.maxAttempts ?? quiz.maxAttempts;

  await sequelize.transaction(async (transaction) => {
    await quiz.save({ transaction });

    if (hasQuestionSelectionPayload(payload)) {
      const selectedQuestions = await buildManualQuizQuestions({
        ...payload,
        courseId: quiz.courseId,
        chapterId: quiz.chapterId,
      }, transaction);

      await QuizQuestion.destroy({ where: { quizId: quiz.id }, transaction });
      await QuizQuestion.bulkCreate(
        selectedQuestions.map((item, index) => ({
          quizId: quiz.id,
          questionId: item.id,
          order: index + 1,
          points: 1,
        })),
        { transaction },
      );

      if (quiz.isPublished) {
        quiz.isPublished = false;
        await quiz.save({ transaction });
      }
    }
  });

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

  assertQuizInstructor(quiz, user);

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

  assertQuizInstructor(quiz, user);

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
