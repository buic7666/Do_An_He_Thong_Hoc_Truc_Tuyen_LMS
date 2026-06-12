const { z } = require('zod');

const surveyIdParamSchema = z.object({ id: z.coerce.number().int().positive() });

const createSurveyBodySchema = z.object({
  title: z.string().trim().min(3).max(255),
  description: z.string().trim().max(4000).optional().default(''),
  isAnonymous: z.boolean().optional().default(true),
  isPublished: z.boolean().optional().default(false),
  courseId: z.coerce.number().int().positive().optional(),
  chapterId: z.coerce.number().int().positive().optional(),
  questions: z.array(z.object({
    type: z.enum(['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_TEXT']),
    questionText: z.string().trim().min(3).max(2000),
    options: z.array(z.string().trim().min(1)).optional(),
    orderIndex: z.coerce.number().int().min(0).optional(),
  })).min(1),
}).strict();

const submitSurveyBodySchema = z.object({
  answers: z.record(z.string(), z.any()),
});

module.exports = {
  surveyIdParamSchema,
  createSurveyBodySchema,
  submitSurveyBodySchema,
};
