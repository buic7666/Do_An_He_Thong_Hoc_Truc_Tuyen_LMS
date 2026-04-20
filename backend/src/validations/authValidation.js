const { z } = require('zod');

const registerBodySchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(191),
    password: z.string().min(6).max(100),
    role: z.enum(['admin', 'teacher', 'student']).optional(),
  })
  .strict();

const loginBodySchema = z
  .object({
    email: z.string().trim().email().max(191),
    password: z.string().min(1).max(100),
  })
  .strict();

module.exports = {
  registerBodySchema,
  loginBodySchema,
};
