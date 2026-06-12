class HttpError extends Error {
  constructor(statusCode, message, errorCode, details) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
  }
}

module.exports = {
  HttpError,
};