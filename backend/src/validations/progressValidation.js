const { z } = require('zod');

const lessonIdParamSchema = z
  .object({
    id: z.coerce.number().int().positive(),
  })
  .strict();

const watchPositionBodySchema = z
  .object({
    positionSeconds: z.coerce.number().min(0),
    studyState: z.record(z.string(), z.any()).optional(),
  })
  .strict();

module.exports = {
  lessonIdParamSchema,
  watchPositionBodySchema,
};
