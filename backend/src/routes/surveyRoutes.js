const express = require('express');
const surveyController = require('../controllers/surveyController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { validateRequest } = require('../middlewares/validationMiddleware');
const { createSurveyBodySchema, surveyIdParamSchema, submitSurveyBodySchema } = require('../validations/surveyValidation');

const router = express.Router();

router.post('/', authenticate, authorize('admin', 'teacher'), validateRequest({ body: createSurveyBodySchema }), surveyController.createSurvey);
router.get('/course/:courseId', authenticate, surveyController.getSurveysByCourse);
// Public: get survey responses (read-only public feedback)
router.get('/:id/responses', validateRequest({ params: surveyIdParamSchema }), surveyController.getSurveyResponses);

router.get('/:id', authenticate, validateRequest({ params: surveyIdParamSchema }), surveyController.getSurveyDetail);
router.post('/:id/responses', authenticate, validateRequest({ params: surveyIdParamSchema, body: submitSurveyBodySchema }), surveyController.submitSurveyResponse);

module.exports = router;
