const { z } = require('zod');

// ===== QUESTION VALIDATION =====
const createQuestionBodySchema = z.object({
  questionText: z
    .string()
    .trim()
    .min(10)
    .max(1000)
    .describe('Nội dung câu hỏi'),
  options: z
    .array(z.string().trim().min(1).max(500))
    .min(2)
    .max(10)
    .describe('Danh sách các tùy chọn'),
  correctIndex: z
    .coerce.number()
    .int()
    .min(0)
    .max(9)
    .describe('Index của câu trả lời đúng'),
  explanation: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .describe('Giải thích đáp án'),
  difficulty: z
    .enum(['easy', 'medium', 'hard'])
    .optional()
    .default('medium')
    .describe('Mức độ khó'),
});

const updateQuestionBodySchema = createQuestionBodySchema.partial();

const questionIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// ===== QUIZ VALIDATION =====
const createQuizBodySchema = z.object({
  courseId: z.coerce.number().int().positive(),
  lessonId: z.coerce.number().int().positive().optional().nullable(),
  title: z
    .string()
    .trim()
    .min(5)
    .max(255)
    .describe('Tiêu đề bài kiểm tra'),
  description: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .describe('Mô tả bài kiểm tra'),
  duration: z
    .coerce.number()
    .int()
    .min(1)
    .max(480)
    .optional()
    .default(45)
    .describe('Thời gian làm bài (phút)'),
  passScore: z
    .coerce.number()
    .int()
    .min(0)
    .max(100)
    .optional()
    .default(70)
    .describe('Điểm đỗ (%)'),
  maxAttempts: z
    .coerce.number()
    .int()
    .min(1)
    .max(10)
    .optional()
    .default(3)
    .describe('Số lần làm bài tối đa'),
  isPublished: z.boolean().optional().default(false),
  questionIds: z
    .array(z.coerce.number().int().positive())
    .optional()
    .describe('Danh sách ID câu hỏi'),
});

const updateQuizBodySchema = createQuizBodySchema.partial();

const quizIdParamSchema = z.object({
  quizId: z.coerce.number().int().positive(),
});

const courseIdParamSchema = z.object({
  courseId: z.coerce.number().int().positive(),
});

// ===== QUIZ ATTEMPT VALIDATION =====
const startQuizAttemptBodySchema = z.object({}).optional();

const saveQuizAnswerBodySchema = z.object({
  questionId: z.coerce.number().int().positive(),
  selectedIndex: z.coerce.number().int().min(0).max(9),
});

const submitQuizBodySchema = z.object({
  answers: z
    .record(z.string(), z.coerce.number().int().min(0).max(9))
    .optional()
    .describe('Object chứa {questionId: selectedIndex}'),
});

module.exports = {
  // Question schemas
  createQuestionBodySchema,
  updateQuestionBodySchema,
  questionIdParamSchema,

  // Quiz schemas
  createQuizBodySchema,
  updateQuizBodySchema,
  quizIdParamSchema,
  courseIdParamSchema,

  // Quiz attempt schemas
  startQuizAttemptBodySchema,
  saveQuizAnswerBodySchema,
  submitQuizBodySchema,
};
