/* global $ */
'use strict';

/**
 * chat-init.js – Chat page initialisation.
 *
 * Loaded last so that all UI and socket modules are already defined.
 * Single responsibility: wire up the client-side user-search filter.
 */
$(function () {
  // Live user-search filter (client-side, no server round-trip)
  $('#searchUsers').on('input', function () {
    const term = $(this).val().toLowerCase();
    $('#divUsuarios li').each(function () {
      const name = $(this).text().toLowerCase();
      $(this).toggle(!term || name.includes(term));
    });
  });
});
