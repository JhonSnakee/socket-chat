/* global $ */
'use strict';

/**
 * login.js – Login page behaviour.
 *
 * Responsibilities:
 *   - Fade out the preloader on DOM ready.
 *   - Validate the join form before navigating to the chat page.
 *   - Provide live (per-keystroke) inline validation feedback.
 */

const FORBIDDEN_CHARS = /[<>"'&]/;
const MAX_LEN = 30;
const DEFAULT_AVATAR = 'assets/images/users/1.jpg';

// The currently chosen avatar; restored from localStorage when available
let selectedAvatar = localStorage.getItem('sc_avatar') || DEFAULT_AVATAR;

function showError($field, $errEl, msg) {
  $field.addClass('is-invalid');
  $errEl.text(msg).show();
}

function clearError($field, $errEl) {
  $field.removeClass('is-invalid');
  $errEl.hide();
}

function validate(value, label) {
  if (!value) return `${label} es obligatorio.`;
  if (value.length > MAX_LEN) return `${label} no puede superar ${MAX_LEN} caracteres.`;
  if (FORBIDDEN_CHARS.test(value)) return `${label} contiene caracteres no permitidos.`;
  return null;
}

$(function () {
  // Fade out the preloader once the DOM is ready
  $('.preloader').fadeOut(400);
  $('[data-toggle="tooltip"]').tooltip();
  // ── Avatar picker – pre-select the stored avatar ─────────────────────
  if (selectedAvatar.startsWith('data:image/')) {
    // Restore custom-upload preview inside the upload tile
    const $uploadBtn = $('#avatarPicker .avatar-upload-btn');
    $uploadBtn.append($('<img>').attr({ src: selectedAvatar, alt: 'Mi foto' }));
    $uploadBtn.addClass('selected');
  } else {
    $(`#avatarPicker [data-avatar="${selectedAvatar}"]`).addClass('selected');
  }

  // Preset avatar click
  $('#avatarPicker').on('click', '.avatar-option', function () {
    // Ignore clicks on the upload label (handled by the file input)
    if ($(this).is('.avatar-upload-btn')) return;
    selectedAvatar = $(this).data('avatar');
    $(this).addClass('selected').siblings('.avatar-option').removeClass('selected');
    localStorage.setItem('sc_avatar', selectedAvatar);
  });

  // ── Custom avatar upload ─────────────────────────────────────────────────
  $('#avatarUpload').on('change', function () {
    const file = this.files[0];
    if (!file) return;

    if (file.size > 220 * 1024) {
      alert('La imagen no puede superar 220 KB.');
      this.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      const dataUrl = e.target.result;
      selectedAvatar = dataUrl;
      localStorage.setItem('sc_avatar', dataUrl);

      // Show preview inside the upload tile and mark it selected
      const $btn = $('#avatarPicker .avatar-upload-btn');
      $btn.find('img').remove();
      $btn.append($('<img>').attr({ src: dataUrl, alt: 'Mi foto' }));
      $btn.addClass('selected').siblings('.avatar-option').removeClass('selected');
    };
    reader.readAsDataURL(file);
  });
  // ── Form submit ──────────────────────────────────────────────────────────
  $('#loginform').on('submit', function (e) {
    e.preventDefault();

    const nombre = $('#inputNombre').val().trim();
    const sala   = $('#inputSala').val().trim();

    const $nombre    = $('#inputNombre');
    const $sala      = $('#inputSala');
    const $errNombre = $('#errorNombre');
    const $errSala   = $('#errorSala');

    const errNombre = validate(nombre, 'El nombre');
    const errSala   = validate(sala,   'La sala');

    if (errNombre) { showError($nombre, $errNombre, errNombre); } else { clearError($nombre, $errNombre); }
    if (errSala)   { showError($sala,   $errSala,   errSala);   } else { clearError($sala,   $errSala); }

    if (errNombre || errSala) return;

    // Avatar is already persisted in localStorage – only pass nombre & sala in the URL
    // to avoid HTTP 431 (Request Header Fields Too Large) when a base64 image is selected.
    const qs = new URLSearchParams({ nombre, sala }).toString();
    window.location.href = `chat.html?${qs}`;
  });

  // ── Live per-field validation ────────────────────────────────────────────
  $('#inputNombre').on('input', function () {
    const err = validate($(this).val().trim(), 'El nombre');
    if (err) { showError($(this), $('#errorNombre'), err); }
    else     { clearError($(this), $('#errorNombre')); }
  });

  $('#inputSala').on('input', function () {
    const err = validate($(this).val().trim(), 'La sala');
    if (err) { showError($(this), $('#errorSala'), err); }
    else     { clearError($(this), $('#errorSala')); }
  });
});
