const express = require('express');
const commentController = require('../controllers/commentController');
const { authenticate } = require('../middlewares/authMiddleware');

const router = express.Router();

// GET comments by context (public - no auth needed)
router.get('/', commentController.getComments);

// POST create comment (authenticated)
router.post('/', authenticate, commentController.createComment);

// PUT update comment (authenticated, own comment only)
router.put('/:id', authenticate, commentController.updateComment);

// DELETE comment (authenticated, own comment or teacher/admin)
router.delete('/:id', authenticate, commentController.deleteComment);

module.exports = router;
