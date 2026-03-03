'use strict';

require('dotenv').config();

/**
 * Centralised application configuration.
 * All environment-dependent values live here so the rest of the codebase
 * never reads process.env directly.
 */
const config = {
  env: process.env.NODE_ENV || 'development',

  server: {
    port: parseInt(process.env.PORT, 10) || 8000,
    host: process.env.HOST || '0.0.0.0',
  },

  cors: {
    // Comma-separated list of allowed origins in production, e.g. "https://chat.example.com"
    origins: process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
      : '*',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 min
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 200,
  },

  chat: {
    maxMessageLength: parseInt(process.env.MAX_MESSAGE_LENGTH, 10) || 500,
    maxUsernameLength: parseInt(process.env.MAX_USERNAME_LENGTH, 10) || 30,
    maxRoomNameLength: parseInt(process.env.MAX_ROOM_NAME_LENGTH, 10) || 30,
    historySize: parseInt(process.env.HISTORY_SIZE, 10) || 50,
    typingDebounceMs: parseInt(process.env.TYPING_DEBOUNCE_MS, 10) || 3000,
  },
};

module.exports = config;
