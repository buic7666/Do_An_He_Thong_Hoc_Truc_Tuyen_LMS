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

const allowedOrigins = [
  process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://localhost:52651',
];

const corsOptions = {
  origin: (origin, callback) => {
    // Cho phép request không có origin như mobile app, Postman, curl
    if (!origin) return callback(null, true);

    // Cho phép frontend cũ và Flutter web chạy localhost nhiều port khác nhau
    const isLocalhost =
      /^http:\/\/localhost:\d+$/.test(origin) ||
      /^http:\/\/127\.0\.0\.1:\d+$/.test(origin);

    if (allowedOrigins.includes(origin) || isLocalhost) {
      return callback(null, true);
    }

    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 204,
};

  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));

  app.use(
    rateLimit({
      windowMs: env.security.rateLimitWindowMs,
      max: env.security.rateLimitMax,
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => req.method === 'OPTIONS',
      message: {
        success: false,
        status: 429,
        message: 'Too many requests, please try again later',
        error: 'RATE_LIMIT_EXCEEDED',
      },
    }),
  );
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
