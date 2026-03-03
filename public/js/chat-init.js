/* global $, ChatUI */
'use strict';

/**
 * chat-init.js – Chat page initialisation.
 *
 * Responsibilities:
 *   - Wire up the client-side user-search filter.
 *   - Exit button: navigate back to the login page.
 *   - Avatar picker modal: populate grid on open, fire custom event on selection.
 */
$(function () {
  // ── Live user-search filter (client-side, no server round-trip) ────────
  $('#searchUsers').on('input', function () {
    const term = $(this).val().toLowerCase();
    $('#divUsuarios li').each(function () {
      const name = $(this).text().toLowerCase();
      $(this).toggle(!term || name.includes(term));
    });
  });

  // ── Exit button ───────────────────────────────────────────────────
  $('#btnSalir').on('click', function () {
    window.location.replace('index.html');
  });

  // ── Avatar picker modal ──────────────────────────────────────────

  // Populate the grid each time the modal opens so it always reflects
  // the user's current avatar.  Also reset the file input so re-selecting
  // the same file still fires the change event.
  $('#modalAvatar').on('show.bs.modal', function () {
    ChatUI.populateAvatarPicker($('#avatarPickerChat'), ChatUI.getAvatar());
    $('#avatarUploadChat').val('');
  });

  // When the user clicks a preset avatar:
  //   1. Mark it as selected visually.
  //   2. Close the modal.
  //   3. Notify the socket module via a custom jQuery event.
  $('#avatarPickerChat').on('click', '.avatar-option', function () {
    const newAvatar = $(this).data('avatar');
    $(this).addClass('selected').siblings('.avatar-option').removeClass('selected');
    $('#modalAvatar').modal('hide');
    $(document).trigger('chatUI:avatarSelected', [newAvatar]);
  });

  // ── Custom avatar upload (chat modal) ──────────────────────────────────
  $('#avatarUploadChat').on('change', function () {
    const file = this.files[0];
    if (!file) return;

    if (file.size > 220 * 1024) {
      alert('La imagen no puede superar 220 KB.');
      this.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      $('#modalAvatar').modal('hide');
      $(document).trigger('chatUI:avatarSelected', [e.target.result]);
    };
    reader.readAsDataURL(file);
  });
});
