const express = require('express');

const authRoutes = require('./authRoutes');
const courseRoutes = require('./courseRoutes');
const chapterRoutes = require('./chapterRoutes');
const lessonRoutes = require('./lessonRoutes');
const enrollmentRoutes = require('./enrollmentRoutes');
const contactRoutes = require('./contactRoutes');
const teacherRoutes = require('./teacherRoutes');
const adminRoutes = require('./adminRoutes');
const questionRoutes = require('./questionRoutes');
const surveyRoutes = require('./surveyRoutes');
const quizRoutes = require('./quizRoutes');
const quizManagementRoutes = require('./quizManagementRoutes');
const youtubeRoutes = require('./youtubeRoutes');
const reviewRoutes = require('./reviewRoutes');
const commentRoutes = require('./commentRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/courses', courseRoutes);
router.use('/chapters', chapterRoutes);
router.use('/lessons', lessonRoutes);
router.use('/enrollments', enrollmentRoutes);
router.use('/contacts', contactRoutes);
router.use('/teachers', teacherRoutes);
router.use('/admin', adminRoutes);
router.use('/questions', questionRoutes);
router.use('/surveys', surveyRoutes);
router.use('/quiz-manager', quizManagementRoutes);
router.use('/youtube', youtubeRoutes);
router.use('/reviews', reviewRoutes);
router.use('/comments', commentRoutes);
router.use('/', quizRoutes);

module.exports = router;