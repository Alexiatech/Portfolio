/* =========================================================
   Anika — Portfolio interactions
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  /* ---- Current year in footer ---- */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---- Rotating word in the hero headline ---- */
  const rotateWord = document.getElementById("rotateWord");
  if (rotateWord) {
    const words = ["people", "nature", "animals", "climate"];
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let i = 0;
    setInterval(() => {
      i = (i + 1) % words.length;
      if (reduce) {
        rotateWord.textContent = words[i];
        return;
      }
      rotateWord.classList.add("swapping");
      setTimeout(() => {
        rotateWord.textContent = words[i];
        rotateWord.classList.remove("swapping");
      }, 400);
    }, 5000);
  }

  /* ---- Mobile navigation toggle ---- */
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      const isOpen = navLinks.classList.toggle("open");
      navToggle.classList.toggle("open", isOpen);
      navToggle.setAttribute("aria-expanded", String(isOpen));
      navToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
    });

    // Close the menu when a link is clicked (mobile)
    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("open");
        navToggle.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---- Scroll-reveal animations ---- */
  const revealEls = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            // small stagger for a softer feel
            setTimeout(() => entry.target.classList.add("visible"), i * 80);
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach((el) => observer.observe(el));
  } else {
    // Fallback: just show everything
    revealEls.forEach((el) => el.classList.add("visible"));
  }

  /* ---- Contact form (front-end demo handling) ---- */
  const form = document.getElementById("contactForm");
  const status = document.getElementById("formStatus");

  if (form && status) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const name = form.name.value.trim();
      const email = form.email.value.trim();
      const message = form.message.value.trim();
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

      if (!name || !message || !emailOk) {
        status.textContent = "Please fill in every field with a valid email.";
        status.className = "form-status error";
        return;
      }

      // No backend yet — this just confirms locally.
      // To make it live, connect a service like Formspree, Netlify Forms, etc.
      status.textContent = `Thanks, ${name}! Your message is ready to send.`;
      status.className = "form-status success";
      form.reset();
    });
  }
});
