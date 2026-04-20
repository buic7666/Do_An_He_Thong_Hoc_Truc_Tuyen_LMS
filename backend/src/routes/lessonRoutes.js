const express = require('express');
const lessonController = require('../controllers/lessonController');
const progressController = require('../controllers/progressController');
const lessonWatchPositionController = require('../controllers/lessonWatchPositionController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { validateRequest } = require('../middlewares/validationMiddleware');
const {
	lessonIdParamSchema,
	courseIdParamSchema,
	createLessonBodySchema,
} = require('../validations/lessonValidation');
const {
	lessonIdParamSchema: progressLessonIdParamSchema,
	watchPositionBodySchema,
} = require('../validations/progressValidation');

const router = express.Router();

router.get('/course/:courseId', authenticate, validateRequest({ params: courseIdParamSchema }), lessonController.getLessonsByCourse);
router.post(
	'/course/:courseId',
	authenticate,
	authorize('admin', 'teacher'),
	validateRequest({ params: courseIdParamSchema, body: createLessonBodySchema }),
	lessonController.createLesson,
);
router.get('/:id', authenticate, validateRequest({ params: lessonIdParamSchema }), lessonController.getLessonDetail);
router.post('/:id/progress', authenticate, validateRequest({ params: progressLessonIdParamSchema }), progressController.markLessonCompleted);
router.get(
	'/:id/watch-position',
	authenticate,
	validateRequest({ params: progressLessonIdParamSchema }),
	lessonWatchPositionController.getWatchPosition,
);
router.post(
	'/:id/watch-position',
	authenticate,
	validateRequest({ params: progressLessonIdParamSchema, body: watchPositionBodySchema }),
	lessonWatchPositionController.saveWatchPosition,
);

module.exports = router;