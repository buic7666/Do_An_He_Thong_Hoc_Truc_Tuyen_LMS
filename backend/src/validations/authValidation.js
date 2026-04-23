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

const googleSocialBodySchema = z
  .object({
    access_token: z.string().trim().min(10).max(4096),
  })
  .strict();

const facebookSocialBodySchema = z
  .object({
    access_token: z.string().trim().min(10).max(4096),
  })
  .strict();

module.exports = {
  registerBodySchema,
  loginBodySchema,
  googleSocialBodySchema,
  facebookSocialBodySchema,
};
