const express = require('express');

const authRoutes = require('./authRoutes');
const courseRoutes = require('./courseRoutes');
const lessonRoutes = require('./lessonRoutes');
const enrollmentRoutes = require('./enrollmentRoutes');
const contactRoutes = require('./contactRoutes');
const teacherRoutes = require('./teacherRoutes');
const adminRoutes = require('./adminRoutes');
const quizRoutes = require('./quizRoutes');
const youtubeRoutes = require('./youtubeRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/courses', courseRoutes);
router.use('/lessons', lessonRoutes);
router.use('/enrollments', enrollmentRoutes);
router.use('/contacts', contactRoutes);
router.use('/teachers', teacherRoutes);
router.use('/admin', adminRoutes);
router.use('/youtube', youtubeRoutes);
router.use('/', quizRoutes);

module.exports = router;