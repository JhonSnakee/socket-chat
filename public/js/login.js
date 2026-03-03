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

    // Build the URL with properly encoded query parameters
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
