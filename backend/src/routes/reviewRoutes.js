const express = require('express');
const reviewController = require('../controllers/reviewController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { validateRequest } = require('../middlewares/validationMiddleware');
const { createReviewBodySchema, courseIdParamSchema } = require('../validations/reviewValidation');

const router = express.Router();

// public: fetch reviews for a course
router.get('/course/:courseId', validateRequest({ params: courseIdParamSchema }), reviewController.getReviewsByCourse);

// authenticated: create review (students)
router.post('/', authenticate, validateRequest({ body: createReviewBodySchema }), reviewController.createReview);

module.exports = router;
