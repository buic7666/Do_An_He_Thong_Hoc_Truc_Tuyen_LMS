const { z } = require('zod');

const lessonIdParamSchema = z
  .object({
    id: z.coerce.number().int().positive(),
  })
  .strict();

const courseIdParamSchema = z
  .object({
    courseId: z.coerce.number().int().positive(),
  })
  .strict();

const createLessonBodySchema = z
  .object({
    title: z.string().trim().min(3).max(255),
    videoUrl: z.string().trim().url().max(255).optional().or(z.literal('')),
    content: z.string().trim().max(10000).optional().or(z.literal('')),
    orderIndex: z.coerce.number().int().min(0).optional(),
    chapterId: z.coerce.number().int().positive().optional(),
  })
  .strict();

const updateLessonBodySchema = z
  .object({
    title: z.string().trim().min(3).max(255).optional(),
    videoUrl: z.string().trim().url().max(255).optional().or(z.literal('')),
    content: z.string().trim().max(10000).optional().or(z.literal('')),
    orderIndex: z.coerce.number().int().min(0).optional(),
    chapterId: z.coerce.number().int().positive().nullable().optional(),
  })
  .strict();

const segmentIdParamSchema = z
  .object({
    segmentId: z.coerce.number().int().positive(),
  })
  .strict();

const segmentContentItemSchema = z
  .object({
    type: z.enum(['text', 'document', 'question', 'quiz', 'videoClip']),
    title: z.string().trim().max(255).optional(),
    content: z.string().trim().max(5000).optional(),
    resourceUrl: z.string().trim().url().max(1000).optional().or(z.literal('')),
    // Optional fields to support quiz setup from question bank
    questionIds: z.array(z.coerce.number().int().positive()).optional(),
    questionTitles: z.array(z.string()).optional(),
    randomize: z.boolean().optional(),
    randomCount: z.coerce.number().int().min(0).optional(),
    startTime: z.coerce.number().int().min(0).optional(),
    endTime: z.coerce.number().int().min(1).optional(),
    orderIndex: z.coerce.number().int().min(1).optional(),
  })
  .strict();

const segmentBodySchema = z
  .object({
    startTime: z.coerce.number().int().min(0).optional(),
    endTime: z.coerce.number().int().min(1).optional(),
    title: z.string().trim().max(255).optional(),
    orderIndex: z.coerce.number().int().min(1).optional(),
    contentItems: z.array(segmentContentItemSchema).max(200).optional(),
  })
  .strict();

const createLessonSegmentBodySchema = segmentBodySchema;
const updateLessonSegmentBodySchema = z
  .object({
    startTime: z.coerce.number().int().min(0).optional(),
    endTime: z.coerce.number().int().min(1).optional(),
    title: z.string().trim().max(255).optional(),
    orderIndex: z.coerce.number().int().min(1).optional(),
    contentItems: z.array(segmentContentItemSchema).max(200).optional(),
  })
  .strict()
  .refine((payload) => Object.keys(payload).length > 0, {
    message: 'At least one field is required to update segment',
  });

const reorderLessonSegmentsBodySchema = z
  .object({
    segmentIds: z.array(z.coerce.number().int().positive()).min(1),
  })
  .strict();

const bulkCreateLessonSegmentsBodySchema = z
  .object({
    segments: z.array(segmentBodySchema).min(1),
  })
  .strict();

const labelIdParamSchema = z
  .object({
    labelId: z.coerce.number().int().positive(),
  })
  .strict();

const lessonLabelBodySchema = z
  .object({
    content: z.string().trim().min(1).max(5000),
    labelType: z.enum(['note', 'warning', 'tip']).optional().default('note'),
  })
  .strict();

const lessonSegmentIdParamSchema = z
  .object({
    id: z.coerce.number().int().positive(),
    segmentId: z.coerce.number().int().positive(),
  })
  .strict();

module.exports = {
  lessonIdParamSchema,
  courseIdParamSchema,
  createLessonBodySchema,
  updateLessonBodySchema,
  segmentIdParamSchema,
  lessonSegmentIdParamSchema,
  createLessonSegmentBodySchema,
  updateLessonSegmentBodySchema,
  reorderLessonSegmentsBodySchema,
  bulkCreateLessonSegmentsBodySchema,
  labelIdParamSchema,
  lessonLabelBodySchema,
};
