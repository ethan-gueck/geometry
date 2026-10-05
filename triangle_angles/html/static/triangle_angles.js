/*
 * triangle_angles.js — page controller for the triangle angle sum A + B + C = 180°.
 *
 * Reads the Python-built config, wires the A, B and C sliders, and turns a
 * solution into a Manim-style Timeline. When the angles add up to 180° it
 * draws the triangle (side AB along the bottom) and its three angles, then
 * runs the classic proof: a line through C parallel to AB, with A and B
 * carried up their sides to C, where alternate interior angles put them either
 * side of C and the three fill the straight line. When they do not add up to
 * 180°, no triangle exists, so the three angles are laid side by side at one
 * point on a line instead, showing the gap they leave or how far they overlap
 * past it. The figure keeps equal units across and up so angles look their
 * size. The URL hash (#a=60&b=70&c=50) presets the angles and is watched, so
 * links and PP.embed(...).set() update the page live.
 */
(function () {
  "use strict";
  const { ManimCanvas, Timeline, rate } = window.Manim;
  const { equalView, polar, wedge, arc } = window.GeoFigure;
  const { solve, fmt, deg } = window.TriangleMath;
  const { clean } = window.GeoFmt;

  const config = JSON.parse(document.getElementById("pp-config").textContent);
  const C = Object.fromEntries(Object.entries(config.roles).map(([el, role]) => [el, config.theme.stage[role]]));

  const $ = (id) => document.getElementById(id);
  const el = {
    play: $("play"), finish: $("finish"), scrub: $("scrub"), speed: $("speed"), narration: $("narration"),
    run: $("run"), error: $("error"), results: $("results"), steps: $("steps"), glossary: $("glossary"), complete: $("complete"),
  };
  const IDLE = "Press run to animate.";
  const KEYS = ["a", "b", "c"];
  const LINE = 3;  // half-length of the line the angles are laid along when they make no triangle

  const TERMS = {
    "A, B, C": "The interior angles of the triangle, at corners A, B and C, in degrees.",
    "A + B + C": "Their sum. For every triangle it is 180°, the angle of a straight line.",
    "Triangle": "Three angles belong to a triangle exactly when each is more than 0° and they add up to 180°.",
    "Off by": "How far the sum falls short of 180° or goes over it. Any miss means no triangle has these angles.",
    "Parallel line": "The line through C that never meets AB. It makes equal alternate interior angles with sides AC and BC.",
    "Alternate interior angles": "The angles on opposite sides of a line crossing two parallel lines, between them. They are equal, so A and B appear again at C.",
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
    const off = sol.miss === 0 ? "0°" : `${t.miss} ${sol.miss > 0 ? "short of" : "over"} 180°`;
    setHTML(el.results, rows([
      ["angles", "A", `${swatch(C.a)}${t.a}`],
      ["angles", "B", `${swatch(C.b)}${t.b}`],
      ["angles", "C", `${swatch(C.c)}${t.c}`],
      ["sum", "A + B + C", `${swatch(C.straight)}${t.total}`],
      ["check", "Triangle", sol.is_triangle ? `<span class="verdict-yes">yes: A + B + C = 180°</span>` : `<span class="verdict-no">no</span>`],
      ["check", "Off by", off],
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
  const lerp = (u, v, p) => u + (v - u) * p;

  /** A label at distance r from (x, y) in direction `angle`, centred there. */
  function polarLabel(text, x, y, r, angle, p, color, size = 14) {
    const [lx, ly] = polar(x, y, r, angle);
    scene.label(text, lx, ly, p, color, { dx: 0, dy: 0, align: "center", size });
  }

  // ---- Timeline: the triangle and the parallel-line proof ------------------------
  function triangleSteps(tl, sol) {
    const show = state.show;
    const { a, b, c } = sol.inputs;
    const t = sol.texts;
    const { A, B, C: P } = sol.vertices;
    const sides = [Math.hypot(B[0] - A[0], B[1] - A[1]), Math.hypot(P[0] - B[0], P[1] - B[1]), Math.hypot(P[0] - A[0], P[1] - A[1])];
    const r = Math.min(0.95, 0.32 * Math.min(...sides));  // wedge radius, small enough for the shortest side
    const left = Math.min(0, P[0]) - 1.3, right = Math.max(B[0], P[0]) + 1.3;

    // Each corner's wedge: [from, to] directions, anticlockwise.
    const corners = [
      { key: "a", name: "A", at: A, from: 0, to: a, color: C.a, text: t.a },
      { key: "b", name: "B", at: B, from: 180 - b, to: 180, color: C.b, text: t.b },
      { key: "c", name: "C", at: P, from: 180 + a, to: 360 - b, color: C.c, text: t.c },
    ];
    const names = [[A, "A", -12, 14, "right"], [B, "B", 12, 14, "left"], [P, "C", 0, -16, "center"]];

    tl.add({
      id: "angles", caption: "A triangle ABC, with side AB along the bottom", duration: 1.5, parallel: show.grid,
      draw: (p) => {
        [[A, B], [B, P], [P, A]].forEach(([u, v], i) => {
          const local = Math.min(Math.max(p * 3 - i, 0), 1);
          if (local > 0) scene.line(u[0], u[1], v[0], v[1], local, C.sides, { width: 2.5 });
        });
        if (show.labels) names.forEach(([[x, y], name, dx, dy, align]) => scene.label(name, x, y, p, C.sides, { dx, dy, align, size: 15 }));
      },
    });
    corners.forEach((corner) => tl.add({
      id: "angles", caption: `${corner.name} = ${corner.text}`, duration: 0.8,
      draw: (p) => {
        wedge(scene, corner.at[0], corner.at[1], r, corner.from, lerp(corner.from, corner.to, p), corner.color);
        if (show.labels && p > 0.5) polarLabel(corner.text, corner.at[0], corner.at[1], r + 0.42, (corner.from + corner.to) / 2, (p - 0.5) * 2, corner.color, 13);
      },
    }));
    tl.add({ id: "sum", caption: `A + B + C = ${t.a} + ${t.b} + ${t.c} = ${t.total}`, duration: 1.0, rate: rate.linear, draw: () => {} });

    if (show.proof) {
      tl.add({
        id: "proof", caption: "Draw the line through C parallel to AB", duration: 1.0,
        draw: (p) => scene.line(lerp(P[0], left, p), P[1], lerp(P[0], right, p), P[1], 1, C.parallel, { width: 2, dash: [7, 6] }),
      });
      // A and B travel up their sides to C, turning half a turn: alternate interior angles.
      [[corners[0], "AC"], [corners[1], "BC"]].forEach(([corner, side]) => tl.add({
        id: "proof", caption: `${corner.name} reappears at C: alternate interior angles along ${side}`, duration: 1.4, wait: 0.15,
        draw: (p) => {
          const x = lerp(corner.at[0], P[0], p), y = lerp(corner.at[1], P[1], p);
          wedge(scene, x, y, r, corner.from + 180 * p, corner.to + 180 * p, corner.color, { alpha: 0.4 });
          if (show.labels && p > 0.85) polarLabel(corner.name, P[0], P[1], r * 0.62, (corner.from + corner.to) / 2 + 180, (p - 0.85) / 0.15, corner.color, 12);
        },
      }));
      tl.add({
        id: "check", caption: `At C, A, C and B fill the straight line: ${t.a} + ${t.c} + ${t.b} = 180°`, duration: 1.0,
        draw: (p) => {
          arc(scene, P[0], P[1], r + 0.08, 180, 180 + 180 * p, C.straight, { width: 3 });
          scene.line(left, P[1], right, P[1], p, C.straight, { width: 3 });
          if (show.labels) scene.label("A + B + C = 180°", P[0], P[1], p, C.straight, { dx: 0, dy: -40, align: "center" });
        },
      });
    } else {
      tl.add({
        id: "check", caption: "A + B + C = 180°: these angles make a triangle", duration: 0.8,
        draw: (p) => { if (show.labels) scene.label("A + B + C = 180°", P[0], P[1], p, C.straight, { dx: 0, dy: -40, align: "center" }); },
      });
    }
    tl.add({ id: "check", duration: 0.7, parallel: true, rate: rate.linear, draw: (p) => scene.flash(P[0], P[1], p, C.straight) });
  }

  // ---- Timeline: no triangle, so the angles side by side on a line ---------------
  function straightLineSteps(tl, sol) {
    const show = state.show;
    const { a, b } = sol.inputs;
    const t = sol.texts;
    const total = sol.total;
    const R = 1.6;  // wedge radius
    const short = sol.miss > 0;

    tl.add({
      id: "angles", caption: "No triangle to draw, so lay the three angles side by side along a line", duration: 1.0, parallel: show.grid,
      draw: (p) => {
        scene.line(0, 0, LINE * p, 0, 1, C.sides, { width: 2.5 });
        scene.line(0, 0, -LINE * p, 0, 1, C.sides, { width: 2.5 });
        scene.dot(0, 0, p, C.sides, 4);
        if (show.labels) scene.label("a straight line: 180°", LINE, 0, p, C.parallel, { dx: 0, dy: 16, align: "right", size: 12 });
      },
    });
    [["A", 0, a, C.a, t.a], ["B", a, a + b, C.b, t.b], ["C", a + b, total, C.c, t.c]].forEach(([name, from, to, color, text]) => tl.add({
      id: "angles", caption: `${name} = ${text}, next to the one before`, duration: 0.9,
      draw: (p) => {
        const end = lerp(from, to, p);
        wedge(scene, 0, 0, R, from, end, color);
        scene.line(0, 0, ...polar(0, 0, LINE * 0.85, end), 1, color, { width: 2 });
        if (show.labels && p > 0.5) polarLabel(`${name} = ${text}`, 0, 0, R + 0.45, (from + to) / 2, (p - 0.5) * 2, color, 13);
      },
    }));
    tl.add({ id: "sum", caption: `A + B + C = ${t.a} + ${t.b} + ${t.c} = ${t.total}`, duration: 0.9, rate: rate.linear, draw: () => {} });
    tl.add({
      id: "proof", caption: `${t.total} is ${t.miss} ${short ? "short of" : "over"} the straight line: ${short ? "a gap is left" : "the angles overlap past it"}`, duration: 1.1,
      draw: (p) => {
        const from = short ? total : 180, to = short ? 180 : total;
        wedge(scene, 0, 0, R + 0.25, from, lerp(from, to, p), C.gap, { alpha: 0.22, width: 2.5 });
        if (show.labels && p > 0.6) polarLabel(`${t.miss} ${short ? "gap" : "over"}`, 0, 0, R + 0.95, (from + to) / 2, (p - 0.6) / 0.4, C.gap, 13);
      },
    });
    tl.add({ id: "check", caption: `${t.total} ≠ 180°: no triangle has these angles`, duration: 0.9, rate: rate.linear, draw: () => {} });
  }

  function buildTimeline(sol) {
    const tl = new Timeline(scene, {
      onFrame: (time, length) => { el.scrub.value = length ? Math.round((time / length) * 1000) : 1000; },
      onStep: highlight,
      onDone: () => setPlaying(false),
    });
    tl.speed = Number(el.speed.value);
    if (state.show.grid) tl.add({ id: "angles", duration: 0.6, draw: (p) => scene.grid(p) });
    if (sol.vertices) triangleSteps(tl, sol);
    else straightLineSteps(tl, sol);
    return tl;
  }

  // ---- Camera: the whole figure, equal units across and up ------------------------
  function ideal(sol) {
    if (sol.vertices) {
      const { B, C: P } = sol.vertices;
      return equalView(scene, [Math.min(0, P[0]) - 1.3, Math.max(B[0], P[0]) + 1.3, -0.5, P[1] + 1.3], 0.4);  // room above C for the sum
    }
    const below = sol.total > 180 ? -LINE : -0.6;  // the lower half only when the angles pass the straight line
    return equalView(scene, [-LINE, LINE, below, LINE], 0.4);
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
    if (KEYS.some((key) => !Number.isFinite(state[key]) || state[key] <= 0 || state[key] >= 180)) {
      el.error.textContent = "Enter three angles between 0° and 180°.";
      el.error.hidden = false;
      return;
    }
    el.error.hidden = true;
    const sol = fromConfig ? config.solution : solve(state.a, state.b, state.c);
    current = sol;
    renderResults(sol);
    renderSteps(sol);
    timeline = buildTimeline(sol);
    timeline.finish();
    frame(sol);
    PPParams.write({ a: state.a, b: state.b, c: state.c });
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
        update();
      });
    }
  }
  document.querySelectorAll("[data-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      [state.a, state.b, state.c] = button.dataset.preset.split(",").map(Number);
      syncInputs();
      update();
      play();
    });
  });
  // The C that completes A and B: page plumbing to reach a triangle quickly.
  el.complete.addEventListener("click", () => {
    const c = clean(180 - state.a - state.b);
    if (!(c > 0)) {
      el.error.textContent = `A + B = ${fmt(state.a + state.b)}° already reaches 180°, so no C is left. Make A or B smaller.`;
      el.error.hidden = false;
      return;
    }
    state.c = c;
    syncInputs();
    update();
    play();
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
