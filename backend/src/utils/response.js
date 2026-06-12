const successResponse = (res, message, data = null, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    status: statusCode,
    message,
    data,
  });
};

const errorResponse = (res, message, error = 'BAD_REQUEST', statusCode = 400, details) => {
  return res.status(statusCode).json({
    success: false,
    status: statusCode,
    message,
    error,
    ...(details ? { details } : {}),
  });
};

module.exports = {
  successResponse,
  errorResponse,
};