const { z } = require('zod');

/**
 * ============================================================
 * VALIDATION SCHEMAS - Hỗ trợ 4 loại câu hỏi
 * ============================================================
 */

// ===== PARAM SCHEMAS =====
const questionIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const lectureIdParamSchema = z.object({
  lectureId: z.coerce.number().int().positive(),
});

const courseIdParamSchema = z.object({
  courseId: z.coerce.number().int().positive(),
});

const richContentBlockSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('text'),
    text: z.string().trim().min(1).max(5000),
  }),
  z.object({
    type: z.literal('image'),
    url: z.string().trim().url().max(1000),
    alt: z.string().trim().max(255).optional().default(''),
  }),
  z.object({
    type: z.literal('video'),
    url: z.string().trim().url().max(1000),
    title: z.string().trim().max(255).optional().default(''),
  }),
]);

const richContentSchema = z.object({
  blocks: z.array(richContentBlockSchema).min(1).max(50),
});

// ===== SHARED SCHEMAS =====
// ===== MULTIPLE_CHOICE SCHEMA =====
const createMultipleChoiceQuestionSchema = z.object({
  type: z.literal('MULTIPLE_CHOICE'),
  content: z.string().trim().min(10).max(2000),
  contentBlocks: z.array(richContentBlockSchema).min(1).max(50).optional(),
  options: z.array(z.string().trim().min(1).max(500)).min(2).max(10),
  optionsRich: z.array(z.array(richContentBlockSchema).min(1).max(20)).min(2).max(10).optional(),
  correctIndices: z.array(z.number().int().min(0).max(9)).min(1),
  explanation: z.string().trim().max(2000).optional(),
  courseId: z.coerce.number().int().positive().optional(),
  chapterId: z.coerce.number().int().positive().optional(),
  lectureId: z.coerce.number().int().positive().optional(),
  parentQuestionId: z.coerce.number().int().positive().optional().nullable(),
  orderIndex: z.coerce.number().int().min(1).optional(),
  segmentId: z.coerce.number().int().positive().optional(),
  isPublished: z.boolean().optional().default(false),
});

// ===== TRUE_FALSE SCHEMA =====
const createTrueFalseQuestionSchema = z.object({
  type: z.literal('TRUE_FALSE'),
  content: z.string().trim().min(10).max(2000),
  contentBlocks: z.array(richContentBlockSchema).min(1).max(50).optional(),
  correctAnswer: z.boolean(),
  explanation: z.string().trim().max(2000).optional(),
  courseId: z.coerce.number().int().positive().optional(),
  chapterId: z.coerce.number().int().positive().optional(),
  lectureId: z.coerce.number().int().positive().optional(),
  parentQuestionId: z.coerce.number().int().positive().optional().nullable(),
  orderIndex: z.coerce.number().int().min(1).optional(),
  segmentId: z.coerce.number().int().positive().optional(),
  isPublished: z.boolean().optional().default(false),
});

// ===== SHORT_ANSWER SCHEMA =====
const createShortAnswerQuestionSchema = z.object({
  type: z.literal('SHORT_ANSWER'),
  content: z.string().trim().min(10).max(2000),
  contentBlocks: z.array(richContentBlockSchema).min(1).max(50).optional(),
  acceptedAnswers: z.array(z.string().trim().min(1).max(500)).min(1),
  caseSensitive: z.boolean().optional().default(false),
  fuzzyMatch: z.boolean().optional().default(true),
  explanation: z.string().trim().max(2000).optional(),
  courseId: z.coerce.number().int().positive().optional(),
  chapterId: z.coerce.number().int().positive().optional(),
  lectureId: z.coerce.number().int().positive().optional(),
  parentQuestionId: z.coerce.number().int().positive().optional().nullable(),
  orderIndex: z.coerce.number().int().min(1).optional(),
  segmentId: z.coerce.number().int().positive().optional(),
  isPublished: z.boolean().optional().default(false),
});

// ===== ESSAY SCHEMA =====
const rubricItemSchema = z.object({
  name: z.string().trim().min(3).max(100),
  weight: z.number().min(0).max(100),
  description: z.string().trim().min(10).max(1000),
});

