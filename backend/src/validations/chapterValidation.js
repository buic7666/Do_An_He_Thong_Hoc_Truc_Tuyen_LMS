const { z } = require('zod');

const chapterIdParamSchema = z
  .object({
    chapterId: z.coerce.number().int().positive(),
  })
  .strict();

const courseIdParamSchema = z
  .object({
    courseId: z.coerce.number().int().positive(),
  })
  .strict();

const createChapterBodySchema = z
  .object({
    title: z.string().trim().min(3).max(255),
    description: z.string().trim().max(2000).optional(),
    orderIndex: z.coerce.number().int().min(0).optional(),
  })
  .strict();

const updateChapterBodySchema = z
  .object({
    title: z.string().trim().min(3).max(255).optional(),
    description: z.string().trim().max(2000).optional(),
    orderIndex: z.coerce.number().int().min(0).optional(),
  })
  .strict();

module.exports = {
  chapterIdParamSchema,
  courseIdParamSchema,
  createChapterBodySchema,
  updateChapterBodySchema,
};
