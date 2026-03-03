'use strict';

/**
 * Creates a normalised message object.
 *
 * @param {string} nombre  - Display name of the sender.
 * @param {string} mensaje - Message body (already sanitized).
 * @param {string} [tipo='public']  - 'public' | 'private' | 'system'
 * @param {string} [avatar] - Sender's avatar path.
 * @returns {{ nombre: string, mensaje: string, fecha: number, tipo: string, avatar: string }}
 */
function crearMensaje(nombre, mensaje, tipo = 'public', avatar = 'assets/images/users/1.jpg') {
  return {
    nombre,
    mensaje,
    fecha: Date.now(),
    tipo,
    avatar,
  };
}

/**
 * Formats a timestamp (epoch ms) as HH:MM.
 *
 * @param {number} fecha - Epoch milliseconds.
 * @returns {string}
 */
function formatearHora(fecha) {
  const date = new Date(fecha);
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

module.exports = { crearMensaje, formatearHora };
