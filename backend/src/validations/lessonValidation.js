const { z } = require('zod');

const lessonIdParamSchema = z
  .object({
    id: z.coerce.number().int().positive(),
  })
  .strict();

const courseIdParamSchema = z
  .object({
    courseId: z.coerce.number().int().positive(),
  })
  .strict();

const createLessonBodySchema = z
  .object({
    title: z.string().trim().min(3).max(255),
    videoUrl: z.string().trim().url().max(255).optional(),
    content: z.string().trim().max(10000).optional(),
    orderIndex: z.coerce.number().int().positive(),
  })
  .strict();

module.exports = {
  lessonIdParamSchema,
  courseIdParamSchema,
  createLessonBodySchema,
};
