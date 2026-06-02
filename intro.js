/* =========================================================
   Anika — Intro animation controller
   Plays once per visit: the name rises, turns into a small
   city of buildings and trees, then slides away to reveal
   the site. Respects "reduced motion" and offers a Skip.
   ========================================================= */
(function () {
  var html = document.documentElement;
  var intro = document.getElementById("intro");

  // Returning visitor this session, reduced motion, or no overlay:
  // make sure nothing is left blocking the page, then stop.
  if (!intro || !html.classList.contains("intro-on")) {
    if (intro && intro.parentNode) intro.parentNode.removeChild(intro);
    html.classList.remove("intro-on");
    return;
  }

  // Remember that the intro has played for this browsing session.
  try { localStorage.setItem("anikaIntroSeen", "1"); } catch (e) {}

  var cleaned = false;

  function finish() {
    if (cleaned) return;
    cleaned = true;
    html.classList.remove("intro-on");          // restores scrolling
    if (intro && intro.parentNode) intro.parentNode.removeChild(intro);
    document.removeEventListener("keydown", onKey);
  }

  function skip() {
    if (cleaned) return;
    intro.classList.add("intro-fadeout");        // quick fade
    window.setTimeout(finish, 420);
  }

  function onKey(e) {
    if (e.key === "Escape") skip();
  }

  var skipBtn = document.getElementById("introSkip");
  if (skipBtn) skipBtn.addEventListener("click", skip);
  document.addEventListener("keydown", onKey);

  // Remove the overlay once the slide-away animation has finished.
  intro.addEventListener("animationend", function (e) {
    if (e.animationName === "introExit") finish();
  });

  // Fallback in case animationend doesn't fire (total run ≈ 3.85s).
  window.setTimeout(finish, 4300);
})();
