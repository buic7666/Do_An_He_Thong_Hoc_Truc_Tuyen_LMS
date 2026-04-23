const express = require('express');
const quizController = require('../controllers/quizController');
const questionController = require('../controllers/questionController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { validateRequest } = require('../middlewares/validationMiddleware');
const {
  createQuestionBodySchema,
  updateQuestionBodySchema,
  questionIdParamSchema,
  courseIdParamSchema,
  quizIdParamSchema,
  saveQuizAnswerBodySchema,
  submitQuizBodySchema,
} = require('../validations/quizValidation');

const router = express.Router();

// ===== QUESTION BANK ROUTES (Teacher) =====
// GET /api/questions - Get all questions (question bank) for current teacher
router.get('/questions', authenticate, authorize('teacher', 'admin'), questionController.getQuestions);

// POST /api/questions - Create new question
router.post(
  '/questions',
  authenticate,
  authorize('teacher', 'admin'),
  validateRequest({ body: createQuestionBodySchema }),
  questionController.createQuestion,
);

// GET /api/questions/:id - Get single question detail
router.get(
  '/questions/:id',
  authenticate,
  validateRequest({ params: questionIdParamSchema }),
  questionController.getQuestion,
);

// PUT /api/questions/:id - Update question
router.put(
  '/questions/:id',
  authenticate,
  authorize('teacher', 'admin'),
  validateRequest({ params: questionIdParamSchema, body: updateQuestionBodySchema }),
  questionController.updateQuestion,
);

// DELETE /api/questions/:id - Delete question
router.delete(
  '/questions/:id',
  authenticate,
  authorize('teacher', 'admin'),
  validateRequest({ params: questionIdParamSchema }),
  questionController.deleteQuestion,
);

// ===== QUIZ ROUTES (Student) =====
// GET /api/courses/:courseId/quizzes - Get all quizzes for a course
router.get(
  '/courses/:courseId/quizzes',
  authenticate,
  validateRequest({ params: courseIdParamSchema }),
  quizController.getQuizzesByCourse,
);

// GET /api/quizzes/:quizId - Get quiz detail with all questions
router.get(
  '/quizzes/:quizId',
  authenticate,
  validateRequest({ params: quizIdParamSchema }),
  quizController.getQuizDetail,
);

// POST /api/quizzes/:quizId/start - Start a new quiz attempt
router.post(
  '/quizzes/:quizId/start',
  authenticate,
  validateRequest({ params: quizIdParamSchema }),
  quizController.startQuizAttempt,
);

// GET /api/quizzes/:quizId/latest-attempt - Get latest quiz attempt
router.get(
  '/quizzes/:quizId/latest-attempt',
  authenticate,
  validateRequest({ params: quizIdParamSchema }),
  quizController.getLatestQuizAttempt,
);

// GET /api/quizzes/:quizId/attempts - Get all quiz attempts for student
router.get(
  '/quizzes/:quizId/attempts',
  authenticate,
  validateRequest({ params: quizIdParamSchema }),
  quizController.getStudentQuizAttempts,
);

// POST /api/quizzes/:quizId/save-answer - Auto-save answer
router.post(
  '/quizzes/:quizId/save-answer',
  authenticate,
  validateRequest({ params: quizIdParamSchema, body: saveQuizAnswerBodySchema }),
  quizController.saveQuizAnswer,
);

// POST /api/quizzes/:quizId/submit - Submit quiz
router.post(
  '/quizzes/:quizId/submit',
  authenticate,
  validateRequest({ params: quizIdParamSchema, body: submitQuizBodySchema }),
  quizController.submitQuiz,
);

// GET /api/quizzes/:quizId/score - Get best quiz score
router.get(
  '/quizzes/:quizId/score',
  authenticate,
  validateRequest({ params: quizIdParamSchema }),
  quizController.getQuizScore,
);

module.exports = router;
