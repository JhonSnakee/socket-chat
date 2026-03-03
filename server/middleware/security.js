'use strict';

const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const config = require('../config/config');
const logger = require('../utils/logger');

/**
 * Helmet – sets sensible HTTP security headers.
 */
const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        // Allow Bootstrap CDN & socket.io inline script
        'https://maxcdn.bootstrapcdn.com',
        "'unsafe-inline'",
      ],
      styleSrc: [
        "'self'",
        'https://maxcdn.bootstrapcdn.com',
        'https://fonts.googleapis.com',
        "'unsafe-inline'",
      ],
      fontSrc: [
        "'self'",
        'https://fonts.gstatic.com',
      ],
      imgSrc: ["'self'", 'data:', 'https://images.vexels.com'],
      connectSrc: ["'self'", 'ws:', 'wss:', 'https://maxcdn.bootstrapcdn.com'],
    },
  },
});

/**
 * CORS – restrict which origins may connect.
 */
const corsMiddleware = cors({
  origin: config.cors.origins,
  methods: ['GET', 'POST'],
});

/**
 * Rate limiter – protect against brute-force / DDoS.
 */
const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

/**
 * HTTP request logger (uses winston stream so all logs are centralised).
 */
const httpLogger = morgan('combined', {
  stream: { write: (msg) => logger.http(msg.trim()) },
  skip: (req) => req.url === '/health', // skip health-check noise
});

module.exports = {
  helmetMiddleware,
  corsMiddleware,
  rateLimiter,
  httpLogger,
};
