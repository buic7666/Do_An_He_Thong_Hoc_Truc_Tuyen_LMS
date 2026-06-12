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
    // `z.treeifyError` may not exist on some zod builds/environments.
    // Fall back to the structured `errors` array when it's unavailable to
    // avoid accessing internal properties (like `_zod`) that can be undefined.
    if (typeof z.treeifyError === 'function') {
      try {
        error.details = z.treeifyError(result.error);
      } catch (e) {
        error.details = result.error.issues || result.error.errors || [];
      }
    } else {
      error.details = result.error.issues || result.error.errors || [];
    }
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