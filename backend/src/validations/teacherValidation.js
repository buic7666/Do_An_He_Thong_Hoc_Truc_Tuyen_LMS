const { z } = require('zod');

const teacherProfileBodySchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  title: z.string().trim().max(200).optional().default(''),
  bio: z.string().trim().max(5000).optional().default(''),
  linkedin: z.string().trim().max(255).optional().default(''),
  facebook: z.string().trim().max(255).optional().default(''),
  bankName: z.string().trim().max(255).optional().default(''),
  bankAccount: z.string().trim().max(80).optional().default(''),
  bankOwner: z.string().trim().max(255).optional().default(''),
  avatarUrl: z.string().trim().max(500).optional().default(''),
});

const teacherQuestionBodySchema = z
  .object({
    testName: z.string().trim().min(2).max(255),
    duration: z.coerce.number().int().min(1).max(360),
    passScore: z.coerce.number().int().min(0).max(100),
    content: z.string().trim().min(5).max(5000),
    options: z.array(z.string().trim().min(1).max(500)).min(2).max(10),
    correctIndex: z.coerce.number().int().min(0).max(9),
  })
  .superRefine((value, context) => {
    if (value.correctIndex >= value.options.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'correctIndex must be less than options length',
        path: ['correctIndex'],
      });
    }
  });

const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const replyBodySchema = z.object({
  reply: z.string().trim().min(1).max(5000),
});

module.exports = {
  teacherProfileBodySchema,
  teacherQuestionBodySchema,
  idParamSchema,
  replyBodySchema,
};
