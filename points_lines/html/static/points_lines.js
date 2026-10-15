/*
 * points_lines.js — page controller for four points A, B, C, D on the plane.
 *
 * Reads the Python-built config, wires the coordinates, and turns a solution into a Manim-style
 * Timeline: points A and B, then the segment AB (stopping at both), the ray AB (starting at A,
 * running on through B) and the line AB (both ways); point C, the path A → B → C against the
 * segment AC (segment addition), the collinearity verdict, the plane A, B, C determine when they
 * are not on one line; then line CD and where it meets line AB. The figure keeps equal units across
 * and up. The URL hash (#ax=-3&ay=-1&…) presets the points and is watched, so links and
 * PP.embed(...).set() update the page live.
 */
(function () {
  "use strict";
  const { ManimCanvas, Timeline, rate } = window.Manim;
  const { equalView, polygon } = window.GeoFigure;
  const { solve, fmt } = window.PointsMath;

  const config = JSON.parse(document.getElementById("pp-config").textContent);
  const C = Object.fromEntries(Object.entries(config.roles).map(([el, role]) => [el, config.theme.stage[role]]));
  const KEYS = ["ax", "ay", "bx", "by", "cx", "cy", "dx", "dy"];

  const $ = (id) => document.getElementById(id);
  const el = {
    play: $("play"), finish: $("finish"), scrub: $("scrub"), speed: $("speed"), narration: $("narration"),
    run: $("run"), error: $("error"), results: $("results"), steps: $("steps"), glossary: $("glossary"),
  };
  const IDLE = "Press run to animate.";
  const FAR = 200;  // how far a ray or line is drawn past its points; the stage clips it

  const TERMS = {
    "Segment AB": "The part of the line between endpoints A and B. AB without the bar is its length.",
    "Ray AB": "Starts at endpoint A and runs on through B forever. The first letter is always the endpoint.",
    "Line AB": "Runs forever both ways. Two different points determine exactly one line.",
    "AB + BC": "Segment addition: when B lies on segment AC, AB + BC = AC. Off the segment, the path through B is longer.",
    "Collinear": "On one line. Three points are collinear when the slopes AB and BC agree (or all x are equal).",
    "Plane": "A flat surface running forever. Three points not on one line determine exactly one plane.",
    "Lines AB and CD": "Two lines in a plane meet in one point, never (parallel), or everywhere (the same line).",
  };

  const state = { ...config.initial, show: {} };
  document.querySelectorAll("[data-show]").forEach((box) => { state.show[box.dataset.show] = box.checked; });

  const scene = new ManimCanvas($("scene"), { theme: config.theme });
  let timeline = null;
  let current = null;

  const point = (x, y) => `(${fmt(x)}, ${fmt(y)})`;
  const swatch = (color) => `<span class="swatch" style="background:${color}"></span>`;
  const yes = (holds, text) => (holds ? `<span class="verdict-yes">yes: ${text}</span>` : `<span class="verdict-no">no</span>`);
  const written = new WeakMap();
  const setHTML = (node, markup) => { if (written.get(node) !== markup) { node.innerHTML = markup; written.set(node, markup); } };

  function renderGlossary() {
    el.glossary.innerHTML = Object.entries(TERMS).map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("");
  }

  // ---- Panels -----------------------------------------------------------------
  const rows = (items) => items.map(([id, k, v]) =>
    `<dt data-step="${id}" title="${TERMS[k] || ""}">${k}</dt><dd data-step="${id}">${v}</dd>`).join("");

  function crossing(sol) {
    const { kind, point: meet } = sol.intersection;
    if (kind === "point") return `${swatch(C.meet)}meet once at ${point(...meet)}`;
    return kind === "parallel" ? "parallel: never meet" : "the same line: meet everywhere";
  }

  function renderResults(sol) {
    setHTML(el.results, rows([
      ["segment", "Segment AB", `${swatch(C.segment)}length ${fmt(sol.ab)}`],
      ["addition", "AB + BC", `${fmt(sol.ab)} + ${fmt(sol.bc)} = ${fmt(sol.ab + sol.bc)}; AC = ${fmt(sol.ac)}`],
      ["addition", "B between A and C", yes(sol.between, "AB + BC = AC")],
      ["collinear", "Collinear", yes(sol.collinear, "A, B and C are on one line")],
      ["plane", "Plane", sol.plane ? "exactly one plane through A, B, C" : "many planes (A, B, C are on one line)"],
      ["intersection", "Lines AB and CD", crossing(sol)],
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
  /** A point's letter just off it, away from the centre of the figure. */
  function letter(name, x, y, p, color, sol) {
    const [x0, x1, y0, y1] = sol.bounds;
    const right = x >= (x0 + x1) / 2, up = y >= (y0 + y1) / 2;
    scene.label(name, x, y, p, color, { dx: right ? 10 : -10, dy: up ? -12 : 20, align: right ? "left" : "right", size: 16 });
  }

  // ---- Timeline -------------------------------------------------------------
  function buildTimeline(sol) {
    const show = state.show;
    const { ax, ay, bx, by, cx, cy, dx, dy } = sol.inputs;
    const tl = new Timeline(scene, {
      onFrame: (time, length) => { el.scrub.value = length ? Math.round((time / length) * 1000) : 1000; },
      onStep: highlight,
      onDone: () => setPlaying(false),
    });
    tl.speed = Number(el.speed.value);

    if (show.grid) tl.add({ id: "segment", duration: 0.6, draw: (p) => scene.grid(p) });
    tl.add({ id: "segment", caption: "The plane, with x and y axes", duration: 0.8, parallel: show.grid, draw: (p) => scene.axes(p) });
    tl.add({
      id: "segment", caption: `Points A ${point(ax, ay)} and B ${point(bx, by)}`, duration: 0.7,
      draw: (p) => {
        scene.dot(ax, ay, p, C.points); scene.dot(bx, by, p, C.points);
        if (show.labels) { letter("A", ax, ay, p, C.points, sol); letter("B", bx, by, p, C.points, sol); }
      },
    });
    tl.add({
      id: "segment", caption: `Segment AB stops at A and B: AB = ${fmt(sol.ab)}`, duration: 1.0,
      draw: (p) => scene.line(ax, ay, bx, by, p, C.segment, { width: 5 }),
    });
    if (show.ray) {
      tl.add({
        id: "segment", caption: "Ray AB starts at A and runs on through B forever", duration: 1.0,
        draw: (p) => scene.line(bx, by, ax + FAR * (bx - ax), ay + FAR * (by - ay), p, C.ray, { width: 2.5, dash: [9, 6] }),
      });
    }
    if (show.line) {
      tl.add({
        id: "segment", caption: "Line AB runs both ways", duration: 1.0,
        draw: (p) => scene.line(ax, ay, ax - FAR * (bx - ax), ay - FAR * (by - ay), p, C.line, { width: 2 }),
      });
      tl.add({ id: "segment", duration: 1.0, parallel: true, draw: (p) => scene.line(bx, by, ax + FAR * (bx - ax), ay + FAR * (by - ay), p, C.line, { width: 2 }) });
    }

    // Point C and segment addition.
    tl.add({
      id: "addition", caption: `Point C ${point(cx, cy)}`, duration: 0.6,
      draw: (p) => { scene.dot(cx, cy, p, C.points); if (show.labels) letter("C", cx, cy, p, C.points, sol); },
    });
    if (show.path) {
      tl.add({
        id: "addition", caption: `The path A → B → C: AB + BC = ${fmt(sol.ab)} + ${fmt(sol.bc)} = ${fmt(sol.ab + sol.bc)}`, duration: 1.3,
        draw: (p) => {
          const first = Math.min(1, p * 2), second = Math.max(0, p * 2 - 1);
          scene.line(ax, ay, bx, by, first, C.path, { width: 3, dash: [4, 5] });
          if (second > 0) scene.line(bx, by, cx, cy, second, C.path, { width: 3, dash: [4, 5] });
        },
      });
    }
    tl.add({
      id: "addition", caption: sol.between ? `AC = ${fmt(sol.ac)} = AB + BC: B is between A and C` : `AC = ${fmt(sol.ac)}, shorter than AB + BC: B is not between A and C`,
      duration: 1.0, draw: (p) => scene.line(ax, ay, cx, cy, p, C.segment, { width: 3 }),
    });

    // Collinear, or a plane.
    tl.add({
      id: "collinear", caption: sol.collinear ? "Equal slopes: A, B and C are collinear" : "Different slopes: A, B and C are not collinear",
      duration: 0.8, rate: rate.linear, draw: (p) => { if (sol.collinear) scene.flash(bx, by, p, C.segment); },
    });
    if (sol.plane) {
      tl.add({
        id: "plane", caption: "Three points not on one line determine exactly one plane", duration: 1.0,
        draw: (p) => polygon(scene, [[ax, ay], [bx, by], [cx, cy]], C.guide, { fill: C.guide, alpha: 0.18 * p, width: 1, opacity: p }),
      });
    }

    // Line CD and where it meets line AB.
    if (show.cd) {
      tl.add({
        id: "intersection", caption: `Point D ${point(dx, dy)} and line CD`, duration: 1.2,
        draw: (p) => {
          scene.dot(dx, dy, Math.min(1, p * 2), C.points);
          if (show.labels) letter("D", dx, dy, Math.min(1, p * 2), C.points, sol);
          scene.line(cx, cy, cx - FAR * (dx - cx), cy - FAR * (dy - cy), p, C.other, { width: 2 });
          scene.line(cx, cy, cx + FAR * (dx - cx), cy + FAR * (dy - cy), p, C.other, { width: 2 });
        },
      });
      const { kind, point: meet } = sol.intersection;
      if (kind === "point") {
        tl.add({
          id: "intersection", caption: `Lines AB and CD meet once, at ${point(...meet)}`, duration: 0.7,
          draw: (p) => { scene.dot(meet[0], meet[1], p, C.meet, 8); if (show.labels) scene.label(point(...meet), meet[0], meet[1], p, C.meet, { dx: 12, dy: 22 }); },
        });
        tl.add({ id: "intersection", duration: 0.7, parallel: true, rate: rate.linear, draw: (p) => scene.flash(meet[0], meet[1], p, C.meet) });
      } else {
        tl.add({ id: "intersection", caption: kind === "parallel" ? "Same slope, different lines: parallel, they never meet" : "Lines AB and CD are the same line: they meet everywhere",
          duration: 1.0, rate: rate.linear, draw: () => {} });
      }
    }
    return tl;
  }

  // ---- Camera: every point in view, equal units across and up ---------------------
  const ideal = (sol) => equalView(scene, sol.bounds, 1.2);

  function frame(sol) {
    scene.moveTo(ideal(sol), { onFrame: () => { if (timeline && !timeline.playing) timeline.render(); } });
  }

  // ---- Controls -------------------------------------------------------------
  function setPlaying(playing) { el.play.textContent = playing ? "❚❚ Pause" : "▶ Play"; }

  function syncInputs() {
    for (const key of KEYS) $(`${key}-num`).value = state[key];
  }

  function update({ fromConfig = false } = {}) {
    if (timeline) timeline.stop();
    setPlaying(false);
    let sol;
    try {
      if (KEYS.some((k) => !Number.isFinite(state[k]))) throw new Error("Enter a number for every coordinate.");
      sol = fromConfig ? config.solution : solve(...KEYS.map((k) => state[k]));
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
    PPParams.write(Object.fromEntries(KEYS.map((k) => [k, state[k]])));
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
    $(`${key}-num`).addEventListener("input", (event) => {
      state[key] = event.target.value === "" ? NaN : Number(event.target.value);
      update();
    });
  }
  document.querySelectorAll("[data-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      button.dataset.preset.split(",").map(Number).forEach((v, i) => { state[KEYS[i]] = v; });
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
