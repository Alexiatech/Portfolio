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
  const descEl    = document.getElementById('modal-desc-text');
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
    const desc  = card.getAttribute('data-desc')  || '';

    /* Populate text */
    titleEl.innerHTML = title;
    tagEl.textContent = tag;

    /* Populate description (supports simple HTML like <strong> and <br>) */
    if (descEl) {
      descEl.innerHTML = desc;
      descEl.style.display = desc ? '' : 'none';
    }

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
    } else if (type === 'youtube') {
      /* YouTube embed — src should be the video ID */
      const iframe = document.createElement('iframe');
      iframe.src = 'https://www.youtube.com/embed/' + src;
      iframe.title = title;
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      iframe.setAttribute('aria-label', title + ' video');
      mediaEl.appendChild(iframe);
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
   ICON STRIP — scroll-triggered slide-in / slide-out
   ─────────────────────────────────────────────────────────
   Icons slide in from their respective sides when the section
   enters the viewport. When the user scrolls far down past it
   (section top is above the viewport), icons slide out to the
   opposite side. Scrolling back resets them.
========================================================= */
(function initIconStrip() {

  const strip = document.getElementById('icon-strip');
  if (!strip) return;

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        /* Section in view — slide icons in */
        strip.classList.add('is-strip-visible');
        strip.classList.remove('is-strip-gone');
      } else {
        const rect = strip.getBoundingClientRect();
        if (rect.top < 0) {
          /* Section top is above viewport — still visible but scrolling away */
          strip.classList.remove('is-strip-visible');
          strip.classList.add('is-strip-gone');
        } else {
          /* Not yet reached — reset to initial off-screen positions */
          strip.classList.remove('is-strip-visible', 'is-strip-gone');
        }
      }
    },
    { threshold: 0.2 }
  );

  observer.observe(strip);

}());

/* =========================================================
   ICON STRIP — drag to reposition
   ─────────────────────────────────────────────────────────
   Each icon can be grabbed and dropped anywhere on the page.
   On drag start the icon detaches from the flex row and becomes
   fixed-positioned. On drop it stays wherever it was released.
   Supports both mouse and touch input.
   Double-click / double-tap snaps the icon back to the strip.
========================================================= */
(function initIconDrag() {

  const strip = document.getElementById('icon-strip');
  if (!strip) return;

  const items = strip.querySelectorAll('.icon-strip-item');

  items.forEach((item) => {

    /* Store original parent + next sibling so we can snap back */
    const originalParent  = item.parentElement;
    let   originalSibling = item.nextSibling;

    let isDragging  = false;
    let floater     = null;   /* the fixed-position ghost we drag */
    let offsetX     = 0;
    let offsetY     = 0;
    let isDetached  = false;

    /* ── helpers ── */
    function clientPos(e) {
      const src = e.touches ? e.touches[0] : e;
      return { x: src.clientX, y: src.clientY };
    }

    function detach(clientX, clientY) {
      if (isDetached) return;
      isDetached = true;

      const rect = item.getBoundingClientRect();

      /* Place icon absolutely in document space so it scrolls with the page */
      item.style.position   = 'absolute';
      item.style.left       = (rect.left + window.scrollX) + 'px';
      item.style.top        = (rect.top  + window.scrollY) + 'px';
      item.style.zIndex     = '500';
      item.style.margin     = '0';
      item.style.transition = 'none';
      item.style.opacity    = '1';
      item.style.transform  = 'translateX(0) scale(1.15)';
      item.style.cursor     = 'grabbing';
      document.body.appendChild(item);

      /* offsetX/Y are in viewport space — that's fine, clientX is too */
      offsetX = clientX - rect.left;
      offsetY = clientY - rect.top;
    }

    function moveTo(clientX, clientY) {
      /* clientX is viewport, convert to document space via scroll offset */
      item.style.left = (clientX - offsetX + window.scrollX) + 'px';
      item.style.top  = (clientY - offsetY + window.scrollY) + 'px';
    }

    function drop() {
      if (!isDetached) return;
      item.style.transform = 'translateX(0) scale(1)';
      item.style.cursor    = 'grab';
      isDragging = false;
    }

    function snapBack() {
      if (!isDetached) return;
      document.body.removeChild(item);

      /* Restore original position in flex row */
      originalSibling = originalSibling && originalSibling.parentElement === originalParent
        ? originalSibling : null;
      originalParent.insertBefore(item, originalSibling);

      item.style.cssText = '';   /* wipe all inline styles */
      isDetached = false;
    }

    /* ── Mouse events ── */
    item.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      isDragging = true;
      const { x, y } = clientPos(e);
      detach(x, y);

      function onMove(e) {
        if (!isDragging) return;
        const { x, y } = clientPos(e);
        moveTo(x, y);
      }
      function onUp() {
        drop();
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup',   onUp);
      }
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup',   onUp);
    });

    /* ── Touch events ── */
    item.addEventListener('touchstart', (e) => {
      e.preventDefault();
      isDragging = true;
      const { x, y } = clientPos(e);
      detach(x, y);

      function onMove(e) {
        e.preventDefault();
        const { x, y } = clientPos(e);
        moveTo(x, y);
      }
      function onEnd() {
        drop();
        window.removeEventListener('touchmove', onMove);
        window.removeEventListener('touchend',  onEnd);
      }
      window.addEventListener('touchmove', onMove, { passive: false });
      window.addEventListener('touchend',  onEnd);
    }, { passive: false });

    /* ── Double-click / double-tap → snap back ── */
    item.addEventListener('dblclick', snapBack);

    let lastTap = 0;
    item.addEventListener('touchend', () => {
      const now = Date.now();
      if (now - lastTap < 300) snapBack();
      lastTap = now;
    });

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
