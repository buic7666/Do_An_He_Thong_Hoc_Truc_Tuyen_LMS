const { z } = require('zod');

const questionIdParamSchema = z
  .object({
    id: z.coerce.number().int().positive(),
  })
  .strict();

const lectureIdParamSchema = z
  .object({
    lectureId: z.coerce.number().int().positive(),
  })
  .strict();

const createQuestionBodySchema = z
  .object({
    questionText: z.string().trim().min(5).max(2000),
    options: z.array(z.string().trim().min(1)).min(2).max(10),
    correctIndex: z.coerce.number().int().min(0),
    explanation: z.string().trim().max(2000).optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
    lectureId: z.coerce.number().int().positive().optional(),
  })
  .strict();

const updateQuestionBodySchema = z
  .object({
    questionText: z.string().trim().min(5).max(2000).optional(),
    options: z.array(z.string().trim().min(1)).min(2).max(10).optional(),
    correctIndex: z.coerce.number().int().min(0).optional(),
    explanation: z.string().trim().max(2000).optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
    lectureId: z.coerce.number().int().positive().optional(),
  })
  .strict();

module.exports = {
  questionIdParamSchema,
  lectureIdParamSchema,
  createQuestionBodySchema,
  updateQuestionBodySchema,
};
