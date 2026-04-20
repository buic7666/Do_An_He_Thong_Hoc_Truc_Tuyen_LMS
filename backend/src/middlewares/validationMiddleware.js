const { z } = require('zod');

const parseOrThrow = (schema, value, location) => {
  if (!schema) {
    return;
  }

  const result = schema.safeParse(value);

  if (!result.success) {
    const error = new Error('Validation failed');
    error.name = 'ZodError';
    error.location = location;
    error.details = z.treeifyError(result.error);
    throw error;
  }
};

const validateRequest = (schemas = {}) => {
  return (req, _res, next) => {
    try {
      parseOrThrow(schemas.params, req.params, 'params');
      parseOrThrow(schemas.query, req.query, 'query');
      parseOrThrow(schemas.body, req.body, 'body');
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  validateRequest,
};