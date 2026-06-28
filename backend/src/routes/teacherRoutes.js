const express = require('express');
const teacherController = require('../controllers/teacherController');
const teacherProfileController = require('../controllers/teacherProfileController');
const teacherQuestionController = require('../controllers/teacherQuestionController');
const teacherInteractionController = require('../controllers/teacherInteractionController');
const teacherUploadController = require('../controllers/teacherUploadController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { uploadSingleFile } = require('../middlewares/uploadMiddleware');
const { validateRequest } = require('../middlewares/validationMiddleware');
const {
  teacherProfileBodySchema,
  teacherQuestionBodySchema,
  idParamSchema,
  replyBodySchema,
  studentMessageBodySchema,
} = require('../validations/teacherValidation');

const router = express.Router();

router.get('/dashboard', authenticate, authorize('teacher', 'admin'), teacherController.getDashboardOverview);

router.get(
  '/courses/:courseId/lessons',
  authenticate,
  authorize('teacher', 'admin'),
  teacherController.getMyCourseLessons,
);

router.get('/courses', authenticate, authorize('teacher', 'admin'), teacherController.getMyCourses);

router.get('/profile', authenticate, authorize('teacher', 'admin'), teacherProfileController.getProfile);

router.put(
  '/profile',
  authenticate,
  authorize('teacher', 'admin'),
  validateRequest({ body: teacherProfileBodySchema }),
  teacherProfileController.updateProfile,
);

router.get('/questions', authenticate, authorize('teacher', 'admin'), teacherQuestionController.getQuestions);

router.post(
  '/questions',
  authenticate,
  authorize('teacher', 'admin'),
  validateRequest({ body: teacherQuestionBodySchema }),
  teacherQuestionController.createQuestion,
);

router.put(
  '/questions/:id',
  authenticate,
  authorize('teacher', 'admin'),
  validateRequest({ params: idParamSchema, body: teacherQuestionBodySchema }),
  teacherQuestionController.updateQuestion,
);

router.delete(
  '/questions/:id',
  authenticate,
  authorize('teacher', 'admin'),
  validateRequest({ params: idParamSchema }),
  teacherQuestionController.deleteQuestion,
);

router.get('/interactions', authenticate, authorize('teacher', 'admin'), teacherInteractionController.getInteractions);

router.post(
  '/interactions/messages',
  authenticate,
  authorize('teacher', 'admin'),
  validateRequest({ body: studentMessageBodySchema }),
  teacherInteractionController.sendStudentMessage,
);

router.post(
  '/interactions/:id/reply',
  authenticate,
  authorize('teacher', 'admin'),
  validateRequest({ params: idParamSchema, body: replyBodySchema }),
  teacherInteractionController.replyInteraction,
);

router.post('/upload', authenticate, authorize('teacher', 'admin'), uploadSingleFile, teacherUploadController.uploadTeacherAsset);

module.exports = router;
