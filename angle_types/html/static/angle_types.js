/*
 * angle_types.js — page controller for one angle ∠ABC = θ and a ray BD inside it.
 *
 * Reads the Python-built config, wires the θ and ∠ABD sliders, and turns a solution into a
 * Manim-style Timeline: from the vertex B the side BA lies along the positive x direction, θ
 * sweeps open to the side BC (with the right-angle square at 90° and a straight line at 180°),
 * the radian measure is traced on a wider arc, the angle outside fills the rest of the turn,
 * then ray BD splits θ into ∠ABD and ∠DBC and the bisector is drawn at θ / 2. The figure keeps
 * equal units across and up so angles look their size. The URL hash (#theta=130&d=50) presets
 * the angle and is watched, so links and PP.embed(...).set() update the page live.
 */
(function () {
  "use strict";
  const { ManimCanvas, Timeline, rate } = window.Manim;
  const { equalView, polar, wedge, arc, rightAngle } = window.GeoFigure;
  const { solve, deg } = window.AngleTypeMath;

  const config = JSON.parse(document.getElementById("pp-config").textContent);
  const C = Object.fromEntries(Object.entries(config.roles).map(([el, role]) => [el, config.theme.stage[role]]));
  const KEYS = ["theta", "d"];

  const $ = (id) => document.getElementById(id);
  const el = {
    play: $("play"), finish: $("finish"), scrub: $("scrub"), speed: $("speed"), narration: $("narration"),
    run: $("run"), error: $("error"), results: $("results"), steps: $("steps"), glossary: $("glossary"),
  };
  const IDLE = "Press run to animate.";
  const RAY = 3;        // side length, in figure units
  const WEDGE = 1.0;    // radius of the θ wedge
  const PARTS = 0.65;   // radius of the ∠ABD and ∠DBC wedges
  const RADIAN = 1.7;   // radius of the radian arc
  const OUTSIDE = 1.3;  // radius of the outside wedge

  const TERMS = {
    "θ = m∠ABC": "The angle's measure: how far side BC is turned from side BA, about the vertex B (the middle letter).",
    "Type": "Acute under 90°, right at 90°, obtuse between 90° and 180°, straight at 180°, reflex between 180° and 360°, a full turn at 360°.",
    "Radians": "The same turn measured by arc length on a circle of radius 1: 180° = π rad, so multiply degrees by π / 180.",
    "Angle outside": "360° − θ: the rest of the turn, going the other way round B. For an angle under 180° it is reflex.",
    "m∠ABD": "The part of θ from side BA to the ray BD.",
    "m∠DBC": "The part of θ from the ray BD on to side BC. With m∠ABD it adds up to θ (the angle addition postulate).",
    "Bisector": "The ray that splits θ into two equal halves, each θ / 2.",
  };

  const state = { ...config.initial, show: {} };
  document.querySelectorAll("[data-show]").forEach((box) => { state.show[box.dataset.show] = box.checked; });

  const scene = new ManimCanvas($("scene"), { theme: config.theme });
  let timeline = null;
  let current = null;

  const swatch = (color) => `<span class="swatch" style="background:${color}"></span>`;
  const written = new WeakMap();
  const setHTML = (node, markup) => { if (written.get(node) !== markup) { node.innerHTML = markup; written.set(node, markup); } };

  function renderGlossary() {
    el.glossary.innerHTML = Object.entries(TERMS).map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("");
  }

  // ---- Panels -----------------------------------------------------------------
  const rows = (items) => items.map(([id, k, v]) =>
    `<dt data-step="${id}" title="${TERMS[k] || ""}">${k}</dt><dd data-step="${id}">${v}</dd>`).join("");

  function renderResults(sol) {
    const t = sol.texts;
    setHTML(el.results, rows([
      ["type", "θ = m∠ABC", `${swatch(C.angle)}${t.theta}`],
      ["type", "Type", sol.type_text],
      ["radians", "Radians", sol.radians_text],
      ["outside", "Angle outside", `${swatch(C.outside)}${t.outside}`],
      ["addition", "m∠ABD", `${swatch(C.abd)}${t.d}`],
      ["addition", "m∠DBC", `${swatch(C.dbc)}${t.dbc}`],
      ["bisector", "Bisector", `${swatch(C.bisector)}${t.bisector} on each side` + (sol.bisected ? ": BD is the bisector" : "")],
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
  function ray(angle, p, color, options = { width: 2.5 }, length = RAY) {
    const [x, y] = polar(0, 0, length, angle);
    scene.line(0, 0, x, y, p, color, options);
  }

  function angleLabel(text, angle, r, p, color, size = 15) {
    const [x, y] = polar(0, 0, r, angle);
    scene.label(text, x, y, p, color, { dx: 0, dy: 0, align: "center", size });
  }

  /** Where to put θ's labels: the middle of the wider of ∠ABD and ∠DBC, so they stay clear of ray BD. */
  const labelAngle = (theta, d) => (!state.show.ray ? theta / 2 : d >= theta - d ? d / 2 : (d + theta) / 2);

  /** A point's letter just past the end of its side. */
  const letter = (name, angle, p, color) => angleLabel(name, angle, RAY + 0.3, p, color, 15);

  // ---- Timeline -------------------------------------------------------------
  function buildTimeline(sol) {
    const show = state.show;
    const { theta, d } = sol.inputs;
    const t = sol.texts;
    const tl = new Timeline(scene, {
      onFrame: (time, length) => { el.scrub.value = length ? Math.round((time / length) * 1000) : 1000; },
      onStep: highlight,
      onDone: () => setPlaying(false),
    });
    tl.speed = Number(el.speed.value);

    if (show.grid) tl.add({ id: "type", duration: 0.6, draw: (p) => scene.grid(p) });
    tl.add({
      id: "type", caption: "The vertex B and the first side, BA", duration: 0.9, parallel: show.grid,
      draw: (p) => {
        ray(0, p, C.rays);
        scene.dot(0, 0, p, C.vertex, 5);
        if (show.labels) { letter("A", 0, p, C.rays); angleLabel("B", 225, 0.35, p, C.vertex, 14); }
      },
    });
    if (show.guides) {
      tl.add({
        id: "type", duration: 0.8, parallel: true,
        draw: (p) => {
          ray(90, p, C.bisector, { width: 1.5, dash: [5, 6] });
          ray(180, p, C.bisector, { width: 1.5, dash: [5, 6] });
          if (show.labels) {
            scene.label("90°", 0, RAY, p, C.bisector, { dx: 0, dy: -12, align: "center", size: 12 });
            scene.label("180°", -RAY, 0, p, C.bisector, { dx: -8, dy: 0, align: "right", size: 12 });
          }
        },
      });
    }

    // θ sweeps open from BA to BC.
    tl.add({
      id: "type", caption: `θ = ${t.theta}: ${sol.type_text}`, duration: 1.6, wait: 0.15,
      draw: (p) => {
        const to = theta * p;
        if (theta > 0) wedge(scene, 0, 0, WEDGE, 0, to, C.angle);
        ray(to, 1, C.angle, { width: 3 });
        if (show.labels && p > 0.6) {
          letter("C", theta, (p - 0.6) / 0.4, C.angle);
          if (theta >= 12) angleLabel(`θ = ${t.theta}`, labelAngle(theta, d), WEDGE + 0.35, (p - 0.6) / 0.4, C.angle, 14);
        }
      },
    });
    if (sol.kind === "right") {
      tl.add({ id: "type", caption: "90°: the sides are perpendicular, marked with a square", duration: 0.8,
        draw: (p) => rightAngle(scene, 0, 0, 0, 0.4, C.marks, { width: 2.5, opacity: p }) });
    } else if (sol.kind === "straight") {
      tl.add({ id: "type", caption: "180°: the two sides make one straight line", duration: 0.8,
        draw: (p) => scene.line(RAY, 0, -RAY, 0, p, C.marks, { width: 4 }) });
    }
    if (theta > 0) tl.add({ id: "type", duration: 0.6, parallel: true, rate: rate.linear, draw: (p) => scene.flash(0, 0, p, C.angle) });

    // The same turn in radians, on a wider arc.
    if (theta > 0) {
      tl.add({
        id: "radians", caption: `In radians: ${t.theta} × π / 180 = ${sol.radians_text}`, duration: 1.2,
        draw: (p) => {
          arc(scene, 0, 0, RADIAN, 0, theta * p, C.marks, { width: 2, dash: [3, 4] });
          if (show.labels && p > 0.7 && theta >= 20) angleLabel(sol.radians_text.split(" ≈ ")[0], labelAngle(theta, d), RADIAN + 0.45, (p - 0.7) / 0.3, C.marks, 13);
        },
      });
    }

    // The rest of the turn, the other way round B.
    if (show.outside && theta > 0 && theta < 360) {
      tl.add({
        id: "outside", caption: `The angle outside: 360° − ${t.theta} = ${t.outside}`, duration: 1.2,
        draw: (p) => {
          wedge(scene, 0, 0, OUTSIDE, theta, theta + (360 - theta) * p, C.outside, { alpha: 0.12, width: 1.5 });
          if (show.labels && p > 0.7 && sol.outside >= 20) angleLabel(t.outside, theta + sol.outside / 2, OUTSIDE + 0.32, (p - 0.7) / 0.3, C.outside, 13);
        },
      });
    }

    // Ray BD splits θ into ∠ABD and ∠DBC.
    if (show.ray && theta > 0) {
      tl.add({
        id: "addition", caption: `Ray BD at ${t.d}: m∠ABD + m∠DBC = ${t.d} + ${t.dbc} = ${t.theta}`, duration: 1.4, wait: 0.15,
        draw: (p) => {
          if (d > 0) wedge(scene, 0, 0, PARTS, 0, d * p, C.abd, { alpha: 0.35 });
          if (sol.dbc > 0) wedge(scene, 0, 0, PARTS * 0.8, d, d + sol.dbc * p, C.dbc, { alpha: 0.35 });
          ray(d, p, C.abd, { width: 2.5, dash: [8, 5] }, RAY * 0.9);
          if (show.labels && p > 0.6) letter("D", d, (p - 0.6) / 0.4, C.abd);
        },
      });
    }

    // The bisector: half of θ on each side.
    if (show.bisector && theta > 0) {
      tl.add({
        id: "bisector", caption: `The bisector at ½ × ${t.theta} = ${t.bisector}` + (sol.bisected ? ": BD is the bisector" : ""), duration: 1.0,
        draw: (p) => ray(sol.bisector, p, C.bisector, { width: 2, dash: [3, 5] }, RAY * 0.75),
      });
      if (sol.bisected) tl.add({ id: "bisector", duration: 0.7, parallel: true, rate: rate.linear, draw: (p) => scene.flash(0, 0, p, C.abd) });
    }
    tl.add({ id: "type", caption: `${t.theta}: ${sol.type_text}`, duration: 0.8, rate: rate.linear, draw: () => {} });
    return tl;
  }

  // ---- Camera: the vertex near the middle, equal units across and up ------------
  function ideal(sol) {
    const { theta } = sol.inputs;
    const lower = theta > 180 || (state.show.outside && theta > 0 && theta < 360);
    const left = theta > 90 || lower;
    return equalView(scene, [left ? -RAY : -0.8, RAY, lower ? -RAY : -0.6, RAY + 0.3], 0.35);
  }

  function frame(sol) {
    scene.moveTo(ideal(sol), { onFrame: () => { if (timeline && !timeline.playing) timeline.render(); } });
  }

  // ---- Controls -------------------------------------------------------------
  function setPlaying(playing) { el.play.textContent = playing ? "❚❚ Pause" : "▶ Play"; }

  function syncInputs() {
    for (const key of KEYS) {
      $(`${key}-range`).value = state[key];
      $(`${key}-num`).value = state[key];
    }
  }

  function update({ fromConfig = false } = {}) {
    if (timeline) timeline.stop();
    setPlaying(false);
    let sol;
    try {
      if (KEYS.some((k) => !Number.isFinite(state[k]))) throw new Error("Enter a number for θ and for φ.");
      sol = fromConfig ? config.solution : solve(state.theta, state.d);
    } catch (err) {
      el.error.textContent = err.message;
      el.error.hidden = false;
      return;
    }
    el.error.hidden = true;
    current = sol;
    renderResults(sol);
    renderSteps(sol);
    timeline = buildTimeline(sol);
    timeline.finish();
    frame(sol);
    PPParams.write({ theta: state.theta, d: state.d });
  }

  function readHash() {
    const values = PPParams.read(KEYS);
    Object.assign(state, values);
    return Object.keys(values).length > 0;
  }

  function play() {
    if (!timeline) return;
    el.run.hidden = true;
    timeline.play();
    setPlaying(true);
  }

  for (const key of KEYS) {
    for (const suffix of ["range", "num"]) {
      $(`${key}-${suffix}`).addEventListener("input", (event) => {
        state[key] = event.target.value === "" ? NaN : Number(event.target.value);
        $(`${key}-${suffix === "range" ? "num" : "range"}`).value = event.target.value;
        // Keep BD inside the angle while θ shrinks below it.
        if (key === "theta" && Number.isFinite(state.theta) && state.d > state.theta) { state.d = state.theta; syncInputs(); }
        update();
      });
    }
  }
  document.querySelectorAll("[data-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      [state.theta, state.d] = button.dataset.preset.split(",").map(Number);
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
