(function () {
  /* ── Media Error Handler ─────────────────────────────── */
  /* Replaces broken images/videos with a styled placeholder */

  function createMediaPlaceholder(altText) {
    var placeholder = document.createElement('div');
    placeholder.className = 'proj-media-placeholder';
    placeholder.setAttribute('role', 'img');
    placeholder.setAttribute('aria-label', altText || 'Media unavailable');
    placeholder.innerHTML = '<span class="placeholder-text">' + (altText ? escapeHtml(altText) : 'Media unavailable') + '</span>';
    return placeholder;
  }

  function escapeHtml(text) {
    var map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function (char) { return map[char]; });
  }

  function handleMediaError(mediaElement) {
    var altText = mediaElement.alt || mediaElement.getAttribute('aria-label') || '';
    var placeholder = createMediaPlaceholder(altText);
    if (mediaElement.parentNode) {
      mediaElement.parentNode.replaceChild(placeholder, mediaElement);
    }
  }

  // Attach error handlers and check for already-broken images
  function attachMediaHandlers() {
    // Check and handle images in media panels
    var images = document.querySelectorAll('.media-panel > img');
    images.forEach(function (img) {
      // Check if image is already broken
      if (img.complete && !img.naturalWidth) {
        handleMediaError(img);
      } else {
        // Attach error listener for future failures
        img.addEventListener('error', function () {
          handleMediaError(this);
        });
      }
    });

    // Check and handle videos in media panels
    var videos = document.querySelectorAll('.media-panel > video');
    videos.forEach(function (video) {
      video.addEventListener('error', function () {
        handleMediaError(this);
      });
      
      // Also listen to source error events
      var sources = video.querySelectorAll('source');
      sources.forEach(function (source) {
        source.addEventListener('error', function () {
          handleMediaError(video);
        });
      });
    });
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachMediaHandlers);
  } else {
    attachMediaHandlers();
  }
}());
