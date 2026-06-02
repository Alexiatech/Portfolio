/* =========================================================
   Plan-your-own-city mini-game
   Place tiles on a grid; the urban-planning score reacts live.
   Scoring rewards: green & parks, homes & people,
   green near homes (livability), and water & nature.
   ========================================================= */

(function () {
  const GRID = 8;
  const board = document.getElementById("cityGrid");
  if (!board) return;

  // ---- Tile artwork (inline SVG) ----
  function buildingSVG() {
    let win = "";
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 3; c++) {
        win += '<rect x="' + (37 + c * 10) + '" y="' + (26 + r * 10) + '" width="6" height="6" fill="#8aa3a8"/>';
      }
    }
    return '<svg viewBox="0 0 100 100" aria-hidden="true">' +
      '<rect x="32" y="20" width="36" height="64" rx="2" fill="#cabfa3"/>' + win + "</svg>";
  }
  const ICONS = {
    empty: "",
    house:
      '<svg viewBox="0 0 100 100" aria-hidden="true">' +
      '<polygon points="20,52 50,24 80,52" fill="#b8593a"/>' +
      '<rect x="28" y="50" width="44" height="32" rx="2" fill="#f2e6d0"/>' +
      '<rect x="34" y="58" width="13" height="12" fill="#9fc6cf"/>' +
      '<rect x="54" y="62" width="13" height="20" fill="#7a5230"/></svg>',
    building: buildingSVG(),
    park:
      '<svg viewBox="0 0 100 100" aria-hidden="true">' +
      '<rect x="46" y="58" width="8" height="26" fill="#6b4a2f"/>' +
      '<circle cx="34" cy="55" r="14" fill="#6f9a55"/>' +
      '<circle cx="66" cy="55" r="14" fill="#4f7a3f"/>' +
      '<circle cx="50" cy="44" r="22" fill="#5f8a4a"/></svg>',
    water:
      '<svg viewBox="0 0 100 100" aria-hidden="true">' +
      '<rect x="4" y="6" width="92" height="88" rx="16" fill="#69b0c4"/>' +
      '<path d="M16 40 q9 -8 18 0 t18 0 t18 0" stroke="#aedbe6" stroke-width="4" fill="none" stroke-linecap="round"/>' +
      '<path d="M16 60 q9 -8 18 0 t18 0 t18 0" stroke="#aedbe6" stroke-width="4" fill="none" stroke-linecap="round"/></svg>',
    road:
      '<svg viewBox="0 0 100 100" aria-hidden="true">' +
      '<rect x="0" y="0" width="100" height="100" fill="#54504a"/>' +
      '<line x1="50" y1="0" x2="50" y2="100" stroke="#e7d4b5" stroke-width="5" stroke-dasharray="11 11"/>' +
      '<line x1="0" y1="50" x2="100" y2="50" stroke="#e7d4b5" stroke-width="5" stroke-dasharray="11 11"/></svg>',
    erase:
      '<svg viewBox="0 0 100 100" aria-hidden="true">' +
      '<line x1="26" y1="26" x2="74" y2="74" stroke="#8a3a30" stroke-width="11" stroke-linecap="round"/>' +
      '<line x1="74" y1="26" x2="26" y2="74" stroke="#8a3a30" stroke-width="11" stroke-linecap="round"/></svg>',
  };

  // ---- State ----
  let grid = new Array(GRID * GRID).fill("empty");
  let tool = "park";
  let painting = false;
  const cells = [];

  // ---- Build the board ----
  for (let i = 0; i < GRID * GRID; i++) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "cell";
    b.dataset.index = i;
    b.dataset.type = "empty";
    b.setAttribute("role", "gridcell");
    b.setAttribute("aria-label", "tile " + (i + 1));
    board.appendChild(b);
    cells.push(b);
  }

  // ---- Toolbar: inject icons + handle selection ----
  const toolButtons = document.querySelectorAll(".tool");
  toolButtons.forEach((btn) => {
    const t = btn.dataset.tool;
    btn.insertAdjacentHTML("afterbegin", ICONS[t] || ICONS.erase);
    btn.addEventListener("click", () => {
      tool = t;
      toolButtons.forEach((b) => b.classList.toggle("active", b === btn));
    });
  });

  // ---- Rendering ----
  function render(i) {
    cells[i].dataset.type = grid[i];
    cells[i].innerHTML = ICONS[grid[i]] || "";
  }
  function renderAll() { for (let i = 0; i < grid.length; i++) render(i); }

  function apply(i) {
    if (i == null || i < 0 || i >= grid.length) return;
    const next = tool === "erase" ? "empty" : tool;
    if (grid[i] === next) return;
    grid[i] = next;
    render(i);
    refresh();
  }

  // ---- Pointer handling (mouse + touch via elementFromPoint) ----
  function cellFromPoint(x, y) {
    const el = document.elementFromPoint(x, y);
    if (!el) return null;
    const c = el.classList.contains("cell") ? el : el.closest(".cell");
    return c ? +c.dataset.index : null;
  }
  board.addEventListener("pointerdown", (e) => {
    painting = true;
    apply(cellFromPoint(e.clientX, e.clientY));
    e.preventDefault();
  });
  board.addEventListener("pointermove", (e) => {
    if (!painting) return;
    apply(cellFromPoint(e.clientX, e.clientY));
  });
  window.addEventListener("pointerup", () => { painting = false; });
  window.addEventListener("pointercancel", () => { painting = false; });

  // ---- Scoring ----
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function neighbors(i) {
    const r = Math.floor(i / GRID), c = i % GRID, out = [];
    if (r > 0) out.push(i - GRID);
    if (r < GRID - 1) out.push(i + GRID);
    if (c > 0) out.push(i - 1);
    if (c < GRID - 1) out.push(i + 1);
    return out;
  }

  function rate(v) {
    if (v < 1) return ["Start building…", "🏗️"];
    if (v < 40) return ["Sketch phase", "✏️"];
    if (v < 60) return ["Getting there", "🙂"];
    if (v < 78) return ["Good planning", "👍"];
    if (v < 92) return ["Strong planner!", "🌟"];
    return ["Master planner!", "🏆"];
  }

  function advice(s, built, empty) {
    if (empty) return "Pick a tile, then click or drag on the grid.";
    if (built === 0) return "Add some homes and buildings — a city needs people.";
    const items = [
      ["greenery", "Plant more parks and trees to balance the buildings."],
      ["housing", "Build more homes and apartments to grow the city."],
      ["livability", "Place parks and water right next to the homes."],
      ["nature", "Add a pond or river — a little water goes a long way."],
    ];
    let min = Infinity, msg = "";
    items.forEach(([k, m]) => { if (s[k] < min) { min = s[k]; msg = m; } });
    return min > 80 ? "Beautifully balanced — a city people would love to live in." : msg;
  }

  function setMeter(key, val) {
    const f = document.getElementById("fill-" + key);
    const v = document.getElementById("val-" + key);
    if (f) f.style.width = clamp(val, 0, 100) + "%";
    if (v) v.textContent = Math.round(clamp(val, 0, 100));
  }

  function refresh() {
    let H = 0, B = 0, P = 0, W = 0;
    grid.forEach((t) => {
      if (t === "house") H++;
      else if (t === "building") B++;
      else if (t === "park") P++;
      else if (t === "water") W++;
    });
    const built = H + B;
    const empty = grid.every((t) => t === "empty");

    // Green & parks: parks proportional to how much is built (~1 park per 2 built)
    const idealParks = built * 0.5;
    const greenery = built === 0 ? 0 : clamp(100 * (1 - Math.abs(P - idealParks) / Math.max(idealParks, 1)), 0, 100);

    // Homes & people: ramp to a target, gentle penalty for over-building
    const targetBuilt = 18;
    let housing = clamp((100 * built) / targetBuilt, 0, 100);
    if (built > 34) housing = clamp(housing - (built - 34) * 4, 0, 100);

    // Green near homes (livability): share of built tiles touching a park or water
    let good = 0;
    grid.forEach((t, i) => {
      if (t === "house" || t === "building") {
        if (neighbors(i).some((n) => grid[n] === "park" || grid[n] === "water")) good++;
      }
    });
    const livability = built === 0 ? 0 : (100 * good) / built;

    // Water & nature: some water is great, too much floods the city
    let water = W === 0 ? 0 : clamp((100 * W) / 5, 0, 100);
    if (W > 12) water = clamp(water - (W - 12) * 5, 0, 100);
    const nature = clamp(water * 0.7 + (Math.min(P, 8) / 8) * 30, 0, 100);

    const overall = Math.round((greenery + housing + livability + nature) / 4);

    setMeter("greenery", greenery);
    setMeter("housing", housing);
    setMeter("livability", livability);
    setMeter("nature", nature);

    const oFill = document.getElementById("overallFill");
    const oVal = document.getElementById("overallVal");
    if (oFill) oFill.style.width = overall + "%";
    if (oVal) oVal.textContent = overall;

    const [label, emoji] = rate(empty ? 0 : overall);
    const ratingEl = document.getElementById("rating");
    const tipEl = document.getElementById("tip");
    if (ratingEl) ratingEl.textContent = emoji + " " + label;
    if (tipEl) tipEl.textContent = advice({ greenery, housing, livability, nature }, built, empty);
  }

  // ---- Buttons ----
  const resetBtn = document.getElementById("resetCity");
  if (resetBtn) resetBtn.addEventListener("click", () => { grid.fill("empty"); renderAll(); refresh(); });

  const demoBtn = document.getElementById("demoCity");
  if (demoBtn) {
    demoBtn.addEventListener("click", () => {
      const map = [
        "PHP.BB.P",
        "HPH.BB.H",
        "..RRRR..",
        "PHP.PHP.",
        "HPH.HPH.",
        "..RRRR..",
        "PHWW.BBP",
        "HPWW.BBH",
      ];
      const key = { P: "park", H: "house", B: "building", W: "water", R: "road", ".": "empty" };
      for (let r = 0; r < GRID; r++) {
        for (let c = 0; c < GRID; c++) {
          grid[r * GRID + c] = key[map[r][c]] || "empty";
        }
      }
      renderAll();
      refresh();
    });
  }

  // ---- Init ----
  renderAll();
  refresh();
})();
