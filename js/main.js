/* =========================================================
   main.js — Anika Nelson Portfolio
========================================================= */

/* =========================================================
   LOADING SCREEN
   ─────────────────────────────────────────────────────────
   After the CSS fade-out animation (2s) finishes, hide the
   element entirely so it no longer blocks interaction.
   A 2.1s setTimeout acts as a fallback.
========================================================= */
(function initLoadingScreen() {
  const screen = document.getElementById('loading-screen');
  if (!screen) return;

  function hideScreen() {
    screen.style.display = 'none';
  }

  screen.addEventListener('animationend', hideScreen, { once: true });
  setTimeout(hideScreen, 2200); /* fallback */
}());

/* =========================================================
   HERO MAP — MapLibre GL (3D animated, Seattle → Bellingham)
   ─────────────────────────────────────────────────────────
   Tiles:  OpenFreeMap Positron (free, no API key)
   Motion: Camera flies Seattle → Bellingham → back, on loop
========================================================= */
(function initHeroMap() {

  if (typeof maplibregl === 'undefined') return;
  const mapEl = document.getElementById('hero-map');
  if (!mapEl) return;

  const SEATTLE    = { center: [-122.332, 47.606], zoom: 11.5, bearing:  15, pitch: 55 };
  const BELLINGHAM = { center: [-122.479, 48.752], zoom: 11.5, bearing: -10, pitch: 55 };
  const MIDPOINT   = { center: [-122.395, 48.18],  zoom:  9.0, bearing:   5, pitch: 62 };

  const DURATION = 10000; /* ms per leg */

  const map = new maplibregl.Map({
    container: 'hero-map',
    style: 'https://tiles.openfreemap.org/styles/positron',
    center: SEATTLE.center,
    zoom:    SEATTLE.zoom,
    pitch:   SEATTLE.pitch,
    bearing: SEATTLE.bearing,
    interactive: false,   /* decorative — user can't drag */
    attributionControl: true,
  });

  /* Update live badge */
  const badge = document.getElementById('map-live-badge');
  if (badge) badge.textContent = 'Seattle · Bellingham corridor';

  /* ── Camera tour (loop) ── */
  function fly(opts, onDone) {
    map.flyTo({
      center:   opts.center,
      zoom:     opts.zoom,
      bearing:  opts.bearing,
      pitch:    opts.pitch,
      speed:    0.55,
      curve:    1.4,
      duration: DURATION,
      essential: true,
    });
    map.once('moveend', onDone);
  }

  function tour() {
    fly(MIDPOINT, () =>
      fly(BELLINGHAM, () =>
        setTimeout(() =>
          fly({ ...MIDPOINT, bearing: -5 }, () =>
            fly(SEATTLE, () =>
              setTimeout(tour, 2500)
            )
          )
        , 2800)
      )
    );
  }

  map.on('load', () => setTimeout(tour, 800));

}());

/* =========================================================
   HAMBURGER MENU
   ─────────────────────────────────────────────────────────
   Toggles .is-open on both the button and the nav-links list.
   Closes automatically when a link is clicked or Escape pressed.
========================================================= */
(function initHamburger() {
  const btn   = document.querySelector('.nav-hamburger');
  const links = document.getElementById('nav-links');
  if (!btn || !links) return;

  function openMenu() {
    btn.classList.add('is-open');
    links.classList.add('is-open');
    btn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    btn.classList.remove('is-open');
    links.classList.remove('is-open');
    btn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  btn.addEventListener('click', () => {
    btn.classList.contains('is-open') ? closeMenu() : openMenu();
  });

  /* Close when any nav link is clicked */
  links.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', closeMenu);
  });

  /* Close on Escape */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && btn.classList.contains('is-open')) closeMenu();
  });
}());

/* ── Nav: highlight active section link on scroll ── */
const sections = document.querySelectorAll('section[id]');
const navLinks  = document.querySelectorAll('.nav-links a');

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        navLinks.forEach((link) => {
          link.classList.toggle(
            'active',
            link.getAttribute('href') === `#${entry.target.id}`
          );
        });
      }
    });
  },
  { threshold: 0.25 }  /* lower threshold so tall sections (like projects) still trigger */
);

sections.forEach((section) => sectionObserver.observe(section));

/* ── Fade-in elements as they scroll into view ── */
const fadeEls = document.querySelectorAll('.fade-in');

const fadeObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        fadeObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);

fadeEls.forEach((el) => fadeObserver.observe(el));

