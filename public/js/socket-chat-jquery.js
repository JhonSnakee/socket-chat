/* global $, io */
'use strict';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * UI Module  –  handles ALL DOM interaction for the chat page.
 *
 * Key design decisions (senior-level):
 *   • User-supplied text is NEVER injected as raw HTML → no XSS risk.
 *   • createTextNode / textContent is used for every user-generated value.
 *   • DOM fragment building keeps reflow cost low.
 *   • Module pattern (IIFE) keeps globals to zero.
 * ─────────────────────────────────────────────────────────────────────────────
 */
const ChatUI = (() => {
  // ── DOM references (resolved once on DOMContentLoaded) ──────────────────
  let $divUsuarios, $formEnviar, $txtMensaje, $divChatbox, $titleChat, $typingIndicator;

  let nombre = '';
  let sala = '';
  let ownAvatar = 'assets/images/users/1.jpg';

  /** Must match ALLOWED_AVATARS in server/utils/sanitize.js */
  const AVATAR_OPTIONS = [
    'assets/images/users/1.jpg',
    'assets/images/users/d1.jpg',
    'assets/images/users/d2.jpg',
    'assets/images/users/d3.jpg',
    'assets/images/users/d4.jpg',
    'assets/images/users/d5.jpg',
    'assets/images/users/d6.png',
  ];

  // Tracks socket IDs currently clicking for private messages
  let selectedPrivateTarget = null;

  // ── Helpers ─────────────────────────────────────────────────────────────

  /**
   * Format epoch ms as HH:MM.
   *
   * @param {number} epoch
   * @returns {string}
   */
  function formatTime(epoch) {
    const d = new Date(epoch);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  /**
   * Update the browser tab title with unread count when the window is not focused.
   *
   * @param {string} text
   */
  let unread = 0;
  function bumpUnread(msg) {
    if (document.hidden && msg.tipo !== 'system') {
      unread++;
      document.title = `(${unread}) Chat – ${sala}`;
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      unread = 0;
      document.title = `Chat – ${sala}`;
    }
  });

  // ── Public rendering API ─────────────────────────────────────────────────

  /**
   * Set the room title in the header.
   */
  function renderTitle() {
    $titleChat.empty();
    const h3 = document.createElement('h3');
    h3.className = 'box-title';
    h3.append('Sala de chat ');
    const small = document.createElement('small');
    small.textContent = sala;           // ← XSS-safe
    h3.appendChild(small);
    $titleChat.append(h3);
    document.title = `Chat – ${sala}`;
  }

  /**
   * Rebuild the user list panel.
   *
   * @param {Array<{ id: string, nombre: string, sala: string }>} users
   */
  function renderUsers(users) {
    const frag = document.createDocumentFragment();

    // Room header item
    const headerLi = document.createElement('li');
    const headerA = document.createElement('a');
    headerA.href = 'javascript:void(0)';
    headerA.className = 'active';
    headerA.append('Chat de ');
    const span = document.createElement('span');
    span.textContent = sala;            // ← XSS-safe
    headerA.appendChild(span);
    headerLi.appendChild(headerA);
    frag.appendChild(headerLi);

    users.forEach((user) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = 'javascript:void(0)';
      a.dataset.id = user.id;

      const img = document.createElement('img');
      img.src = user.avatar || 'assets/images/users/1.jpg'; // ← per-user avatar
      img.alt = 'user';
      img.className = 'img-circle';

      const nameSpan = document.createElement('span');
      nameSpan.textContent = user.nombre; // ← XSS-safe
      const statusSmall = document.createElement('small');
      statusSmall.className = 'text-success';
      statusSmall.textContent = ' online';
      nameSpan.appendChild(statusSmall);

      a.appendChild(img);
      a.append(' ');
      a.appendChild(nameSpan);
      li.appendChild(a);
      frag.appendChild(li);
    });

    $divUsuarios.empty().append(frag);
  }

  /**
   * Append a single message to the chat box.
   *
   * @param {{ nombre: string, mensaje: string, fecha: number, tipo: string }} msg
   * @param {boolean} isOwn  – true when the message was sent by this client.
   */
  function renderMessage(msg, isOwn = false) {
    const hora = formatTime(msg.fecha);
    const li = document.createElement('li');

    if (msg.tipo === 'system' || msg.nombre === 'Admin') {
      // System / admin message ─ centred, no avatar
      li.className = 'animated fadeIn system-message';

      const content = document.createElement('div');
      content.className = 'chat-content';

      const bubble = document.createElement('div');
      bubble.className = 'box bg-light-danger';
      bubble.textContent = msg.mensaje;  // ← XSS-safe

      content.appendChild(bubble);
      li.appendChild(content);

      const timeDiv = document.createElement('div');
      timeDiv.className = 'chat-time';
      timeDiv.textContent = hora;
      li.appendChild(timeDiv);

    } else if (isOwn) {
      // Own message ─ reversed layout
      li.className = 'reverse';

      const content = document.createElement('div');
      content.className = 'chat-content';

      const nameEl = document.createElement('h5');
      nameEl.textContent = msg.nombre;   // ← XSS-safe

      const bubble = document.createElement('div');
      bubble.className = 'box bg-light-inverse';
      bubble.textContent = msg.mensaje;  // ← XSS-safe

      content.appendChild(nameEl);
      content.appendChild(bubble);

      const avatar = document.createElement('div');
      avatar.className = 'chat-img';
      const avatarImg = document.createElement('img');
      avatarImg.src = msg.avatar || ownAvatar;   // ← own avatar at send time
      avatarImg.alt = 'user';
      avatar.appendChild(avatarImg);

      const timeDiv = document.createElement('div');
      timeDiv.className = 'chat-time';
      timeDiv.textContent = hora;

      li.appendChild(content);
      li.appendChild(avatar);
      li.appendChild(timeDiv);

    } else if (msg.tipo === 'private') {
      // Private message ─ highlighted border
      li.className = 'animated fadeIn private-message';

      const content = document.createElement('div');
      content.className = 'chat-content';

      const nameEl = document.createElement('h5');
      nameEl.textContent = `${msg.de || msg.nombre} → Privado`; // ← XSS-safe

      const bubble = document.createElement('div');
      bubble.className = 'box bg-light-warning';
      bubble.textContent = msg.mensaje;  // ← XSS-safe

      content.appendChild(nameEl);
      content.appendChild(bubble);
      li.appendChild(content);

      const timeDiv = document.createElement('div');
      timeDiv.className = 'chat-time';
      timeDiv.textContent = hora;
      li.appendChild(timeDiv);

    } else {
      // Regular public message from another user
      li.className = 'animated fadeIn';

      const avatar = document.createElement('div');
      avatar.className = 'chat-img';
      const avatarImg = document.createElement('img');
      avatarImg.src = msg.avatar || 'assets/images/users/1.jpg'; // ← sender's avatar
      avatarImg.alt = 'user';
      avatar.appendChild(avatarImg);

      const content = document.createElement('div');
      content.className = 'chat-content';

      const nameEl = document.createElement('h5');
      nameEl.textContent = msg.nombre;   // ← XSS-safe

      const bubble = document.createElement('div');
      bubble.className = 'box bg-light-info';
      bubble.textContent = msg.mensaje;  // ← XSS-safe

      content.appendChild(nameEl);
      content.appendChild(bubble);

      const timeDiv = document.createElement('div');
      timeDiv.className = 'chat-time';
      timeDiv.textContent = hora;

      li.appendChild(avatar);
      li.appendChild(content);
      li.appendChild(timeDiv);
    }

    $divChatbox.append(li);
    bumpUnread(msg);
  }

  /**
   * Render an array of historical messages (e.g. on first join).
   *
   * @param {Array} history
   */
  function renderHistory(history) {
    history.forEach((msg) => renderMessage(msg, msg.nombre === nombre));
  }

  /**
   * Show / hide the "X is typing…" indicator in the chat box footer.
   *
   * @param {string|null} typerName – null to hide.
   */
  function showTyping(typerName) {
    if (!$typingIndicator) return;
    if (typerName) {
      $typingIndicator.text(`${typerName} está escribiendo…`).fadeIn(200);
    } else {
      $typingIndicator.fadeOut(200);
    }
  }

  /**
   * Scrolls the chatbox to the bottom only when the user is already near it.
   * Avoids annoying scroll-hijack when the user has scrolled up to read history.
   */
  function scrollBottom() {
    const box = $divChatbox[0];
    const threshold = 100;
    const nearBottom = box.scrollHeight - box.scrollTop - box.clientHeight <= threshold;
    if (nearBottom) {
      box.scrollTop = box.scrollHeight;
    }
  }

  /**
   * Force-scroll to the bottom (used on initial load / history render).
   */
  function scrollToBottom() {
    const box = $divChatbox[0];
    box.scrollTop = box.scrollHeight;
  }

  // ── Private message overlay ─────────────────────────────────────────────

  function setPrivateTarget(id, nombreTarget) {
    selectedPrivateTarget = id;
    if (id) {
      $txtMensaje.attr('placeholder', `Mensaje privado para ${nombreTarget}… (Esc para cancelar)`);
      $txtMensaje.addClass('private-mode');
    } else {
      $txtMensaje.attr('placeholder', 'Escribe tu mensaje aquí');
      $txtMensaje.removeClass('private-mode');
    }
  }

  function getPrivateTarget() {
    return selectedPrivateTarget;
  }

  // ── Avatar picker ─────────────────────────────────────────────────────

  /**
   * Populate an avatar grid container with all available options.
   * The currently active avatar receives the 'selected' CSS class.
   *
   * @param {jQuery} $container    - The grid element to fill.
   * @param {string} currentAvatar - Path of the currently active avatar.
   */
  function populateAvatarPicker($container, currentAvatar) {
    $container.empty();
    const frag = document.createDocumentFragment();
    AVATAR_OPTIONS.forEach((src) => {
      const img = document.createElement('img');
      img.src = src;
      img.alt = 'avatar';
      img.className = 'avatar-option' + (src === currentAvatar ? ' selected' : '');
      img.dataset.avatar = src;
      frag.appendChild(img);
    });
    $container.append(frag);
  }

  /** Returns the current user's own avatar path. */
  function getAvatar() {
    return ownAvatar;
  }

  /** Updates the in-memory avatar (call after the server acknowledges the change). */
  function setAvatar(newAvatar) {
    ownAvatar = newAvatar;
  }

  // ── Initialise (called by socket-chat.js) ───────────────────────────────

  function init(params) {
    nombre = params.nombre;
    sala = params.sala;
    ownAvatar = params.avatar || 'assets/images/users/1.jpg';

    $divUsuarios = $('#divUsuarios');
    $formEnviar = $('#formEnviar');
    $txtMensaje = $('#txtMensaje');
    $divChatbox = $('#divChatbox');
    $titleChat = $('#titleChat');
    $typingIndicator = $('#typingIndicator');

    renderTitle();
    bindEvents();
  }

  // ── DOM event bindings ───────────────────────────────────────────────────

  function bindEvents() {
    // Click a user in the side panel → open private chat mode
    $divUsuarios.on('click', 'a[data-id]', function () {
      const id = $(this).data('id');
      const nombreTarget = $(this).find('span').first().contents().filter(function () {
        return this.nodeType === 3; // text nodes only
      }).text().trim();

      if (id) {
        setPrivateTarget(id, nombreTarget);
        $txtMensaje.focus();
      }
    });

    // Escape key cancels private message mode
    $txtMensaje.on('keydown', function (e) {
      if (e.key === 'Escape') {
        setPrivateTarget(null, null);
      }
    });
  }

  return {
    init,
    renderTitle,
    renderUsers,
    renderMessage,
    renderHistory,
    showTyping,
    scrollBottom,
    scrollToBottom,
    getPrivateTarget,
    populateAvatarPicker,
    getAvatar,
    setAvatar,
    get $formEnviar() { return $formEnviar; },
    get $txtMensaje() { return $txtMensaje; },
  };
})();
