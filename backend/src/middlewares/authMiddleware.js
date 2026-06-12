const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const { HttpError } = require('../utils/httpError');

const authenticate = (req, res, next) => {
  try {
  const authorization = req.headers.authorization || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : null;

  if (!token) {
      throw new HttpError(401, 'Missing authorization token', 'UNAUTHORIZED');
  }

    const payload = jwt.verify(token, env.jwtSecret);
    req.user = payload;
    next();
  } catch (error) {
    next(error);
  }
};

const authorize = (...allowedRoles) => {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new HttpError(401, 'Unauthorized', 'UNAUTHORIZED'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new HttpError(403, 'You do not have permission to access this resource', 'FORBIDDEN'));
    }

    return next();
  };
};

module.exports = {
  authenticate,
  authorize,
};