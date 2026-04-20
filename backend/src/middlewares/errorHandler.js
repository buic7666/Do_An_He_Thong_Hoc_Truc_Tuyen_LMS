const { errorResponse } = require('../utils/response');

const notFoundHandler = (_req, res) => {
  return errorResponse(res, 'Resource not found', 'NOT_FOUND', 404);
};

const errorHandler = (error, _req, res, _next) => {
  if (error.name === 'SequelizeUniqueConstraintError') {
    return errorResponse(res, 'Resource already exists', 'CONFLICT', 409);
  }

  if (error.name === 'SequelizeValidationError') {
    const details = error.errors?.map((item) => ({
      field: item.path,
      message: item.message,
    }));
    return errorResponse(res, 'Validation failed', 'VALIDATION_ERROR', 400, details);
  }

  if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    return errorResponse(res, 'Token invalid or expired', 'UNAUTHORIZED', 401);
  }

  if (error.name === 'ZodError') {
    return errorResponse(res, 'Validation failed', 'VALIDATION_ERROR', 400, {
      location: error.location,
      issues: error.details,
    });
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';
  const errorCode = error.errorCode || 'INTERNAL_SERVER_ERROR';

  return errorResponse(res, message, errorCode, statusCode, error.details);
};

module.exports = {
  notFoundHandler,
  errorHandler,
};