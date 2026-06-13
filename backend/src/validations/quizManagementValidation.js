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
    chapterId: z.coerce.number().int().positive(),
    lessonId: z.coerce.number().int().positive().optional(),

    title: z.string().trim().min(3).max(255),
    description: z.string().trim().max(2000).optional(),

    duration: z.coerce.number().int().min(1).optional(),
    passScore: z.coerce.number().int().min(0).max(100).optional(),
    maxAttempts: z.coerce.number().int().min(0).optional(),

    // Cách tạo quiz mới: giáo viên chọn câu hỏi trực tiếp
    questionIds: z
      .array(z.coerce.number().int().positive())
      .optional(),

    // Nếu có random câu hỏi
    randomize: z.boolean().optional(),
    randomCount: z.coerce.number().int().min(0).optional(),

    // Giữ lại để không làm hỏng flow quota cũ nếu còn dùng
    questionQuotas: z
      .object({
        multipleChoice: z.coerce.number().int().min(0).optional(),
        trueFalse: z.coerce.number().int().min(0).optional(),
        shortAnswer: z.coerce.number().int().min(0).optional(),
        essay: z.coerce.number().int().min(0).optional(),
      })
      .optional(),
  })
  .strict();

const updateQuizBodySchema = z
  .object({
    title: z.string().trim().min(3).max(255).optional(),
    description: z.string().trim().max(2000).optional(),
    duration: z.coerce.number().int().min(1).optional(),
    passScore: z.coerce.number().int().min(0).max(100).optional(),
    maxAttempts: z.coerce.number().int().min(0).optional(),

    questionIds: z
      .array(z.coerce.number().int().positive())
      .optional(),

    randomize: z.boolean().optional(),
    randomCount: z.coerce.number().int().min(0).optional(),
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