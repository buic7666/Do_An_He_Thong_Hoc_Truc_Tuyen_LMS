const { z } = require('zod');

const quizIdParamSchema = z
  .object({
    quizId: z.coerce.number().int().positive(),
  })
  .strict();

const questionIdParamSchema = z
  .object({
    questionId: z.coerce.number().int().positive(),
  })
  .strict();

const createQuizBodySchema = z
  .object({
    courseId: z.coerce.number().int().positive(),
    chapterId: z.coerce.number().int().positive().optional(),
    lessonId: z.coerce.number().int().positive().optional(),
    title: z.string().trim().min(3).max(255),
    description: z.string().trim().max(2000).optional(),
    duration: z.coerce.number().int().min(1).optional(),
    passScore: z.coerce.number().int().min(0).max(100).optional(),
    maxAttempts: z.coerce.number().int().min(1).optional(),
  })
  .strict();

const updateQuizBodySchema = z
  .object({
    title: z.string().trim().min(3).max(255).optional(),
    description: z.string().trim().max(2000).optional(),
    duration: z.coerce.number().int().min(1).optional(),
    passScore: z.coerce.number().int().min(0).max(100).optional(),
    maxAttempts: z.coerce.number().int().min(1).optional(),
  })
  .strict();

const addQuestionToQuizBodySchema = z
  .object({
    order: z.coerce.number().int().min(0).optional(),
    points: z.coerce.number().int().min(1).optional(),
  })
  .strict();

module.exports = {
  quizIdParamSchema,
  questionIdParamSchema,
  createQuizBodySchema,
  updateQuizBodySchema,
  addQuestionToQuizBodySchema,
};
