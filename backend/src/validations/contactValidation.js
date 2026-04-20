const { z } = require('zod');

const createContactMessageBodySchema = z
  .object({
    fullName: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(191),
    phone: z.string().trim().min(8).max(30).optional().or(z.literal('')),
    message: z.string().trim().min(5).max(5000),
  })
  .strict();

module.exports = {
  createContactMessageBodySchema,
};
