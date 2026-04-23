(function () {
  const mq       = window.matchMedia('(max-width: 48em)');
  const isMobile = () => mq.matches;

  const sections = Array.from(document.querySelectorAll('main > section'));
  let currentIdx      = 0;
  let isTransitioning = false;

  // Accumulated delta while at the edge of a horizontal track.
  // The user must scroll past this threshold before switching sections.
  let overscrollAccum        = 0;
  const OVERSCROLL_THRESHOLD = 600;

  // Keep currentIdx in sync after anchor-link / touch navigation
  const snapObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        const i = sections.indexOf(entry.target);
        if (i !== -1) currentIdx = i;
      }
    });
  }, { threshold: 0.5 });
  sections.forEach(function (s) { snapObserver.observe(s); });

  // Programmatically scroll to a section by index
  function goToSection(idx) {
    if (idx < 0 || idx >= sections.length || isTransitioning) return;
    isTransitioning = true;
    overscrollAccum = 0;
    currentIdx = idx;
    document.documentElement.scrollTo({ top: sections[idx].offsetTop, behavior: 'smooth' });

    // Release the lock when vertical scroll settles, with a 1 s hard cap
    var debounce, fallback;
    function release() {
      clearTimeout(debounce);
      clearTimeout(fallback);
      isTransitioning = false;
      window.removeEventListener('scroll', tick);
    }
    function tick() {
      clearTimeout(debounce);
      debounce = setTimeout(release, 150);
    }
    window.addEventListener('scroll', tick, { passive: true });
    fallback = setTimeout(release, 1000);
  }

  // Nav links: close menu, reset horizontal track, update index
  const navList = document.getElementById('nav-list');
  navList.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      navList.classList.remove('open');
      document.getElementById('hamburger').setAttribute('aria-expanded', 'false');

      const target = document.getElementById(link.getAttribute('href').slice(1));
      if (!target) return;
      const i = sections.indexOf(target);
      if (i !== -1) currentIdx = i;
      const track = target.querySelector('.section-track');
      if (track) track.scrollLeft = 0;
    });
  });

  // Wheel handler — owns all vertical and horizontal scroll on desktop
  window.addEventListener('wheel', function (e) {
    if (isMobile()) return;
    e.preventDefault();
    if (isTransitioning) return;

    const section = sections[currentIdx];
    const track   = section ? section.querySelector('.section-track') : null;

    if (track) {
      const max     = track.scrollWidth - track.clientWidth;
      const atStart = track.scrollLeft <= 0;
      const atEnd   = track.scrollLeft >= max - 1;

      if (e.deltaY > 0 && !atEnd) {
        // Still room to scroll right — consume and reset accumulator
        overscrollAccum = 0;
        track.scrollLeft += e.deltaY;
      } else if (e.deltaY < 0 && !atStart) {
        // Still room to scroll left — consume and reset accumulator
        overscrollAccum = 0;
        track.scrollLeft += e.deltaY;
      } else if (e.deltaY > 0) {
        // At the right edge — require the user to build up intentional overscroll
        overscrollAccum += e.deltaY;
        if (overscrollAccum >= OVERSCROLL_THRESHOLD) {
          overscrollAccum = 0;
          goToSection(currentIdx + 1);
        }
      } else if (e.deltaY < 0) {
        // At the left edge — same resistance going backwards
        overscrollAccum += e.deltaY; // negative
        if (overscrollAccum <= -OVERSCROLL_THRESHOLD) {
          overscrollAccum = 0;
          goToSection(currentIdx - 1);
        }
      }
    } else {
      // Plain section — jump exactly one section
      if      (e.deltaY > 0) { goToSection(currentIdx + 1); }
      else if (e.deltaY < 0) { goToSection(currentIdx - 1); }
    }
  }, { passive: false });

  // Progress bar updates
  document.querySelectorAll('.section-track').forEach(function (track) {
    const bar = track.closest('section').querySelector('.section-progress-bar');
    track.addEventListener('scroll', function () {
      if (bar) {
        const max = track.scrollWidth - track.clientWidth;
        bar.style.width = (max > 0 ? (track.scrollLeft / max * 100) : 0) + '%';
      }
    }, { passive: true });
  });
})();
