const express = require('express');
const questionTypeConfigController = require('../controllers/questionTypeConfigController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { validateRequest } = require('../middlewares/validationMiddleware');
const {
  questionTypeCodeParamSchema,
  updateQuestionTypeBodySchema,
} = require('../validations/questionTypeConfigValidation');

const router = express.Router();

router.get(
  '/',
  authenticate,
  authorize('admin'),
  questionTypeConfigController.getQuestionTypes,
);

router.get(
  '/:code',
  authenticate,
  authorize('admin'),
  validateRequest({ params: questionTypeCodeParamSchema }),
  questionTypeConfigController.getQuestionTypeByCode,
);

router.put(
  '/:code',
  authenticate,
  authorize('admin'),
  validateRequest({
    params: questionTypeCodeParamSchema,
    body: updateQuestionTypeBodySchema,
  }),
  questionTypeConfigController.updateQuestionType,
);

module.exports = router;