/* =========================================================
   PROJECT MODAL
   ─────────────────────────────────────────────────────────
   When a .proj-card is clicked:
     1. Read its data-title, data-tag, data-src, data-type.
     2. Build an <img> or <embed> and inject it into #modal-media.
     3. Show the modal with a CSS transition (is-open class).

   Closing:
     • Click the × button
     • Click the dark overlay (outside the white box)
     • Press Escape

   Accessibility:
     • Focus moves to the close button when modal opens.
     • Focus returns to the card that triggered it on close.
     • Body scroll is locked while the modal is open.
   ─────────────────────────────────────────────────────────
   NOTE: The modal element uses the HTML `hidden` attribute.
         We remove it before triggering the CSS fade-in so
         the element is in the DOM for the transition.
========================================================= */
(function initModal() {

  const overlay   = document.getElementById('proj-modal');
  const box       = overlay && overlay.querySelector('.modal-box');
  const closeBtn  = overlay && overlay.querySelector('.modal-close');
  const titleEl   = document.getElementById('modal-title-text');
  const tagEl     = document.getElementById('modal-tag-text');
  const mediaEl   = document.getElementById('modal-media');
  const cards     = document.querySelectorAll('.proj-card');

  if (!overlay || !cards.length) return;

  /* The card that last opened the modal — used to restore focus on close */
  let triggerCard = null;

  /* ── Open ── */
  function openModal(card) {
    const title = card.getAttribute('data-title') || '';
    const tag   = card.getAttribute('data-tag')   || '';
    const src   = card.getAttribute('data-src')   || '';
    const type  = card.getAttribute('data-type')  || 'image';

    /* Populate text */
    titleEl.innerHTML = title;
    tagEl.textContent = tag;

    /* Build media element */
    mediaEl.innerHTML = '';   /* clear previous */

    if (type === 'pdf') {
      /*
        <embed> renders the PDF natively in the browser viewer.
        If the browser can't display it, a fallback link is shown.
      */
      const embed = document.createElement('embed');
      embed.src   = src;
      embed.type  = 'application/pdf';
      embed.title = title;
      embed.setAttribute('aria-label', title + ' PDF');
      mediaEl.appendChild(embed);
    } else {
      /* Default: image */
      const img = document.createElement('img');
      img.src = src;
      img.alt = title;
      img.loading = 'lazy';
      mediaEl.appendChild(img);
    }

    /* Show overlay: remove [hidden], then add .is-open for CSS transition */
    triggerCard = card;
    overlay.removeAttribute('hidden');

    /* rAF ensures the browser registers the element before transitioning */
    requestAnimationFrame(() => overlay.classList.add('is-open'));

    /* Lock body scroll */
    document.body.style.overflow = 'hidden';

    /* Move focus to close button for keyboard / screen-reader users */
    closeBtn && closeBtn.focus();
  }

  /* ── Close ── */
  function closeModal() {
    overlay.classList.remove('is-open');

    /* Wait for the CSS fade-out to finish, then hide the element.
       A 300 ms setTimeout fallback ensures hidden is always set,
       even if transitionend doesn't fire (e.g. reduced-motion). */
    let closed = false;
    const finish = () => {
      if (closed) return;
      closed = true;
      overlay.setAttribute('hidden', '');
      mediaEl.innerHTML = '';   /* free any loaded PDF / image */
    };
    overlay.addEventListener('transitionend', finish, { once: true });
    setTimeout(finish, 300);

    /* Restore body scroll */
    document.body.style.overflow = '';

    /* Return focus to the card that opened the modal */
    if (triggerCard) {
      triggerCard.focus();
      triggerCard = null;
    }
  }

  /* ── Event listeners ── */

  /* Each project card opens the modal */
  cards.forEach((card) => {
    card.addEventListener('click', (e) => {
      e.preventDefault();
      openModal(card);
    });
  });

  /* × button */
  closeBtn && closeBtn.addEventListener('click', closeModal);

  /* Click on the dark overlay (but not inside the white box) */
  overlay.addEventListener('click', (e) => {
    if (!box.contains(e.target)) closeModal();
  });

  /* Escape key */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('is-open')) {
      closeModal();
    }
  });

}());

/* =========================================================
   EXPERIENCE TIMELINE — scroll-triggered slide animations
   ─────────────────────────────────────────────────────────
   Each .tl-item is observed. When it enters the viewport the
   card slides in from its side (.tl-visible). When it leaves
   through the TOP (scrolled past) the card exits to the
   opposite side (.tl-gone). Scrolling back down resets it.
========================================================= */
(function initTimeline() {

  const items = document.querySelectorAll('.tl-item');
  if (!items.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const el = entry.target;

        if (entry.isIntersecting) {
          /* Entering the viewport — animate in */
          el.classList.add('tl-visible');
          el.classList.remove('tl-gone');
        } else {
          const rect = el.getBoundingClientRect();

          if (rect.bottom < 0) {
            /* Scrolled completely past — exit to opposite side */
            el.classList.remove('tl-visible');
            el.classList.add('tl-gone');
          } else {
            /* Below the viewport — restore initial offset (not yet reached) */
            el.classList.remove('tl-visible', 'tl-gone');
          }
        }
      });
    },
    { threshold: 0.18 }
  );

  items.forEach((item) => observer.observe(item));

}());
