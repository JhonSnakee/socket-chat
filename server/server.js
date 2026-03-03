'use strict';

const express = require('express');
const path = require('path');
const { createServer } = require('http');
const { Server: SocketIOServer } = require('socket.io');

const config = require('./config/config');
const logger = require('./utils/logger');
const {
  helmetMiddleware,
  corsMiddleware,
  rateLimiter,
  httpLogger,
} = require('./middleware/security');
const { registerSocketHandlers } = require('./sockets/socket');

// ─────────────────────────────────────────────────────────────
// Express & HTTP server
// ─────────────────────────────────────────────────────────────
const app = express();
const httpServer = createServer(app);

// ─────────────────────────────────────────────────────────────
// Global middleware
// ─────────────────────────────────────────────────────────────
app.use(httpLogger);
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(rateLimiter);
app.use(express.json());

// ─────────────────────────────────────────────────────────────
// Static assets
// ─────────────────────────────────────────────────────────────
const publicPath = path.resolve(__dirname, '../public');
app.use(express.static(publicPath, { maxAge: config.env === 'production' ? '1d' : 0 }));

// ─────────────────────────────────────────────────────────────
// Health-check endpoint (useful for load balancers / Docker)
// ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) =>
  res.status(200).json({ status: 'ok', uptime: process.uptime() })
);

// ─────────────────────────────────────────────────────────────
// Socket.IO
// ─────────────────────────────────────────────────────────────
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: config.cors.origins,
    methods: ['GET', 'POST'],
  },
  // Ping the client every 25 s; disconnect if no pong within 5 s
  pingInterval: 25000,
  pingTimeout: 5000,
});

registerSocketHandlers(io);

// ─────────────────────────────────────────────────────────────
// Start
// ─────────────────────────────────────────────────────────────
httpServer.listen(config.server.port, config.server.host, () => {
  logger.info(
    `Server running on http://${config.server.host}:${config.server.port} [${config.env}]`
  );
});

// ─────────────────────────────────────────────────────────────
// Graceful shutdown
// ─────────────────────────────────────────────────────────────
function shutdown(signal) {
  logger.info(`${signal} received – shutting down gracefully…`);

  io.close(() => {
    logger.info('Socket.IO closed.');
    httpServer.close(() => {
      logger.info('HTTP server closed.');
      process.exit(0);
    });
  });

  // Force exit after 10 s if something hangs
  setTimeout(() => {
    logger.error('Forced exit after timeout.');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { error: err.message, stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', { reason });
  process.exit(1);
});