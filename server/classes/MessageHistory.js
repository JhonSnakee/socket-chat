'use strict';

const config = require('../config/config');

/**
 * MessageHistory – keeps a capped, in-memory history of messages per room.
 *
 * When a user joins they receive the last N messages for that room so they
 * have immediate context without any database dependency.
 *
 * A production upgrade path would be to swap the in-memory store for Redis
 * or a database without changing the public API.
 */
class MessageHistory {
  /**
   * @param {number} [maxPerRoom] - Max messages kept per room.
   */
  constructor(maxPerRoom = config.chat.historySize) {
    this._maxPerRoom = maxPerRoom;
    /** @type {Map<string, Array>} */
    this._store = new Map();
  }

  /**
   * Persist a message in the given room's history.
   *
   * @param {string} sala
   * @param {{ nombre: string, mensaje: string, fecha: number, tipo: string }} message
   */
  add(sala, message) {
    if (!this._store.has(sala)) {
      this._store.set(sala, []);
    }

    const history = this._store.get(sala);
    history.push(message);

    // Trim to configured cap
    if (history.length > this._maxPerRoom) {
      history.splice(0, history.length - this._maxPerRoom);
    }
  }

  /**
   * Get the message history for a room.
   *
   * @param {string} sala
   * @returns {Array}
   */
  getByRoom(sala) {
    return this._store.get(sala) ?? [];
  }

  /**
   * Remove all history for a room (e.g. when it becomes empty).
   *
   * @param {string} sala
   */
  clearRoom(sala) {
    this._store.delete(sala);
  }
}

module.exports = { MessageHistory };
