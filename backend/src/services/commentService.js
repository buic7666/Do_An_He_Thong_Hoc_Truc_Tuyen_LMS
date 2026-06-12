const { Op } = require('sequelize');
const Comment = require('../models/comment.model');
const User = require('../models/user.model');

const parseId = (val) => {
  const num = parseInt(val, 10);
  return isNaN(num) ? null : num;
};

class CommentService {
  // Get comments for a specific lesson/chapter/course
  async getCommentsByContext(courseId, lessonId = null, chapterId = null) {
    try {
      // Fetch all comments for the context (including replies) and build a nested tree.
      const where = { courseId };
      if (lessonId) where.lessonId = lessonId;
      // If a chapterId is provided, include comments that are either for that chapter OR general lesson-level
      if (chapterId !== null && chapterId !== undefined) {
        where[Op.or] = [
          { chapterId: chapterId },
          { chapterId: null },
        ];
      }

      const allComments = await Comment.findAll({
        where,
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'name', 'email', 'role'],
          },
        ],
        order: [['createdAt', 'ASC']],
      });

      // Build map of id -> comment object with replies array
      const map = {};
      allComments.forEach((c) => {
        map[c.id] = { ...c.get(), replies: [] };
      });

      // Attach children to their parents; collect root (top-level) comments
      const roots = [];
      Object.values(map).forEach((c) => {
        if (c.parentCommentId && map[c.parentCommentId]) {
          map[c.parentCommentId].replies.push(c);
        } else if (!c.parentCommentId) {
          roots.push(c);
        }
      });

      // Sort roots by createdAt descending to preserve previous behavior
      roots.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return roots;
    } catch (error) {
      throw new Error(`Failed to fetch comments: ${error.message}`);
    }
  }

  // Create a new comment or reply
  async createComment(data) {
    try {
      const comment = await Comment.create(data);
      const commentWithAuthor = await Comment.findByPk(comment.id, {
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'name', 'email'],
          },
        ],
      });
      return commentWithAuthor;
    } catch (error) {
      throw new Error(`Failed to create comment: ${error.message}`);
    }
  }

  // Update a comment
  async updateComment(commentId, data) {
    try {
      const comment = await Comment.findByPk(commentId);
      if (!comment) {
        throw new Error('Comment not found');
      }
      await comment.update(data);
      return comment;
    } catch (error) {
      throw new Error(`Failed to update comment: ${error.message}`);
    }
  }

  // Delete a comment and its replies
  async deleteComment(commentId) {
    try {
      const comment = await Comment.findByPk(commentId);
      if (!comment) {
        throw new Error('Comment not found');
      }
      // Delete all replies
      await Comment.destroy({
        where: { parentCommentId: commentId },
      });
      // Delete the comment
      await comment.destroy();
      return true;
    } catch (error) {
      throw new Error(`Failed to delete comment: ${error.message}`);
    }
  }
}

// Setup associations after all models are loaded
const setupCommentAssociations = () => {
  Comment.belongsTo(User, {
    foreignKey: 'userId',
    as: 'author',
  });
};

module.exports = {
  CommentService: new CommentService(),
  setupCommentAssociations,
};