const createEssayQuestionSchema = z.object({
  type: z.literal('ESSAY'),
  content: z.string().trim().min(10).max(2000),
  contentBlocks: z.array(richContentBlockSchema).min(1).max(50).optional(),
  instructions: z.string().trim().max(2000),
  instructionsBlocks: z.array(richContentBlockSchema).min(1).max(50).optional(),
  rubric: z.array(rubricItemSchema).min(1).max(10),
  wordLimit: z.object({
    min: z.number().int().min(0).optional().default(0),
    max: z.number().int().min(1).optional().default(5000),
  }).optional(),
  aiModel: z.enum(['gpt-4', 'gpt-3.5-turbo', 'gpt-4o']).optional().default('gpt-3.5-turbo'),
  gradingMethod: z.enum(['manual', 'ai', 'external_api']).optional().default('ai'),
  externalApiUrl: z.string().trim().url().max(2000).optional().nullable(),
  externalApiAuthHeader: z.string().trim().max(2000).optional().nullable(),
  courseId: z.coerce.number().int().positive().optional(),
  chapterId: z.coerce.number().int().positive().optional(),
  lectureId: z.coerce.number().int().positive().optional(),
  parentQuestionId: z.coerce.number().int().positive().optional().nullable(),
  orderIndex: z.coerce.number().int().min(1).optional(),
  segmentId: z.coerce.number().int().positive().optional(),
  isPublished: z.boolean().optional().default(false),
});

const createClozeQuestionSchema = z.object({
  type: z.literal('CLOZE'),
  content: z.string().trim().min(10).max(10000),
  contentBlocks: z.array(richContentBlockSchema).min(1).max(50).optional(),
  metadata: z.any().optional(),
  courseId: z.coerce.number().int().positive().optional(),
  chapterId: z.coerce.number().int().positive().optional(),
  lectureId: z.coerce.number().int().positive().optional(),
  parentQuestionId: z.coerce.number().int().positive().optional().nullable(),
  orderIndex: z.coerce.number().int().min(1).optional(),
  segmentId: z.coerce.number().int().positive().optional(),
  isPublished: z.boolean().optional().default(false),
});

// ===== UNION SCHEMA =====
const createQuestionBodySchema = z.discriminatedUnion('type', [
  createMultipleChoiceQuestionSchema,
  createTrueFalseQuestionSchema,
  createShortAnswerQuestionSchema,
  createEssayQuestionSchema,
  createClozeQuestionSchema,
]);

const updateQuestionBodySchema = z.union([
  createMultipleChoiceQuestionSchema.partial().omit({ type: true }),
  createTrueFalseQuestionSchema.partial().omit({ type: true }),
  createShortAnswerQuestionSchema.partial().omit({ type: true }),
  createEssayQuestionSchema.partial().omit({ type: true }),
  createClozeQuestionSchema.partial().omit({ type: true }),
  z.object({
    type: z.enum(['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'ESSAY', 'CLOZE']).optional(),
    content: z.string().trim().min(10).max(2000).optional(),
    isPublished: z.boolean().optional(),
    courseId: z.coerce.number().int().positive().optional(),
    chapterId: z.coerce.number().int().positive().optional(),
    lectureId: z.coerce.number().int().positive().optional(),
    parentQuestionId: z.coerce.number().int().positive().optional().nullable(),
    orderIndex: z.coerce.number().int().min(1).optional(),
    segmentId: z.coerce.number().int().positive().optional(),
  }),
]);

// ===== QUIZ SCHEMAS =====
const createQuizBodySchema = z.object({
  courseId: z.coerce.number().int().positive(),
  chapterId: z.coerce.number().int().positive().optional().nullable(),
  lessonId: z.coerce.number().int().positive().optional().nullable(),
  title: z.string().trim().min(5).max(255),
  description: z.string().trim().max(2000).optional(),
  duration: z.coerce.number().int().min(1).max(480).optional().default(45),
  passScore: z.coerce.number().int().min(0).max(100).optional().default(70),
  maxAttempts: z.coerce.number().int().min(1).max(10).optional().default(3),
});

const updateQuizBodySchema = createQuizBodySchema.partial();

// ===== SUBMIT QUIZ SCHEMAS =====
const submitQuizAnswerValueSchema = z.union([
  z.object({ indices: z.array(z.number().int()) }),
  z.object({ value: z.boolean() }),
  z.object({ text: z.string() }),
]);

const submitQuizBodySchema = z.object({
  answers: z.record(
    z.string().transform(Number),
    z.object({
      type: z.enum(['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'ESSAY']),
      value: submitQuizAnswerValueSchema,
    })
  ),
});

const saveQuizAnswerBodySchema = z.object({
  questionId: z.coerce.number().int().positive(),
  answer: submitQuizAnswerValueSchema,
});

module.exports = {
  // Param Schemas
  questionIdParamSchema,
  lectureIdParamSchema,
  courseIdParamSchema,

  // Question Schemas
  createQuestionBodySchema,
  updateQuestionBodySchema,
  createMultipleChoiceQuestionSchema,
  createTrueFalseQuestionSchema,
  createShortAnswerQuestionSchema,
  createEssayQuestionSchema,
  createClozeQuestionSchema,
  richContentBlockSchema,
  richContentSchema,

  // Quiz Schemas
  createQuizBodySchema,
  updateQuizBodySchema,
  submitQuizBodySchema,
  saveQuizAnswerBodySchema,
};
