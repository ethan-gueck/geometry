/*
 * pythagorean.js — page controller for the Pythagorean theorem a² + b² = c².
 *
 * Reads the Python-built config, wires the mode picker and the side sliders,
 * and turns a solution into a Manim-style Timeline. With legs a and b it draws
 * the right triangle (right angle at C, leg a along the bottom), grows a
 * square outward on each side, and shows the two smaller squares' areas adding
 * up to the square on the hypotenuse, c² = a² + b², before taking the root for
 * c. Testing any three sides draws the triangle they make, with a dashed ray
 * where side b would sit for a right angle, and compares c² with a² + b²:
 * acute, right or obtuse. Lengths that cannot close are laid flat to show the
 * gap. The figure keeps equal units across and up so squares stay square. The
 * URL hash (#a=3&b=4 for legs, #a=5&b=6&c=7 for three sides) presets the page
 * and is watched, so links and PP.embed(...).set() update the page live.
 */
(function () {
  "use strict";
  const { ManimCanvas, Timeline, rate } = window.Manim;
  const { equalView, unit, wedge, polygon, segments, rightAngle } = window.GeoFigure;
  const { solve, classify, fmt } = window.PythagorasMath;

  const config = JSON.parse(document.getElementById("pp-config").textContent);
  const C = Object.fromEntries(Object.entries(config.roles).map(([el, role]) => [el, config.theme.stage[role]]));

  const $ = (id) => document.getElementById(id);
  const el = {
    play: $("play"), finish: $("finish"), scrub: $("scrub"), speed: $("speed"), narration: $("narration"),
    run: $("run"), error: $("error"), results: $("results"), steps: $("steps"), glossary: $("glossary"),
    mode: $("mode"), modeAbout: $("mode-about"), cField: $("c-field"),
  };
  const IDLE = "Press run to animate.";
  const KEYS = { legs: ["a", "b"], sides: ["a", "b", "c"] };
  const ABOUT = {
    legs: "Set the two legs of a right triangle; the hypotenuse is c = √(a² + b²).",
    sides: "Set any three sides. With c the longest, c² against a² + b² says whether the angle opposite c is acute, right or obtuse.",
  };
  const UNIT_LIMIT = 30;  // longest side that still gets its unit squares drawn

  const TERMS = {
    "Legs a, b": "The two sides that meet at the right angle.",
    "Hypotenuse c": "The side opposite the right angle, and the longest side of a right triangle.",
    "a², b², c²": "The area of the square built on each side. a² + b² = c² says the two smaller squares together match the largest.",
    "Pythagorean triple": "Three whole numbers with a² + b² = c², such as 3–4–5 or 5–12–13. Multiples of a triple (6–8–10) are triples too.",
    "c² vs a² + b²": "With c the longest side: c² < a² + b² means the angle opposite c is acute, c² = a² + b² right, c² > a² + b² obtuse.",
    "Triangle": "What the three sides make: acute, right or obtuse by their largest angle, or no triangle if a and b cannot meet across c.",
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
    const squares = `${swatch(C.a)}${t.a2}, ${swatch(C.b)}${t.b2}, ${swatch(C.c)}${t.c2}`;
    if (sol.mode === "legs") {
      setHTML(el.results, rows([
        ["legs", "Legs a, b", `${swatch(C.a)}${t.a}, ${swatch(C.b)}${t.b}`],
        ["squares", "a², b², c²", squares],
        ["sum", "c² vs a² + b²", `${t.c2} = ${t.a2} + ${t.b2}`],
        ["hypotenuse", "Hypotenuse c", `${swatch(C.c)}√${t.c2} = ${t.c}`],
        ["hypotenuse", "Pythagorean triple", sol.triple ? `<span class="verdict-yes">yes: ${t.a}–${t.b}–${t.c}</span>` : `<span class="verdict-no">no: c is not a whole number</span>`],
      ]));
      return;
    }
    setHTML(el.results, rows([
      ["sides", "Sides a, b, c", `${swatch(C.a)}${t.a}, ${swatch(C.b)}${t.b}, ${swatch(C.c)}${t.c}`],
      ["squares", "a², b², c²", squares],
      ["compare", "c² vs a² + b²", `${t.c2} ${sol.sign} ${t.sum}`],
      ["kind", "Triangle", sol.kind === "none" ? `<span class="verdict-no">none</span>` : `<span class="verdict-yes">${sol.kind}</span>`],
      ...(sol.triple ? [["kind", "Pythagorean triple", `<span class="verdict-yes">yes: ${t.a}–${t.b}–${t.c}</span>`]] : []),
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

  // ---- Geometry of the figure ---------------------------------------------------
  const add = (u, v, k = 1) => [u[0] + v[0] * k, u[1] + v[1] * k];

  /** The three sides, anticlockwise C → B → A, each with the outward normal its square grows along. */
  function edges(sol) {
    const { C: P, B, A } = sol.vertices;
    return [
      { key: "a", from: P, to: B, color: C.a },
      { key: "c", from: B, to: A, color: C.c },
      { key: "b", from: A, to: P, color: C.b },
    ].map((e) => {
      const d = [e.to[0] - e.from[0], e.to[1] - e.from[1]];
      return { ...e, d, n: [d[1], -d[0]], length: Math.hypot(d[0], d[1]) };  // n: d turned clockwise, same length
    });
  }

  /** The square on side `e`, grown outward to depth p (0 … 1). */
  const squareOn = (e, p) => [e.from, e.to, add(e.to, e.n, p), add(e.from, e.n, p)];

  /** Unit-square grid lines inside the square on `e` grown to depth p, when the side is a sensible size. */
  function unitLines(e, p) {
    if (e.length > UNIT_LIMIT || unit(scene) < 5) return [];
    const along = [e.d[0] / e.length, e.d[1] / e.length], out = [e.n[0] / e.length, e.n[1] / e.length];
    const lines = [];
    for (let k = 1; k < e.length - 1e-9; k++) {
      const s = add(e.from, along, k);
      lines.push([...s, ...add(s, e.n, p)]);  // across the square
      if (k <= e.length * p) {
        const u = add(e.from, out, k);
        lines.push([...u, ...add(u, e.d)]);  // along the side
      }
    }
    return lines;
  }

  function drawSquare(e, p, text) {
    polygon(scene, squareOn(e, p), e.color, { fill: e.color, alpha: 0.2, width: 2 });
    if (state.show.units) segments(scene, unitLines(e, p), e.color, { width: 1, opacity: 0.35 });
    if (state.show.labels && p > 0.6) {
      const [x, y] = add(add(e.from, e.d, 0.5), e.n, 0.55);
      scene.label(text, x, y, (p - 0.6) / 0.4, e.color, { dx: 0, dy: 0, align: "center", size: 14 });
    }
  }

  /**
   * Side label at the edge's midpoint: just inside the square on that side when squares are shown
   * (the triangle itself is often too small for three labels), else just outside the triangle.
   */
  function sideLabel(e, text, p) {
    const [x, y] = add(e.from, e.d, 0.5);
    if (state.show.squares) {
      const depth = Math.min(0.2, 22 / (unit(scene) * e.length));  // a fraction of the square's depth, about 22px
      const [sx, sy] = add([x, y], e.n, depth);
      scene.label(text, sx, sy, p, e.color, { dx: 0, dy: 0, align: "center", size: 13 });
      return;
    }
    const k = 16 / e.length;
    scene.label(text, x, y, p, e.color, { dx: e.n[0] * k, dy: -e.n[1] * k, align: "center", size: 14 });
  }

  // ---- Timeline -------------------------------------------------------------
  function triangleSteps(tl, sol) {
    const show = state.show;
    const t = sol.texts;
    const sides = edges(sol);
    const [ea, ec, eb] = sides;
    const legs = sol.mode === "legs";
    const { C: P, B, A } = sol.vertices;
    const mark = Math.min(0.6, 0.18 * Math.min(ea.length, eb.length));
    const angleC = Math.atan2(A[1], A[0]) * 180 / Math.PI;  // the angle at C, for drawing only

    tl.add({
      id: legs ? "legs" : "sides",
      caption: legs ? `A right triangle: legs a = ${t.a} and b = ${t.b} meet at the right angle` : `The triangle with sides a = ${t.a}, b = ${t.b}, c = ${t.c}`,
      duration: 1.5, parallel: show.grid,
      draw: (p) => {
        [ea, eb, ec].forEach((e, i) => {
          const local = Math.min(Math.max(p * 3 - i, 0), 1);
          if (local > 0) scene.line(e.from[0], e.from[1], e.to[0], e.to[1], local, C.sides, { width: 2.5 });
          if (show.labels && local > 0.6) sideLabel(e, `${e.key} = ${t[e.key]}`, (local - 0.6) / 0.4);
        });
        if (legs || sol.kind === "right") rightAngle(scene, P[0], P[1], 0, mark, C.corner, { opacity: p });
        else {
          // Where side b would lie for a right angle, to compare the angle at C against.
          scene.line(P[0], P[1], P[0], eb.length, p, C.guide, { width: 1.5, dash: [5, 6] });
          wedge(scene, P[0], P[1], mark * 1.4, 0, angleC * p, C.corner, { alpha: 0.18, width: 1.5 });
        }
      },
    });

    if (show.squares) {
      tl.add({ id: "squares", caption: `a² = ${t.a}² = ${t.a2}: the square on side a`, duration: 1.1, draw: (p) => drawSquare(ea, p, `a² = ${t.a2}`) });
      tl.add({ id: "squares", caption: `b² = ${t.b}² = ${t.b2}: the square on side b`, duration: 1.1, draw: (p) => drawSquare(eb, p, `b² = ${t.b2}`) });
      tl.add({
        id: legs ? "sum" : "compare",
        caption: legs ? `c² = a² + b² = ${t.a2} + ${t.b2} = ${t.c2}: the square on the hypotenuse` : `c² = ${t.c2} ${sol.sign} a² + b² = ${t.sum}`,
        duration: 1.4, wait: 0.2, draw: (p) => drawSquare(ec, p, `c² = ${t.c2}`),
      });
    } else {
      tl.add({ id: legs ? "sum" : "compare", caption: legs ? `c² = a² + b² = ${t.a2} + ${t.b2} = ${t.c2}` : `c² = ${t.c2} ${sol.sign} a² + b² = ${t.sum}`, duration: 1.0, rate: rate.linear, draw: () => {} });
    }

    const mid = add(ec.from, ec.d, 0.5);
    if (legs) {
      tl.add({
        id: "hypotenuse", caption: `c = √${t.c2} = ${t.c}${sol.triple ? `: ${t.a}–${t.b}–${t.c} is a Pythagorean triple` : ""}`, duration: 1.0,
        draw: (p) => {
          scene.line(B[0], B[1], A[0], A[1], p, C.c, { width: 4 });
          scene.caption(`a² + b² = c²: ${t.a2} + ${t.b2} = ${t.c2}, so c = ${t.c}`, p, C.c);
        },
      });
      tl.add({ id: "hypotenuse", duration: 0.7, parallel: true, rate: rate.linear, draw: (p) => scene.flash(mid[0], mid[1], p, C.c) });
      return;
    }
    tl.add({
      id: "kind", caption: `c² ${sol.sign} a² + b²: ${sol.verdict}`, duration: 1.0,
      draw: (p) => {
        if (sol.kind === "right") rightAngle(scene, P[0], P[1], 0, mark, C.c, { width: 3, opacity: p });
        else wedge(scene, P[0], P[1], mark * 1.4, 0, angleC, sol.kind === "obtuse" ? C.gap : C.c, { alpha: 0.35 * p, width: 2.5, opacity: p });
        scene.caption(`${sol.kind}: c² ${sol.sign} a² + b² (${t.c2} ${sol.sign} ${t.sum})`, p, sol.kind === "obtuse" ? C.gap : C.c);
      },
    });
    tl.add({ id: "kind", duration: 0.7, parallel: true, rate: rate.linear, draw: (p) => scene.flash(P[0], P[1], p, C.c) });
  }

  /** Lengths that cannot close: c along the bottom, a and b swung down flat onto it, with the gap between them. */
  function noTriangleSteps(tl, sol) {
    const show = state.show;
    const t = sol.texts;
    const { a, b, c } = sol.sides;
    const lift = 0.06 * c;
    tl.add({
      id: "sides", caption: `Side c = ${t.c} along the bottom, with a = ${t.a} and b = ${t.b} hinged at its ends`, duration: 1.4, parallel: show.grid,
      draw: (p) => {
        scene.line(0, 0, c, 0, p, C.c, { width: 3 });
        scene.line(0, lift, b, lift, p, C.b, { width: 3 });
        scene.line(c, lift, c - a, lift, p, C.a, { width: 3 });
        if (show.labels) {
          scene.label(`c = ${t.c}`, c / 2, 0, p, C.c, { dx: 0, dy: 16, align: "center", size: 14 });
          scene.label(`b = ${t.b}`, b / 2, lift, p, C.b, { dx: 0, dy: -14, align: "center", size: 14 });
          scene.label(`a = ${t.a}`, c - a / 2, lift, p, C.a, { dx: 0, dy: -14, align: "center", size: 14 });
        }
      },
    });
    tl.add({ id: "compare", caption: `c² = ${t.c2} ${sol.sign} a² + b² = ${t.sum}`, duration: 0.9, rate: rate.linear, draw: () => {} });
    tl.add({
      id: "kind", caption: "Even lying flat, a and b do not reach each other across c: these lengths make no triangle", duration: 1.0,
      draw: (p) => {
        scene.line(b, lift, b + (c - a - b) * p, lift, 1, C.gap, { width: 3, dash: [4, 4] });
        if (show.labels && p > 0.5) scene.label(`gap ${fmt(c - a - b)}`, (b + c - a) / 2, lift, (p - 0.5) * 2, C.gap, { dx: 0, dy: -32, align: "center", size: 13 });
      },
    });
  }

  function buildTimeline(sol) {
    const tl = new Timeline(scene, {
      onFrame: (time, length) => { el.scrub.value = length ? Math.round((time / length) * 1000) : 1000; },
      onStep: highlight,
      onDone: () => setPlaying(false),
    });
    tl.speed = Number(el.speed.value);
    if (state.show.grid) tl.add({ id: sol.mode === "legs" ? "legs" : "sides", duration: 0.6, draw: (p) => scene.grid(p) });
    if (sol.vertices) triangleSteps(tl, sol);
    else noTriangleSteps(tl, sol);
    return tl;
  }

  // ---- Camera: the whole figure, equal units across and up ------------------------
  function ideal(sol) {
    if (!sol.vertices) {
      const c = sol.sides.c;
      return equalView(scene, [0, c, -0.1 * c, 0.2 * c], 0.15 * c);
    }
    const points = Object.values(sol.vertices);
    if (state.show.squares) edges(sol).forEach((e) => points.push(...squareOn(e, 1)));
    if (sol.mode === "sides") points.push([0, sol.sides.b]);  // the dashed right-angle reference
    const xs = points.map((q) => q[0]), ys = points.map((q) => q[1]);
    const size = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
    return equalView(scene, [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)], 0.06 * size);
  }

  function frame(sol) {
    scene.moveTo(ideal(sol), { onFrame: () => { if (timeline && !timeline.playing) timeline.render(); } });
  }

  // ---- Controls -------------------------------------------------------------
  function setPlaying(playing) { el.play.textContent = playing ? "❚❚ Pause" : "▶ Play"; }

  function syncInputs() {
    el.mode.value = state.mode;
    el.modeAbout.textContent = ABOUT[state.mode];
    el.cField.hidden = state.mode !== "sides";
    for (const key of KEYS[state.mode]) {
      $(`${key}-range`).value = state[key];
      $(`${key}-num`).value = state[key];
    }
  }

  function writeHash() {
    const params = new URLSearchParams(location.hash.slice(1));
    params.delete("c");
    KEYS[state.mode].forEach((key) => params.set(key, state[key]));
    history.replaceState(null, "", `#${params.toString()}`);
  }

  function update({ fromConfig = false } = {}) {
    if (timeline) timeline.stop();
    setPlaying(false);
    const keys = KEYS[state.mode];
    if (keys.some((key) => !Number.isFinite(state[key]) || state[key] <= 0)) {
      el.error.textContent = `Enter a length greater than 0 for ${keys.join(", ")}.`;
      el.error.hidden = false;
      return;
    }
    el.error.hidden = true;
    const sol = fromConfig ? config.solution : state.mode === "legs" ? solve(state.a, state.b) : classify(state.a, state.b, state.c);
    current = sol;
    renderResults(sol);
    renderSteps(sol);
    timeline = buildTimeline(sol);
    timeline.finish();
    frame(sol);
    writeHash();
  }

  /** The mode is read from which keys the hash carries: a, b for legs; a, b, c for three sides. */
  function readHash() {
    const values = PPParams.read(["a", "b", "c"]);
    if (!("a" in values) && !("b" in values)) return false;
    Object.assign(state, values, { mode: "c" in values ? "sides" : "legs" });
    return true;
  }

  function play() {
    if (!timeline) return;
    el.run.hidden = true;
    timeline.play();
    setPlaying(true);
  }

  for (const key of ["a", "b", "c"]) {
    for (const suffix of ["range", "num"]) {
      $(`${key}-${suffix}`).addEventListener("input", (event) => {
        state[key] = event.target.value === "" ? NaN : Number(event.target.value);
        $(`${key}-${suffix === "range" ? "num" : "range"}`).value = event.target.value;
        update();
      });
    }
  }
  el.mode.addEventListener("change", () => {
    // Testing three sides starts from the current right triangle, so c² = a² + b² to begin with.
    if (el.mode.value === "sides" && current) state.c = current.sides.c;
    state.mode = el.mode.value;
    syncInputs();
    update();
  });
  document.querySelectorAll("[data-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      const values = button.dataset.preset.split(",").map(Number);
      [state.a, state.b] = values;
      state.mode = values.length === 3 ? "sides" : "legs";
      if (values.length === 3) state.c = values[2];
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
