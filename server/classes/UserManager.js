'use strict';

/**
 * UserManager – manages connected users across rooms.
 *
 * Responsibilities:
 *   - Add / remove users when they connect / disconnect.
 *   - Query users by socket id or room.
 *
 * Intentionally free of any I/O so it is trivially unit-testable.
 */
class UserManager {
  constructor() {
    /** @type {Map<string, { id: string, nombre: string, sala: string, joinedAt: number }>} */
    this._users = new Map();
  }

  /**
   * Register a new user.
   *
   * @param {string} id     - Socket ID.
   * @param {string} nombre - Display name (already sanitized).
   * @param {string} sala   - Room name (already sanitized).
   * @returns {{ id: string, nombre: string, sala: string, joinedAt: number }}
   */
  addUser(id, nombre, sala) {
    const user = { id, nombre, sala, joinedAt: Date.now() };
    this._users.set(id, user);
    return user;
  }

  /**
   * Retrieve a user by socket id.
   *
   * @param {string} id
   * @returns {{ id: string, nombre: string, sala: string, joinedAt: number } | undefined}
   */
  getUser(id) {
    return this._users.get(id);
  }

  /**
   * Remove a user and return their record.
   *
   * @param {string} id
   * @returns {{ id: string, nombre: string, sala: string, joinedAt: number } | undefined}
   */
  removeUser(id) {
    const user = this._users.get(id);
    if (user) this._users.delete(id);
    return user;
  }

  /**
   * Get all users in a given room, sorted by join time.
   *
   * @param {string} sala
   * @returns {Array<{ id: string, nombre: string, sala: string, joinedAt: number }>}
   */
  getUsersByRoom(sala) {
    return [...this._users.values()]
      .filter((u) => u.sala === sala)
      .sort((a, b) => a.joinedAt - b.joinedAt);
  }

  /**
   * Returns a count of all connected users.
   *
   * @returns {number}
   */
  get totalConnected() {
    return this._users.size;
  }
}

module.exports = { UserManager };
