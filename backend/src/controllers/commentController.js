const { CommentService } = require('../services/commentService');
const { createCommentSchema, updateCommentSchema } = require('../validations/commentValidation');

class CommentController {
  async getComments(req, res) {
    try {
      const { courseId, lessonId, chapterId } = req.query;
      const courseIdNum = parseInt(courseId, 10);
      const lessonIdNum = lessonId ? parseInt(lessonId, 10) : null;
      const chapterIdNum = chapterId ? parseInt(chapterId, 10) : null;

      if (isNaN(courseIdNum)) {
        return res.status(400).json({ error: 'courseId is required and must be a number' });
      }

      const comments = await CommentService.getCommentsByContext(courseIdNum, lessonIdNum, chapterIdNum);
      res.status(200).json(comments);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async createComment(req, res) {
    try {
      const { courseId, lessonId, chapterId, content, parentCommentId } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Validate input
      const validationData = {
        courseId,
        lessonId,
        chapterId,
        content,
        parentCommentId,
      };

      const validated = createCommentSchema.parse(validationData);

      // Create comment
      const comment = await CommentService.createComment({
        ...validated,
        userId,
      });

      res.status(201).json(comment);
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  }

  async updateComment(req, res) {
    try {
      const { id } = req.params;
      const { content } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Validate input
      const validated = updateCommentSchema.parse({ content });

      // Check ownership
      const comment = await Comment.findByPk(id);
      if (!comment) {
        return res.status(404).json({ error: 'Comment not found' });
      }
      if (comment.userId !== userId) {
        return res.status(403).json({ error: 'You can only edit your own comments' });
      }

      const updated = await CommentService.updateComment(id, validated);
      res.status(200).json(updated);
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  }

  async deleteComment(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Check ownership (or admin/teacher)
      const comment = await Comment.findByPk(id);
      if (!comment) {
        return res.status(404).json({ error: 'Comment not found' });
      }
      if (comment.userId !== userId && req.user?.role !== 'teacher' && req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'You do not have permission to delete this comment' });
      }

      await CommentService.deleteComment(id);
      res.status(200).json({ message: 'Comment deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

const Comment = require('../models/comment.model');

module.exports = new CommentController();
