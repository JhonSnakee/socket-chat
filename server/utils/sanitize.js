'use strict';

const validator = require('validator');
const config = require('../config/config');

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

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: { nombre, sala },
  };
}

module.exports = { sanitizeText, validateMessage, validateJoinPayload };
