(function () {
  const mq       = window.matchMedia('(max-width: 48em)');
  const isMobile = () => mq.matches;

  const sections = Array.from(document.querySelectorAll('main > section'));
  let currentIdx      = 0;
  let isTransitioning = false;

  // Gesture-interval detection: a wheel burst is one gesture.
  // Only the first event of a new gesture can trigger a section/track change.
  const GESTURE_INTERVAL = 250; // ms gap that signals a new gesture
  let lastWheelTime  = 0;
  let gestureConsumed = false;
  let trackSlide = false;

  // Spike detector — recognises a new touchpad gesture from a deltaY upswing
  // during a momentum decay tail, without needing a timing gap.
  const spike = {
    DECAY_CONFIRM: 4,   // consecutive decreasing events to enter decay phase
    SPIKE_RATIO:   2.5, // spike must exceed recent minimum by this factor
    SPIKE_ABS_MIN: 15,  // and must be at least this many pixels
    SPIKE_CONFIRM: 2,   // consecutive spike events needed to confirm
    prevDeltaY:   0,
    decayCount:   0,
    inDecayPhase: false,
    spikeCount:   0,
    recentMin:    Infinity,
    reset() {
      this.prevDeltaY   = 0;
      this.decayCount   = 0;
      this.inDecayPhase = false;
      this.spikeCount   = 0;
      this.recentMin    = Infinity;
    },
    // Returns true when a new gesture is confirmed by the upswing pattern
    update(dy) {
      if (dy <= 0) return false;
      if (this.inDecayPhase) {
        if (dy < this.recentMin) {
          this.recentMin  = dy;
          this.spikeCount = 0;
        } else if (dy > this.recentMin * this.SPIKE_RATIO && dy > this.SPIKE_ABS_MIN) {
          if (++this.spikeCount >= this.SPIKE_CONFIRM) { this.reset(); return true; }
        } else {
          this.spikeCount = 0;
        }
      } else {
        if (dy <= this.prevDeltaY) {
          if (++this.decayCount >= this.DECAY_CONFIRM) {
            this.inDecayPhase = true;
            this.recentMin    = dy;
            this.spikeCount   = 0;
          }
        } else {
          this.decayCount = 0;
        }
      }
      this.prevDeltaY = dy;
      return false;
    }
  };

  // Keep currentIdx in sync after anchor-link / touch navigation
  const snapObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        const i = sections.indexOf(entry.target);
        if (i !== -1) { currentIdx = i; updateHeader(); }
      }
    });
  }, { threshold: 0.5 });
  sections.forEach(function (s) { snapObserver.observe(s); });

  function updateHeader() {
    const section = sections[currentIdx];
    if (!section) return;
    const textColor = getComputedStyle(section).getPropertyValue('--section-text').trim();
    if (textColor) document.documentElement.style.setProperty('--header-text', textColor);
  }

  // Programmatically scroll to a section by index
  function goToSection(idx) {
    if (idx < 0 || idx >= sections.length || isTransitioning) return;
    isTransitioning = true;
    currentIdx = idx;
    updateHeader();
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

    // Update gesture state before any early return so momentum events extend the window
    const now = Date.now();
    const isNewGesture = (now - lastWheelTime) > GESTURE_INTERVAL;
    lastWheelTime = now;
    if (isNewGesture) {
        gestureConsumed = false;
        trackSlide      = false;
        spike.reset();
    } else if ((gestureConsumed || trackSlide) && spike.update(Math.abs(e.deltaY))) {
        // Upswing confirmed — treat as a fresh gesture
        gestureConsumed = false;
        trackSlide      = false;
        isTransitioning = false;
    }

    if (isTransitioning) return;

    const section = sections[currentIdx];
    const track   = section ? section.querySelector('.section-track') : null;

    if (track) {
      const max     = track.scrollWidth - track.clientWidth;
      const atStart = track.scrollLeft <= 0;
      const atEnd   = track.scrollLeft >= max - 1;

      if (e.deltaY > 0 && !atEnd && !gestureConsumed) {
        // Still room to scroll right — consume gesture
        trackSlide = true;
        track.scrollLeft += e.deltaY;
      } else if (e.deltaY < 0 && !atStart && !gestureConsumed) {
        // Still room to scroll left — consume gesture
        trackSlide = true;
        track.scrollLeft += e.deltaY;
      } else if (e.deltaY > 0) {
        // At the right edge — require a new gesture to leave the section
        if (!gestureConsumed && !trackSlide) {
          gestureConsumed = true;
          goToSection(currentIdx + 1);
        }
      } else if (e.deltaY < 0) {
        // At the left edge — same for going backwards
        if (!gestureConsumed && !trackSlide) {
          gestureConsumed = true;
          goToSection(currentIdx - 1);
        }
      }
    } else {
      // Plain section — require a new gesture per section jump
      if (!gestureConsumed) {
        gestureConsumed = true;
        if      (e.deltaY > 0) { goToSection(currentIdx + 1); }
        else if (e.deltaY < 0) { goToSection(currentIdx - 1); }
      }
    }
  }, { passive: false });

  // Set header to match the first section on load
  updateHeader();

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
