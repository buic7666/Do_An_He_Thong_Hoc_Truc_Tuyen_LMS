const { z } = require('zod');

const createReviewBodySchema = z.object({
  courseId: z.coerce.number().int().positive(),
  chapterId: z.coerce.number().int().positive().optional(),
  lessonId: z.coerce.number().int().positive().optional(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(2000).optional().nullable(),
});

const courseIdParamSchema = z.object({ courseId: z.coerce.number().int().positive() });

module.exports = {
  createReviewBodySchema,
  courseIdParamSchema,
};
