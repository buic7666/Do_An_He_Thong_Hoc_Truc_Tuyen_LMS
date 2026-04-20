const express = require('express');
const enrollmentController = require('../controllers/enrollmentController');
const { authenticate } = require('../middlewares/authMiddleware');
const { validateRequest } = require('../middlewares/validationMiddleware');
const { createEnrollmentBodySchema } = require('../validations/enrollmentValidation');

const router = express.Router();

router.post('/', authenticate, validateRequest({ body: createEnrollmentBodySchema }), enrollmentController.enrollCourse);
router.get('/me', authenticate, enrollmentController.getMyEnrollments);

module.exports = router;