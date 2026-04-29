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
	updateLessonBodySchema,
	segmentIdParamSchema,
	createLessonSegmentBodySchema,
	updateLessonSegmentBodySchema,
	bulkCreateLessonSegmentsBodySchema,
} = require('../validations/lessonValidation');
const {
	lessonIdParamSchema: progressLessonIdParamSchema,
	watchPositionBodySchema,
} = require('../validations/progressValidation');

const router = express.Router();

// Specific routes first, then generic routes
router.get('/course/:courseId', authenticate, validateRequest({ params: courseIdParamSchema }), lessonController.getLessonsByCourse);
router.post(
	'/course/:courseId',
	authenticate,
	authorize('admin', 'teacher'),
	validateRequest({ params: courseIdParamSchema, body: createLessonBodySchema }),
	lessonController.createLesson,
);

// Segment-specific routes (must come before /:id routes)
router.get('/:id/segments', authenticate, validateRequest({ params: lessonIdParamSchema }), lessonController.getLessonSegments);
router.post(
	'/:id/segments',
	authenticate,
	authorize('admin', 'teacher'),
	validateRequest({ params: lessonIdParamSchema, body: createLessonSegmentBodySchema }),
	lessonController.createLessonSegment,
);
router.post(
	'/:id/segments/bulk',
	authenticate,
	authorize('admin', 'teacher'),
	validateRequest({ params: lessonIdParamSchema, body: bulkCreateLessonSegmentsBodySchema }),
	lessonController.createLessonSegmentsBulk,
);
router.put(
	'/segments/:segmentId',
	authenticate,
	authorize('admin', 'teacher'),
	validateRequest({ params: segmentIdParamSchema, body: updateLessonSegmentBodySchema }),
	lessonController.updateLessonSegment,
);
router.delete(
	'/segments/:segmentId',
	authenticate,
	authorize('admin', 'teacher'),
	validateRequest({ params: segmentIdParamSchema }),
	lessonController.deleteLessonSegment,
);

// Generic /:id routes (must come last)
router.get('/:id', authenticate, validateRequest({ params: lessonIdParamSchema }), lessonController.getLessonDetail);
router.put(
	'/:id',
	authenticate,
	authorize('admin', 'teacher'),
	validateRequest({ params: lessonIdParamSchema, body: updateLessonBodySchema }),
	lessonController.updateLesson,
);
router.delete(
	'/:id',
	authenticate,
	authorize('admin', 'teacher'),
	validateRequest({ params: lessonIdParamSchema }),
	lessonController.deleteLesson,
);

// Progress and watch position routes
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
