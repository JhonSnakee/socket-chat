'use strict';

const { createLogger, format, transports } = require('winston');
const config = require('../config/config');

const { combine, timestamp, colorize, printf, errors, json } = format;

/**
 * Human-readable format for development.
 */
const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, stack }) =>
    stack
      ? `[${ts}] ${level}: ${message}\n${stack}`
      : `[${ts}] ${level}: ${message}`
  )
);

/**
 * Structured JSON format for production (easily ingested by log aggregators).
 */
const prodFormat = combine(timestamp(), errors({ stack: true }), json());

const logger = createLogger({
  level: config.env === 'production' ? 'info' : 'debug',
  format: config.env === 'production' ? prodFormat : devFormat,
  transports: [new transports.Console()],
  exitOnError: false,
});

module.exports = logger;
