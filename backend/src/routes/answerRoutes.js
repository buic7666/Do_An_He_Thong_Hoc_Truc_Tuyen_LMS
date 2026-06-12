const express = require('express');
const { authenticate } = require('../middlewares/authMiddleware');
const answerController = require('../controllers/answerController');

const router = express.Router();

// POST /api/answers/:answerId/grade
router.post('/:answerId/grade', authenticate, answerController.gradeAnswerNow);

module.exports = router;
