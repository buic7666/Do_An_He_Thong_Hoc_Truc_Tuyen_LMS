const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const { env } = require('./config/env');
const apiRoutes = require('./routes');
const { attachRequestContext, requestLogger } = require('./middlewares/requestLogger');
const { notFoundHandler, errorHandler } = require('./middlewares/errorHandler');

const createApp = () => {
  const app = express();

  app.use(attachRequestContext);
  app.use(
    helmet({
      crossOriginResourcePolicy: false,
    }),
  );

  app.use(
    rateLimit({
      windowMs: env.security.rateLimitWindowMs,
      max: env.security.rateLimitMax,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        status: 429,
        message: 'Too many requests, please try again later',
        error: 'RATE_LIMIT_EXCEEDED',
      },
    }),
  );

  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));
  app.use(requestLogger);

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
  });

  app.use('/api', apiRoutes);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

module.exports = {
  createApp,
};
