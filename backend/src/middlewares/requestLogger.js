const crypto = require('crypto');
const morgan = require('morgan');

const attachRequestContext = (req, res, next) => {
  req.requestId = crypto.randomUUID();
  res.setHeader('x-request-id', req.requestId);
  next();
};

morgan.token('requestId', (req) => req.requestId);

const requestLogger = morgan(':date[iso] :requestId :method :url :status :response-time ms');

module.exports = {
  attachRequestContext,
  requestLogger,
};
