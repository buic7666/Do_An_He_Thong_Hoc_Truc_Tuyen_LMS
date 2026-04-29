const express = require('express');
const quizManagerController = require('../controllers/quizManagerController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { validateRequest } = require('../middlewares/validationMiddleware');
const {
  quizIdParamSchema,
  questionIdParamSchema,
  createQuizBodySchema,
  updateQuizBodySchema,
  addQuestionToQuizBodySchema,
} = require('../validations/quizManagementValidation');

const router = express.Router();

// GET all quizzes by teacher: GET /quizzes/my-quizzes
router.get(
  '/my-quizzes',
  authenticate,
  authorize('admin', 'teacher'),
  quizManagerController.getTeacherQuizzes,
);

// CREATE quiz: POST /quizzes
router.post(
  '/',
  authenticate,
  authorize('admin', 'teacher'),
  validateRequest({ body: createQuizBodySchema }),
  quizManagerController.createQuiz,
);

// GET quiz detail: GET /quizzes/:quizId
router.get(
  '/:quizId',
  authenticate,
  validateRequest({ params: quizIdParamSchema }),
  quizManagerController.getQuizDetail,
);

// UPDATE quiz: PUT /quizzes/:quizId
router.put(
  '/:quizId',
  authenticate,
  authorize('admin', 'teacher'),
  validateRequest({ params: quizIdParamSchema, body: updateQuizBodySchema }),
  quizManagerController.updateQuiz,
);

// PUBLISH quiz: POST /quizzes/:quizId/publish
router.post(
  '/:quizId/publish',
  authenticate,
  authorize('admin', 'teacher'),
  validateRequest({ params: quizIdParamSchema }),
  quizManagerController.publishQuiz,
);

// DELETE quiz: DELETE /quizzes/:quizId
router.delete(
  '/:quizId',
  authenticate,
  authorize('admin', 'teacher'),
  validateRequest({ params: quizIdParamSchema }),
  quizManagerController.deleteQuiz,
);

// ADD question to quiz: POST /quizzes/:quizId/questions/:questionId
router.post(
  '/:quizId/questions/:questionId',
  authenticate,
  authorize('admin', 'teacher'),
  validateRequest({ 
    params: quizIdParamSchema.merge(questionIdParamSchema),
    body: addQuestionToQuizBodySchema 
  }),
  quizManagerController.addQuestionToQuiz,
);

// REMOVE question from quiz: DELETE /quizzes/:quizId/questions/:questionId
router.delete(
  '/:quizId/questions/:questionId',
  authenticate,
  authorize('admin', 'teacher'),
  validateRequest({ 
    params: quizIdParamSchema.merge(questionIdParamSchema)
  }),
  quizManagerController.removeQuestionFromQuiz,
);

module.exports = router;
