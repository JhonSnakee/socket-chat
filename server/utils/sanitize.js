'use strict';

const validator = require('validator');
const config = require('../config/config');

/**
 * Allowlist of avatar paths the server will accept.
 * Must match the files present in public/assets/images/users/.
 */
const ALLOWED_AVATARS = new Set([
  'assets/images/users/1.jpg',
  'assets/images/users/d1.jpg',
  'assets/images/users/d2.jpg',
  'assets/images/users/d3.jpg',
  'assets/images/users/d4.jpg',
  'assets/images/users/d5.jpg',
  'assets/images/users/d6.png',
]);

const DEFAULT_AVATAR = 'assets/images/users/1.jpg';

/** Maximum accepted length for a base64 data URL (~220 KB original image). */
const MAX_AVATAR_DATA_URL_LENGTH = 307_200;

/** Valid MIME prefixes for user-uploaded avatars. */
const DATA_URL_PREFIXES = [
  'data:image/jpeg;base64,',
  'data:image/jpg;base64,',
  'data:image/png;base64,',
  'data:image/gif;base64,',
  'data:image/webp;base64,',
];

/**
 * Returns true if `str` is a base64-encoded image data URL with an accepted
 * MIME type. Uses startsWith (not a regex) to avoid ReDoS on large strings.
 *
 * @param {string} str
 * @returns {boolean}
 */
function isAllowedDataUrl(str) {
  return DATA_URL_PREFIXES.some((prefix) => str.startsWith(prefix));
}

/**
 * Validates an avatar update payload.
 * Accepts either a preset path from ALLOWED_AVATARS or a base64 data URL
 * (session-only custom photo). Always falls back to the default avatar on
 * invalid input so callers never receive an untrusted string.
 *
 * @param {{ avatar?: string }} data
 * @returns {{ isValid: boolean, error: string|null, avatar: string }}
 */
function validateAvatarPayload(data) {
  if (!data || typeof data.avatar !== 'string') {
    return { isValid: false, error: 'Avatar inválido.', avatar: DEFAULT_AVATAR };
  }

  const { avatar } = data;

  // Preset paths – fastest path
  if (ALLOWED_AVATARS.has(avatar)) {
    return { isValid: true, error: null, avatar };
  }

  // User-uploaded photo sent as a base64 data URL
  if (isAllowedDataUrl(avatar)) {
    if (avatar.length > MAX_AVATAR_DATA_URL_LENGTH) {
      return {
        isValid: false,
        error: 'La imagen es demasiado grande (máx ~220 KB).',
        avatar: DEFAULT_AVATAR,
      };
    }
    return { isValid: true, error: null, avatar };
  }

  return { isValid: false, error: 'Avatar no permitido.', avatar: DEFAULT_AVATAR };
}

/**
 * Strips HTML tags and trims whitespace from a string.
 * Prevents XSS payloads from being stored or broadcast.
 *
 * @param {string} value - Raw string from client.
 * @returns {string} Sanitized string.
 */
function sanitizeText(value) {
  if (typeof value !== 'string') return '';
  return validator.escape(value.trim());
}

/**
 * Validates and sanitizes a chat message payload.
 *
 * @param {{ mensaje: string }} data
 * @returns {{ isValid: boolean, errors: string[], sanitized: { mensaje: string } }}
 */
function validateMessage(data) {
  const errors = [];

  if (!data || typeof data.mensaje !== 'string') {
    errors.push('El mensaje debe ser texto.');
    return { isValid: false, errors, sanitized: null };
  }

  const sanitized = sanitizeText(data.mensaje);

  if (sanitized.length === 0) {
    errors.push('El mensaje no puede estar vacío.');
  }

  if (sanitized.length > config.chat.maxMessageLength) {
    errors.push(
      `El mensaje no puede superar ${config.chat.maxMessageLength} caracteres.`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: { mensaje: sanitized },
  };
}

/**
 * Validates and sanitizes a join-chat payload.
 *
 * @param {{ nombre: string, sala: string }} data
 * @returns {{ isValid: boolean, errors: string[], sanitized: { nombre: string, sala: string } }}
 */
function validateJoinPayload(data) {
  const errors = [];

  if (!data) {
    return {
      isValid: false,
      errors: ['Payload inválido.'],
      sanitized: null,
    };
  }

  const nombre = sanitizeText(data.nombre || '');
  const sala = sanitizeText(data.sala || '');

  if (nombre.length === 0) {
    errors.push('El nombre de usuario es requerido.');
  } else if (nombre.length > config.chat.maxUsernameLength) {
    errors.push(
      `El nombre no puede superar ${config.chat.maxUsernameLength} caracteres.`
    );
  }

  if (sala.length === 0) {
    errors.push('El nombre de la sala es requerido.');
  } else if (sala.length > config.chat.maxRoomNameLength) {
    errors.push(
      `La sala no puede superar ${config.chat.maxRoomNameLength} caracteres.`
    );
  }

  // Avatar is optional – fall back to default when omitted or invalid
  const { avatar } = validateAvatarPayload({ avatar: data.avatar });

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: { nombre, sala, avatar },
  };
}

module.exports = {
  sanitizeText,
  validateMessage,
  validateJoinPayload,
  validateAvatarPayload,
  DEFAULT_AVATAR,
};
