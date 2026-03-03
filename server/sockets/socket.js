'use strict';

const { UserManager } = require('../classes/UserManager');
const { MessageHistory } = require('../classes/MessageHistory');
const { crearMensaje } = require('../utils/messageUtils');
const { validateJoinPayload, validateMessage, validateAvatarPayload, DEFAULT_AVATAR } = require('../utils/sanitize');
const logger = require('../utils/logger');

/** @type {Map<string, ReturnType<typeof setTimeout>>} socket id → typing timeout */
const typingTimers = new Map();

const TYPING_TIMEOUT_MS = 3000;

/**
 * Registers all Socket.IO event handlers.
 *
 * @param {import('socket.io').Server} io
 */
function registerSocketHandlers(io) {
  const userManager = new UserManager();
  const messageHistory = new MessageHistory();

  io.on('connection', (socket) => {
    logger.debug(`Socket connected: ${socket.id}`);

    // ─────────────────────────────────────────────────────────────
    // ENTER CHAT
    // ─────────────────────────────────────────────────────────────
    socket.on('entrarChat', (data, callback) => {
      const { isValid, errors, sanitized } = validateJoinPayload(data);

      if (!isValid) {
        return callback({ error: true, mensaje: errors.join(' ') });
      }

      const { nombre, sala } = sanitized;

      if (userManager.getUser(socket.id)) {
        return callback({ error: true, mensaje: 'Ya estás en el chat.' });
      }

      const { avatar } = sanitized;
      userManager.addUser(socket.id, nombre, sala, avatar);
      socket.join(sala);

      logger.info(`User "${nombre}" joined room "${sala}" (${socket.id})`);  

      const usersInRoom = userManager.getUsersByRoom(sala);
      const history = messageHistory.getByRoom(sala);

      const systemMsg = crearMensaje('Admin', `${nombre} se unió al chat`, 'system');
      messageHistory.add(sala, systemMsg);
      socket.to(sala).emit('crearMensaje', systemMsg);
      socket.to(sala).emit('listaPersonas', usersInRoom);

      callback({ usuarios: usersInRoom, historial: history });
    });

    // ─────────────────────────────────────────────────────────────
    // PUBLIC MESSAGE
    // ─────────────────────────────────────────────────────────────
    socket.on('crearMensaje', (data, callback) => {
      const user = userManager.getUser(socket.id);

      if (!user) {
        return typeof callback === 'function' &&
          callback({ error: true, mensaje: 'No estás autenticado en el chat.' });
      }

      const { isValid, errors, sanitized } = validateMessage(data);

      if (!isValid) {
        return typeof callback === 'function' &&
          callback({ error: true, mensaje: errors.join(' ') });
      }

      const mensaje = crearMensaje(user.nombre, sanitized.mensaje, 'public', user.avatar);
      messageHistory.add(user.sala, mensaje);

      socket.to(user.sala).emit('crearMensaje', mensaje);

      logger.debug(`[${user.sala}] ${user.nombre}: ${sanitized.mensaje}`);

      if (typeof callback === 'function') callback(mensaje);
    });

    // ─────────────────────────────────────────────────────────────
    // PRIVATE MESSAGE
    // ─────────────────────────────────────────────────────────────
    socket.on('mensajePrivado', (data, callback) => {
      const sender = userManager.getUser(socket.id);

      if (!sender) {
        return typeof callback === 'function' &&
          callback({ error: true, mensaje: 'No autenticado.' });
      }

      const { isValid, errors, sanitized } = validateMessage(data);

      if (!isValid || !data.para) {
        return typeof callback === 'function' &&
          callback({ error: true, mensaje: errors.join(' ') || 'Destinatario requerido.' });
      }

      const recipient = userManager.getUser(data.para);

      if (!recipient) {
        return typeof callback === 'function' &&
          callback({ error: true, mensaje: 'El usuario ya no está conectado.' });
      }

      const mensaje = crearMensaje(sender.nombre, sanitized.mensaje, 'private', sender.avatar);
      io.to(data.para).emit('mensajePrivado', { ...mensaje, de: sender.nombre, avatar: sender.avatar });

      logger.debug(`Private: ${sender.nombre} → ${recipient.nombre}: ${sanitized.mensaje}`);

      if (typeof callback === 'function') callback(mensaje);
    });

    // ─────────────────────────────────────────────────────────────
    // UPDATE AVATAR
    // ─────────────────────────────────────────────────────────────
    socket.on('actualizarAvatar', (data, callback) => {
      const user = userManager.getUser(socket.id);

      if (!user) {
        return typeof callback === 'function' &&
          callback({ error: true, mensaje: 'No autenticado.' });
      }

      const { isValid, error, avatar } = validateAvatarPayload(data);

      if (!isValid) {
        return typeof callback === 'function' &&
          callback({ error: true, mensaje: error });
      }

      userManager.updateAvatar(socket.id, avatar);
      logger.info(`User "${user.nombre}" updated avatar → ${avatar}`);

      const systemMsg = crearMensaje('Admin', `${user.nombre} actualizó su foto de perfil`, 'system', DEFAULT_AVATAR);
      messageHistory.add(user.sala, systemMsg);

      socket.to(user.sala).emit('crearMensaje', systemMsg);
      socket.to(user.sala).emit('listaPersonas', userManager.getUsersByRoom(user.sala));

      if (typeof callback === 'function') callback({ error: false, avatar });
    });

    // ─────────────────────────────────────────────────────────────
    // TYPING INDICATOR
    // ─────────────────────────────────────────────────────────────
    socket.on('escribiendo', () => {
      const user = userManager.getUser(socket.id);
      if (!user) return;

      if (typingTimers.has(socket.id)) {
        clearTimeout(typingTimers.get(socket.id));
      }

      socket.to(user.sala).emit('escribiendo', { nombre: user.nombre });

      const timer = setTimeout(() => {
        socket.to(user.sala).emit('dejóDeEscribir', { nombre: user.nombre });
        typingTimers.delete(socket.id);
      }, TYPING_TIMEOUT_MS);

      typingTimers.set(socket.id, timer);
    });

    // ─────────────────────────────────────────────────────────────
    // DISCONNECT
    // ─────────────────────────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      if (typingTimers.has(socket.id)) {
        clearTimeout(typingTimers.get(socket.id));
        typingTimers.delete(socket.id);
      }

      const user = userManager.removeUser(socket.id);

      if (!user) {
        logger.debug(`Socket disconnected before joining: ${socket.id} (${reason})`);
        return;
      }

      logger.info(`User "${user.nombre}" left room "${user.sala}" – reason: ${reason}`);

      const systemMsg = crearMensaje('Admin', `${user.nombre} abandonó el chat`, 'system');
      messageHistory.add(user.sala, systemMsg);

      socket.to(user.sala).emit('crearMensaje', systemMsg);
      socket.to(user.sala).emit('listaPersonas', userManager.getUsersByRoom(user.sala));

      if (userManager.getUsersByRoom(user.sala).length === 0) {
        messageHistory.clearRoom(user.sala);
        logger.debug(`Room "${user.sala}" is now empty – history cleared.`);
      }
    });
  });
}

module.exports = { registerSocketHandlers };