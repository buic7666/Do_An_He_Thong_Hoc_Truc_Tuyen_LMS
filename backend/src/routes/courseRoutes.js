const express = require('express');
const courseController = require('../controllers/courseController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { validateRequest } = require('../middlewares/validationMiddleware');
const { idParamSchema, courseIdParamSchema, createCourseBodySchema } = require('../validations/courseValidation');

const router = express.Router();

router.get('/', courseController.getAllCourses);
router.post('/', authenticate, authorize('admin', 'teacher'), validateRequest({ body: createCourseBodySchema }), courseController.createCourse);
router.get('/:id/lessons', validateRequest({ params: idParamSchema }), courseController.getLessonsByCourse);
router.get('/:courseId/progress', authenticate, validateRequest({ params: courseIdParamSchema }), courseController.getCourseProgress);
router.delete('/:id', authenticate, authorize('admin', 'teacher'), validateRequest({ params: idParamSchema }), courseController.deleteCourse);
router.get('/:id', validateRequest({ params: idParamSchema }), courseController.getCourseDetail);

module.exports = router;