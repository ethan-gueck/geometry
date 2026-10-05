/*
 * angles.js — page controller for two adjacent angles α and β.
 *
 * Reads the Python-built config, wires the α and β sliders, and turns a
 * solution into a Manim-style Timeline: from one vertex the first ray lies
 * along the positive x direction, α sweeps open from it, β sweeps open next to
 * α, and the outer angle α + β is traced round both. The last step says what
 * the two outer rays make: a corner (complementary, with the square right-angle
 * mark), a straight line (supplementary), or neither, with the gap to the
 * nearest of the two. The figure keeps equal units across and up so angles
 * look their size. The URL hash (#a=30&b=60) presets the angles and is
 * watched, so links and PP.embed(...).set() update the page live.
 */
(function () {
  "use strict";
  const { ManimCanvas, Timeline, rate } = window.Manim;
  const { equalView, polar, wedge, arc, rightAngle } = window.GeoFigure;
  const { solve, deg } = window.AngleMath;

  const config = JSON.parse(document.getElementById("pp-config").textContent);
  const C = Object.fromEntries(Object.entries(config.roles).map(([el, role]) => [el, config.theme.stage[role]]));

  const $ = (id) => document.getElementById(id);
  const el = {
    play: $("play"), finish: $("finish"), scrub: $("scrub"), speed: $("speed"), narration: $("narration"),
    run: $("run"), error: $("error"), results: $("results"), steps: $("steps"), glossary: $("glossary"),
  };
  const IDLE = "Press run to animate.";
  const RAY = 3;            // ray length, in figure units
  const WEDGE = 1.1;        // radius of the α and β wedges
  const OUTER = 1.75;       // radius of the α + β arc

  const TERMS = {
    "α": "The first angle, opened from the first ray. Angles here are in degrees: a full turn is 360°.",
    "β": "The second angle. It is adjacent to α: the two share a vertex and one ray, and do not overlap.",
    "α + β": "The angle between the two outer rays, made of α and β together.",
    "Complementary": "Two angles that add up to 90°. Side by side, they make a corner: a right angle, marked with a small square.",
    "β for a corner": "The angle that would make α complementary: 90° − α. Only angles under 90° have a complement.",
    "Supplementary": "Two angles that add up to 180°. Side by side, they make a straight line.",
    "β for a straight line": "The angle that would make α supplementary: 180° − α. Only angles under 180° have a supplement.",
  };

  const state = { ...config.initial, show: {} };
  document.querySelectorAll("[data-show]").forEach((box) => { state.show[box.dataset.show] = box.checked; });

  const scene = new ManimCanvas($("scene"), { theme: config.theme });
  let timeline = null;
  let current = null;

  const swatch = (color) => `<span class="swatch" style="background:${color}"></span>`;
  const written = new WeakMap();
  const setHTML = (node, markup) => { if (written.get(node) !== markup) { node.innerHTML = markup; written.set(node, markup); } };
  const yes = (holds, text) => (holds ? `<span class="verdict-yes">yes: ${text}</span>` : `<span class="verdict-no">no</span>`);

  function renderGlossary() {
    el.glossary.innerHTML = Object.entries(TERMS).map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("");
  }

  // ---- Panels -----------------------------------------------------------------
  const rows = (items) => items.map(([id, k, v]) =>
    `<dt data-step="${id}" title="${TERMS[k] || ""}">${k}</dt><dd data-step="${id}">${v}</dd>`).join("");

  function renderResults(sol) {
    const t = sol.texts;
    const need = (target, value) => (value > 0 ? `${target}° − ${t.a} = ${deg(value)}` : `none: α is already ${t.a}`);
    setHTML(el.results, rows([
      ["alpha", "α", `${swatch(C.alpha)}${t.a}`],
      ["beta", "β", `${swatch(C.beta)}${t.b}`],
      ["total", "α + β", `${swatch(C.total)}${t.total}`],
      ["complementary", "Complementary", yes(sol.complementary, "α + β = 90°, a corner")],
      ["complementary", "β for a corner", need(90, sol.needs.complementary)],
      ["supplementary", "Supplementary", yes(sol.supplementary, "α + β = 180°, a straight line")],
      ["supplementary", "β for a straight line", need(180, sol.needs.supplementary)],
    ]));
  }

  function renderSteps(sol) {
    setHTML(el.steps, sol.steps.map(({ id, title, math }) =>
      `<li class="steps__item" data-step="${id}"><p class="steps__title">${title}</p><p class="steps__math">${math}</p></li>`).join(""));
  }

  function highlight(step) {
    el.narration.textContent = step ? step.caption : IDLE;
    document.querySelectorAll("[data-step]").forEach((node) => {
      node.classList.toggle("is-active", !!step && node.dataset.step === step.id);
    });
  }

  // ---- Drawing helpers ------------------------------------------------------------
  /** A ray from the vertex at `angle`, drawn out to length RAY · p. */
  function ray(angle, p, color, options = { width: 2.5 }) {
    const [x, y] = polar(0, 0, RAY, angle);
    scene.line(0, 0, x, y, p, color, options);
  }

  /** A label at distance r from the vertex in direction `angle`, centred there. */
  function angleLabel(text, angle, r, p, color, size = 15) {
    const [x, y] = polar(0, 0, r, angle);
    scene.label(text, x, y, p, color, { dx: 0, dy: 0, align: "center", size });
  }

  /** Where α's and β's values go: between their wedges and the α + β arc, clear of the right-angle mark. */
  const LABEL = (WEDGE + OUTER) / 2;

  // ---- Timeline -------------------------------------------------------------
  function buildTimeline(sol) {
    const show = state.show;
    const { a, b } = sol.inputs;
    const total = sol.total;
    const t = sol.texts;
    const tl = new Timeline(scene, {
      onFrame: (time, length) => { el.scrub.value = length ? Math.round((time / length) * 1000) : 1000; },
      onStep: highlight,
      onDone: () => setPlaying(false),
    });
    tl.speed = Number(el.speed.value);

    if (show.grid) tl.add({ id: "alpha", duration: 0.6, draw: (p) => scene.grid(p) });
    tl.add({
      id: "alpha", caption: "One vertex and a first ray along it", duration: 0.9, parallel: show.grid,
      draw: (p) => { ray(0, p, C.rays); scene.dot(0, 0, p, C.vertex, 5); },
    });
    if (show.guides) {
      tl.add({
        id: "alpha", duration: 0.8, parallel: true,
        draw: (p) => {
          ray(90, p, C.guide, { width: 1.5, dash: [5, 6] });
          ray(180, p, C.guide, { width: 1.5, dash: [5, 6] });
          if (show.labels) {
            scene.label("90°: a corner", 0, RAY, p, C.guide, { dx: 0, dy: -12, align: "center", size: 12 });
            scene.label("180°: a straight line", -RAY, 0, p, C.guide, { dx: -8, dy: 0, align: "right", size: 12 });
          }
        },
      });
    }

    // α sweeps open from the first ray, then β from α's second ray.
    const sweep = (id, from, size, color, name, text) => tl.add({
      id, caption: `${name} = ${text}: open it from the ray at ${deg(from)}`, duration: 1.3, wait: 0.15,
      draw: (p) => {
        const to = from + size * p;
        if (show.arcs) wedge(scene, 0, 0, WEDGE, from, to, color);
        ray(to, 1, color, { width: 2.5 });
        if (show.labels && p > 0.5) angleLabel(`${name} = ${text}`, from + size / 2, LABEL, (p - 0.5) * 2, color, 14);
      },
    });
    sweep("alpha", 0, a, C.alpha, "α", t.a);
    sweep("beta", a, b, C.beta, "β", t.b);
    tl.add({ id: "beta", duration: 0.5, parallel: true, rate: rate.linear, draw: () => {} });

    // The outer angle: one arc round both.
    tl.add({
      id: "total", caption: `α + β = ${t.a} + ${t.b} = ${t.total}: the angle between the outer rays`, duration: 1.2, wait: 0.2,
      draw: (p) => {
        if (total > 0) arc(scene, 0, 0, OUTER, 0, total * p, C.total, { width: 3 });
        if (show.labels && p > 0.6) angleLabel(`α + β = ${t.total}`, total / 2, OUTER + 0.42, (p - 0.6) / 0.4, C.total);
      },
    });

    // What the outer rays make.
    if (sol.complementary) {
      tl.add({
        id: "complementary", caption: `α + β = 90°: complementary, the outer rays make a corner`, duration: 0.9,
        draw: (p) => rightAngle(scene, 0, 0, 0, 0.42, C.total, { width: 2.5, opacity: p }),
      });
      tl.add({ id: "complementary", duration: 0.7, parallel: true, rate: rate.linear, draw: (p) => scene.flash(0, 0, p, C.total) });
    } else if (sol.supplementary) {
      tl.add({
        id: "supplementary", caption: `α + β = 180°: supplementary, the outer rays make a straight line`, duration: 1.0,
        draw: (p) => scene.line(RAY, 0, -RAY, 0, p, C.total, { width: 4 }),
      });
      tl.add({ id: "supplementary", duration: 0.7, parallel: true, rate: rate.linear, draw: (p) => scene.flash(0, 0, p, C.total) });
    } else {
      // The gap to the nearer of 90° and 180°, as a dashed warning arc.
      const target = Math.abs(total - 90) <= Math.abs(total - 180) ? 90 : 180;
      const gap = Math.abs(total - target);
      const word = (mark) => (total < mark ? `${deg(mark - total)} short of` : `${deg(total - mark)} past`);
      tl.add({
        id: target === 90 ? "complementary" : "supplementary",
        caption: `α + β = ${t.total}: neither. It is ${word(90)} a corner and ${word(180)} a straight line`, duration: 1.0,
        draw: (p) => {
          wedge(scene, 0, 0, OUTER, total, total + (target - total) * p, C.gap, { alpha: 0.18, width: 2 });
          if (show.labels && p > 0.6 && gap >= 4) angleLabel(`${deg(gap)} ${total < target ? "short" : "over"}`, (total + target) / 2, OUTER + 0.42, (p - 0.6) / 0.4, C.gap, 13);
        },
      });
    }
    tl.add({ id: sol.complementary ? "complementary" : "supplementary", caption: `${t.a} and ${t.b}: ${sol.verdict}`, duration: 1.0, rate: rate.linear, draw: () => {} });
    return tl;
  }

  // ---- Camera: the vertex near the middle, equal units across and up ------------
  function ideal(sol) {
    const below = sol.total > 180 ? -RAY : -0.6;  // the lower half only when α + β goes past a straight line
    return equalView(scene, [-RAY, RAY, below, RAY + 0.3], 0.35);  // room above for the 90° guide's label
  }

  function frame(sol) {
    scene.moveTo(ideal(sol), { onFrame: () => { if (timeline && !timeline.playing) timeline.render(); } });
  }

  // ---- Controls -------------------------------------------------------------
  function setPlaying(playing) { el.play.textContent = playing ? "❚❚ Pause" : "▶ Play"; }

  function syncInputs() {
    for (const key of ["a", "b"]) {
      $(`${key}-range`).value = state[key];
      $(`${key}-num`).value = state[key];
    }
  }

  function update({ fromConfig = false } = {}) {
    if (timeline) timeline.stop();
    setPlaying(false);
    if ([state.a, state.b].some((n) => !Number.isFinite(n) || n < 0 || n > 180)) {
      el.error.textContent = "Enter α and β between 0° and 180°.";
      el.error.hidden = false;
      return;
    }
    el.error.hidden = true;
    const sol = fromConfig ? config.solution : solve(state.a, state.b);
    current = sol;
    renderResults(sol);
    renderSteps(sol);
    timeline = buildTimeline(sol);
    timeline.finish();
    frame(sol);
    PPParams.write({ a: state.a, b: state.b });
  }

  function readHash() {
    const values = PPParams.read(["a", "b"]);
    Object.assign(state, values);
    return Object.keys(values).length > 0;
  }

  function play() {
    if (!timeline) return;
    el.run.hidden = true;
    timeline.play();
    setPlaying(true);
  }

  for (const key of ["a", "b"]) {
    for (const suffix of ["range", "num"]) {
      $(`${key}-${suffix}`).addEventListener("input", (event) => {
        state[key] = event.target.value === "" ? NaN : Number(event.target.value);
        $(`${key}-${suffix === "range" ? "num" : "range"}`).value = event.target.value;
        update();
      });
    }
  }
  document.querySelectorAll("[data-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      [state.a, state.b] = button.dataset.preset.split(",").map(Number);
      syncInputs();
      update();
      play();
    });
  });
  document.querySelectorAll("[data-show]").forEach((box) => {
    box.addEventListener("change", () => { state.show[box.dataset.show] = box.checked; update(); });
  });
  el.play.addEventListener("click", () => {
    if (!timeline) return;
    if (timeline.playing) { timeline.stop(); setPlaying(false); return; }
    el.run.hidden = true;
    timeline.play({ from: timeline.time });
    setPlaying(true);
  });
  el.run.addEventListener("click", play);
  el.finish.addEventListener("click", () => { if (timeline) { timeline.finish(); setPlaying(false); } });
  el.scrub.addEventListener("input", () => { if (timeline) { timeline.seek(el.scrub.value / 1000); setPlaying(false); } });
  el.speed.addEventListener("change", () => { if (timeline) timeline.speed = Number(el.speed.value); });
  // A new canvas shape changes the units per pixel, so re-square the figure.
  scene.onResize = () => { if (current) scene.setView(ideal(current)); if (timeline) timeline.render(); };
  window.addEventListener("hashchange", () => { if (readHash()) { syncInputs(); update(); } });

  renderGlossary();
  const fromHash = readHash();
  syncInputs();
  scene.setView(ideal(config.solution));
  update({ fromConfig: !fromHash });
})();
