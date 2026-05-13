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

const segmentBodySchema = z
  .object({
    startTime: z.coerce.number().int().min(0),
    endTime: z.coerce.number().int().min(1),
    title: z.string().trim().max(255).optional(),
  })
  .strict();

const createLessonSegmentBodySchema = segmentBodySchema;
const updateLessonSegmentBodySchema = segmentBodySchema;
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

module.exports = {
  lessonIdParamSchema,
  courseIdParamSchema,
  createLessonBodySchema,
  updateLessonBodySchema,
  segmentIdParamSchema,
  createLessonSegmentBodySchema,
  updateLessonSegmentBodySchema,
  bulkCreateLessonSegmentsBodySchema,
  labelIdParamSchema,
  lessonLabelBodySchema,
};
