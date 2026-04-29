const express = require('express');
const chapterController = require('../controllers/chapterController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { validateRequest } = require('../middlewares/validationMiddleware');
const {
  chapterIdParamSchema,
  courseIdParamSchema,
  createChapterBodySchema,
  updateChapterBodySchema,
} = require('../validations/chapterValidation');

const router = express.Router();

// GET chapters for course: GET /chapters/course/:courseId
router.get(
  '/course/:courseId',
  authenticate,
  validateRequest({ params: courseIdParamSchema }),
  chapterController.getChapters,
);

// CREATE chapter: POST /chapters/course/:courseId
router.post(
  '/course/:courseId',
  authenticate,
  authorize('admin', 'teacher'),
  validateRequest({ params: courseIdParamSchema, body: createChapterBodySchema }),
  chapterController.createChapter,
);

// GET chapter detail: GET /chapters/:chapterId
router.get(
  '/:chapterId',
  authenticate,
  validateRequest({ params: chapterIdParamSchema }),
  chapterController.getChapterDetail,
);

// UPDATE chapter: PUT /chapters/:chapterId
router.put(
  '/:chapterId',
  authenticate,
  authorize('admin', 'teacher'),
  validateRequest({ params: chapterIdParamSchema, body: updateChapterBodySchema }),
  chapterController.updateChapter,
);

// DELETE chapter: DELETE /chapters/:chapterId
router.delete(
  '/:chapterId',
  authenticate,
  authorize('admin', 'teacher'),
  validateRequest({ params: chapterIdParamSchema }),
  chapterController.deleteChapter,
);

module.exports = router;
