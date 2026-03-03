/* global $, io, ChatUI */
'use strict';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Socket Module  –  manages the Socket.IO connection and event bus.
 *
 * Works in tandem with ChatUI (socket-chat-jquery.js).
 * ─────────────────────────────────────────────────────────────────────────────
 */
(function () {
  // ── Read user credentials from URL query string ─────────────────────────
  const params = new URLSearchParams(window.location.search);
  const nombre = (params.get('nombre') || '').trim();
  const sala   = (params.get('sala')   || '').trim();
  const DEFAULT_AVATAR = 'assets/images/users/1.jpg';
  // Avatar is never passed via URL (base64 data URLs would cause HTTP 431).
  // Read exclusively from localStorage, falling back to the default preset.
  let avatar = localStorage.getItem('sc_avatar') || DEFAULT_AVATAR;
  if (!nombre || !sala) {
    window.location.replace('index.html');
    return;
  }

  // ── Initialise the UI module ─────────────────────────────────────────────
  ChatUI.init({ nombre, sala, avatar });

  // ── Connect to Socket.IO ─────────────────────────────────────────────────
  const socket = io({
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  // ── Typing debounce ──────────────────────────────────────────────────────
  let typingTimer = null;
  const TYPING_DEBOUNCE_MS = 800;

  ChatUI.$txtMensaje.on('input', () => {
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
      socket.emit('escribiendo');
    }, TYPING_DEBOUNCE_MS);
  });

  // ── Form submit: send message or private message ─────────────────────────
  ChatUI.$formEnviar.on('submit', (e) => {
    e.preventDefault();

    const text = ChatUI.$txtMensaje.val().trim();
    if (!text) return;

    const privateTarget = ChatUI.getPrivateTarget();

    if (privateTarget) {
      // Send private message
      socket.emit(
        'mensajePrivado',
        { para: privateTarget, mensaje: text },
        (res) => {
          if (res && res.error) {
            console.warn('Error mensaje privado:', res.mensaje);
            return;
          }
          // Show own outgoing private message
          ChatUI.renderMessage({ ...res, nombre, tipo: 'private', de: nombre }, true);
          ChatUI.scrollBottom();
        }
      );
    } else {
      // Send public message
      socket.emit('crearMensaje', { mensaje: text }, (res) => {
        if (res && res.error) {
          console.warn('Error al enviar mensaje:', res.mensaje);
          return;
        }
        ChatUI.$txtMensaje.val('').focus();
        ChatUI.renderMessage(res, true);
        ChatUI.scrollBottom();
      });
    }

    ChatUI.$txtMensaje.val('').focus();
  });

  // ── Socket events ────────────────────────────────────────────────────────

  socket.on('connect', () => {
    socket.emit('entrarChat', { nombre, sala, avatar }, (res) => {
      if (res && res.error) {
        alert(`No pudiste unirte al chat: ${res.mensaje}`);
        window.location.replace('index.html');
        return;
      }

      // Render history and current user list
      if (res.historial && res.historial.length) {
        ChatUI.renderHistory(res.historial);
        ChatUI.scrollToBottom();
      }

      ChatUI.renderUsers(res.usuarios || []);
    });
  });

  socket.on('disconnect', (reason) => {
    console.warn('Disconnected:', reason);
    ChatUI.renderMessage(
      {
        nombre: 'Admin',
        mensaje: 'Conexión perdida. Intentando reconectar…',
        fecha: Date.now(),
        tipo: 'system',
      },
      false
    );
  });

  socket.on('connect_error', (err) => {
    console.error('Connection error:', err.message);
  });

  socket.io.on('reconnect', () => {
    ChatUI.renderMessage(
      {
        nombre: 'Admin',
        mensaje: 'Reconectado al servidor.',
        fecha: Date.now(),
        tipo: 'system',
      },
      false
    );
  });

  socket.io.on('reconnect_failed', () => {
    alert('No se pudo reconectar al servidor. Por favor recarga la página.');
  });

  // ── Incoming public message ──────────────────────────────────────────────
  socket.on('crearMensaje', (mensaje) => {
    ChatUI.renderMessage(mensaje, false);
    ChatUI.scrollBottom();
  });

  // ── Incoming private message ─────────────────────────────────────────────
  socket.on('mensajePrivado', (mensaje) => {
    ChatUI.renderMessage({ ...mensaje, tipo: 'private' }, false);
    ChatUI.scrollBottom();
  });

  // ── Room user list updated ───────────────────────────────────────────────
  socket.on('listaPersonas', (personas) => {
    ChatUI.renderUsers(personas);
  });

  // ── Typing indicators ────────────────────────────────────────────────────
  socket.on('escribiendo', ({ nombre: typer }) => {
    if (typer !== nombre) ChatUI.showTyping(typer);
  });

  socket.on('dejóDeEscribir', () => {
    ChatUI.showTyping(null);
  });

  // ── Avatar change (triggered by chat-init.js via custom event) ────────
  $(document).on('chatUI:avatarSelected', function (e, newAvatar) {
    avatar = newAvatar;
    localStorage.setItem('sc_avatar', newAvatar);
    ChatUI.setAvatar(newAvatar);

    socket.emit('actualizarAvatar', { avatar: newAvatar }, (res) => {
      if (res && res.error) {
        console.warn('Avatar update failed:', res.mensaje);
      }
    });
  });
})();
