const { z } = require('zod');

const idParamSchema = z
  .object({
    id: z.coerce.number().int().positive(),
  })
  .strict();

const courseIdParamSchema = z
  .object({
    courseId: z.coerce.number().int().positive(),
  })
  .strict();

const createCourseBodySchema = z
  .object({
    title: z.string().trim().min(3).max(255),
    description: z.string().trim().max(4000).optional().default(''),
    price: z.coerce.number().min(0).optional().default(0),
    instructorId: z.coerce.number().int().positive().optional(),
  })
  .strict();

module.exports = {
  idParamSchema,
  courseIdParamSchema,
  createCourseBodySchema,
};
