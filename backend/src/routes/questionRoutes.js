const express = require('express');
const questionController = require('../controllers/questionController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { validateRequest } = require('../middlewares/validationMiddleware');
const {
  questionIdParamSchema,
  lectureIdParamSchema,
  createQuestionBodySchema,
  updateQuestionBodySchema,
} = require('../validations/questionValidation');

const router = express.Router();

// GET all questions by creator: GET /questions
router.get(
  '/',
  authenticate,
  questionController.getQuestions,
);

// GET questions by lecture: GET /questions/lecture/:lectureId
router.get(
  '/lecture/:lectureId',
  authenticate,
  validateRequest({ params: lectureIdParamSchema }),
  questionController.getQuestionsByLecture,
);

// CREATE question: POST /questions
router.post(
  '/',
  authenticate,
  authorize('admin', 'teacher'),
  validateRequest({ body: createQuestionBodySchema }),
  questionController.createQuestion,
);

// GET question detail: GET /questions/:id
router.get(
  '/:id',
  authenticate,
  validateRequest({ params: questionIdParamSchema }),
  questionController.getQuestion,
);

// UPDATE question: PUT /questions/:id
router.put(
  '/:id',
  authenticate,
  authorize('admin', 'teacher'),
  validateRequest({ params: questionIdParamSchema, body: updateQuestionBodySchema }),
  questionController.updateQuestion,
);

// DELETE question: DELETE /questions/:id
router.delete(
  '/:id',
  authenticate,
  authorize('admin', 'teacher'),
  validateRequest({ params: questionIdParamSchema }),
  questionController.deleteQuestion,
);

module.exports = router;
