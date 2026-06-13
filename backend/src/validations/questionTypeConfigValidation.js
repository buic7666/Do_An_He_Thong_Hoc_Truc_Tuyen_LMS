const { z } = require('zod');

const questionTypeCodeParamSchema = z
  .object({
    code: z.string().trim().min(2).max(50),
  })
  .strict();

const updateQuestionTypeBodySchema = z
  .object({
    label: z.string().trim().min(1).max(255).optional(),
    description: z.string().trim().max(2000).optional(),
    isEnabled: z.boolean().optional(),

    gradingConfig: z
      .object({
        externalApiEnabled: z.boolean().optional(),
        externalApiUrl: z.string().trim().max(1000).optional(),
        externalApiToken: z.string().trim().max(1000).optional(),
        timeoutMs: z.coerce.number().int().min(1000).max(120000).optional(),
        scoreField: z.string().trim().max(100).optional(),
        feedbackField: z.string().trim().max(100).optional(),
      })
      .optional(),
  })
  .strict();

module.exports = {
  questionTypeCodeParamSchema,
  updateQuestionTypeBodySchema,
};