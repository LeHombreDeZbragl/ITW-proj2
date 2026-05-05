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
    if (!img.closest('.project-panel')) return;
    openLightbox(img.src, img.alt);
  });

  /* ── YouTube click-to-play ─────────────────────────────────── */
  document.addEventListener('click', function (e) {
    var thumb = e.target.closest('.yt-thumb');
    if (!thumb) return;
    var videoId = thumb.dataset.videoId;
    if (!videoId) return;

    var wrapper = document.createElement('div');
    wrapper.className = 'yt-embed-active';

    var iframe = document.createElement('iframe');
    iframe.src = 'https://www.youtube.com/embed/' + videoId + '?autoplay=1&rel=0';
    iframe.title = 'YouTube video player';
    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
    iframe.setAttribute('allowfullscreen', '');
    wrapper.appendChild(iframe);
    thumb.replaceWith(wrapper);
  });
}());
