const { z } = require('zod');

const lessonIdParamSchema = z
  .object({
    id: z.coerce.number().int().positive(),
  })
  .strict();

const watchPositionBodySchema = z
  .object({
    positionSeconds: z.coerce.number().min(0),
  })
  .strict();

module.exports = {
  lessonIdParamSchema,
  watchPositionBodySchema,
};
