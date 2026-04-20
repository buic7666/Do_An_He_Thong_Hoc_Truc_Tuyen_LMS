const { z } = require('zod');

const createEnrollmentBodySchema = z
  .object({
    courseId: z.coerce.number().int().positive(),
  })
  .strict();

module.exports = {
  createEnrollmentBodySchema,
};
