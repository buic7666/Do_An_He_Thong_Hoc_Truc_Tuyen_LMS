const { z } = require('zod');

const createCommentSchema = z.object({
  courseId: z.number().int().positive('courseId must be a positive integer'),
  lessonId: z.number().int().positive('lessonId must be a positive integer').optional().nullable(),
  chapterId: z.number().int().positive('chapterId must be a positive integer').optional().nullable(),
  content: z.string().min(1, 'content is required').max(5000, 'content must not exceed 5000 characters'),
  parentCommentId: z.number().int().positive('parentCommentId must be a positive integer').optional().nullable(),
});

const updateCommentSchema = z.object({
  content: z.string().min(1, 'content is required').max(5000, 'content must not exceed 5000 characters'),
});

module.exports = {
  createCommentSchema,
  updateCommentSchema,
};
