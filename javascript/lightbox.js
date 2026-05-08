(function () {
  /* ── Lightbox ──────────────────────────────────────────────── */
  var overlay = document.getElementById('lightbox');
  var lbImg   = document.getElementById('lightbox-img');

  function openLightbox(src, alt) {
    lbImg.src = src;
    lbImg.alt = alt || '';
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
  }

  function closeLightbox() {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    setTimeout(function () { lbImg.src = ''; }, 300);
  }

  overlay.addEventListener('click', closeLightbox);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay.classList.contains('open')) {
      closeLightbox();
    }
  });

  /* Click on project images (but not the YouTube thumbnail or tech icons) */
  document.addEventListener('click', function (e) {
    var img = e.target.closest('img');
    if (!img) return;
    if (img.closest('.yt-thumb')) return;
    if (img.classList.contains('tech-icon')) return;
    if (!img.closest('.media-panel')) return;
    openLightbox(img.src, img.alt);
  });
}());
