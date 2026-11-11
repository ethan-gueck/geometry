/*
 * triangle_types.js — page controller for classifying triangles by their sides and by their angles.
 *
 * Reads the Python-built config, wires the a, b and c sliders, and turns a
 * solution into a Manim-style Timeline. When the sides pass the triangle
 * inequality it draws the triangle (side c = AB along the bottom, each side in
 * the colour of the angle it faces), tick-marks the sides and arc-marks the
 * angles (equal counts for equal sides and angles, more marks for longer sides
 * and larger angles), flashes the corners from the smallest angle to the
 * largest, and holds the largest angle against a 90° guide; an equilateral
 * triangle's area is shaded last. When they fail it, the two shorter sides
 * swing down onto the longest and the gap they leave is shown. The figure
 * keeps equal units across and up so angles look their size. The URL hash
 * (#a=5&b=5&c=6) presets the sides and is watched, so links and
 * PP.embed(...).set() update the page live.
 */
(function () {
  "use strict";
  const { ManimCanvas, Timeline, rate } = window.Manim;
  const { equalView, unit, polar, wedge, arc, polygon, segments, rightAngle } = window.GeoFigure;
  const { solve } = window.TriangleTypeMath;

  const config = JSON.parse(document.getElementById("pp-config").textContent);
  const C = Object.fromEntries(Object.entries(config.roles).map(([el, role]) => [el, config.theme.stage[role]]));

  const $ = (id) => document.getElementById(id);
  const el = {
    play: $("play"), finish: $("finish"), scrub: $("scrub"), speed: $("speed"), narration: $("narration"),
    run: $("run"), error: $("error"), results: $("results"), steps: $("steps"), glossary: $("glossary"),
  };
  const IDLE = "Press run to animate.";
  const KEYS = ["a", "b", "c"];
  const SWING = 60;  // the angle the shorter sides start from when they cannot close a triangle

  const TERMS = {
    "a, b, c": "The side lengths. Each faces the angle of the same capital letter: side a is opposite angle A.",
    "A, B, C": "The interior angles at the three corners, in degrees, found from the sides by the law of cosines.",
    "Triangle": "Three lengths close into a triangle exactly when each is shorter than the other two together (the triangle inequality).",
    "Short by": "How far the two shorter sides, laid end to end, fall short of the longest. Any shortfall, or none at all, leaves no corner.",
    "By sides": "Equilateral: all three sides equal. Isosceles: at least two equal. Scalene: none equal.",
    "Equilateral": "a = b = c, and so A = B = C = 60°.",
    "Isosceles": "Greek for “equal legs”: at least two equal sides, the legs. The angles opposite them, the base angles, are equal too.",
    "Scalene": "Greek for “uneven”: a, b and c all different, and so A, B and C too.",
    "Base angles": "In an isosceles triangle, the two angles opposite the equal legs. They are equal, each (180° − apex) / 2, where the apex is the angle between the legs.",
    "Side–angle order": "The larger side faces the larger angle: a > b ⟺ A > B. Sorting the sides sorts the angles.",
    "By angles": "Read off the largest angle: under 90° acute, exactly 90° right, over 90° obtuse.",
    "Largest angle": "The angle opposite the longest side. Only it can be 90° or more, since the three share 180°.",
    "Area": "Only for an equilateral triangle of side s: (√3 / 4) s², half the base s times the height (√3 / 2) s.",
    "Tick marks and arcs": "On the figure, sides with the same number of ticks are equal, and so are angles with the same number of arcs; more marks, longer side and larger angle.",
  };

  const state = { ...config.initial, show: {} };
  document.querySelectorAll("[data-show]").forEach((box) => { state.show[box.dataset.show] = box.checked; });

  const scene = new ManimCanvas($("scene"), { theme: config.theme });
  let timeline = null;
  let current = null;

  const swatch = (color) => `<span class="swatch" style="background:${color}"></span>`;
  const yes = (text) => `<span class="verdict-yes">${text}</span>`;
  const no = (text) => `<span class="verdict-no">${text}</span>`;
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
    const sides = KEYS.map((k) => ["sides", k, `${swatch(C[k])}${t[k]}`]);
    if (!sol.is_triangle) {
      setHTML(el.results, rows([
        ...sides,
        ["inequality", "Triangle", no("no: the two shorter sides do not outreach the longest")],
        ["inequality", "Short by", sol.gap === 0 ? "0: they lie flat" : t.gap],
        ["by-sides", "By sides", no("no triangle to classify")],
      ]));
      return;
    }
    const largest = sol.order[2];
    const base = sol.equilateral ? "all three, 60° each" : sol.apex ? `${KEYS.filter((k) => k !== sol.apex.toLowerCase()).join(", ").toUpperCase()}: ${t.base} each` : no("none: no two sides equal");
    setHTML(el.results, rows([
      ...sides,
      ...KEYS.map((k) => ["angles", k.toUpperCase(), `${swatch(C[k])}${t[k.toUpperCase()]}`]),
      ["inequality", "Triangle", yes("yes")],
      ["by-sides", "By sides", yes(sol.by_sides)],
      ["by-sides", "Equilateral", sol.equilateral ? yes("yes") : no("no")],
      ["by-sides", "Isosceles", sol.isosceles ? yes("yes") : no("no")],
      ["by-sides", "Scalene", sol.scalene ? yes("yes") : no("no")],
      ["equal-angles", "Base angles", base],
      ["order", "Side–angle order", `${t.sides}, so ${t.angles}`],
      ["by-angles", "By angles", yes(sol.by_angles)],
      ["by-angles", "Largest angle", `${largest} = ${t[largest]}`],
      ["area", "Area", sol.area === null ? no("only for an equilateral triangle") : `${swatch(C.marks)}(√3 / 4) × ${t.a}² = ${t.area}`],
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
  const px = (n) => n / unit(scene);  // n pixels in figure units, so marks keep their size at any zoom

  /** A label at distance r from (x, y) in direction `angle`, centred there. */
  function polarLabel(text, x, y, r, angle, p, color, size = 14) {
    const [lx, ly] = polar(x, y, r, angle);
    scene.label(text, lx, ly, p, color, { dx: 0, dy: 0, align: "center", size });
  }

  /** n short ticks across the middle of segment u–v. */
  function ticks(u, v, n, color, p) {
    if (n < 1) return;
    const len = Math.hypot(v[0] - u[0], v[1] - u[1]);
    const d = [(v[0] - u[0]) / len, (v[1] - u[1]) / len];
    const h = px(7), gap = px(6);
    const list = [];
    for (let k = 0; k < n; k++) {
      const off = (k - (n - 1) / 2) * gap;
      const m = [(u[0] + v[0]) / 2 + d[0] * off, (u[1] + v[1]) / 2 + d[1] * off];
      list.push([m[0] + d[1] * h, m[1] - d[0] * h, m[0] - d[1] * h, m[1] + d[0] * h]);
    }
    segments(scene, list, color, { width: 2.5, opacity: p });
  }

  // ---- Timeline: the triangle, its marks, its order and its largest angle ------------
  function triangleSteps(tl, sol) {
    const show = state.show;
    const t = sol.texts;
    const { A, B, C: P } = sol.vertices;
    const { A: a, B: b } = sol.angles;
    const lengths = KEYS.map((k) => sol.inputs[k]);
    const r = Math.min(0.3 * Math.min(...lengths), 0.14 * Math.max(...lengths));  // wedge radius
    const centroid = [(A[0] + B[0] + P[0]) / 3, (A[1] + B[1] + P[1]) / 3];

    // Each side, anticlockwise (so outward is to its right), in the colour of the angle it faces.
    const sides = [
      { key: "c", from: A, to: B },
      { key: "a", from: B, to: P },
      { key: "b", from: P, to: A },
    ];
    // Each corner's wedge: [from, to] directions, anticlockwise; it takes its opposite side's colour.
    const corners = {
      A: { at: A, from: 0, to: a, color: C.a },
      B: { at: B, from: 180 - b, to: 180, color: C.b },
      C: { at: P, from: 180 + a, to: 360 - b, color: C.c },
    };

    tl.add({
      id: "sides", caption: `Three sides: a = ${t.a}, b = ${t.b}, c = ${t.c}, each facing its angle`, duration: 1.5, parallel: show.grid,
      draw: (p) => {
        sides.forEach(({ key, from, to }, i) => {
          const local = Math.min(Math.max(p * 3 - i, 0), 1);
          if (local <= 0) return;
          scene.line(from[0], from[1], to[0], to[1], local, C[key], { width: 3 });
          if (show.labels && local > 0.6) {
            const len = Math.hypot(to[0] - from[0], to[1] - from[1]);
            const out = [(to[1] - from[1]) / len, -(to[0] - from[0]) / len];
            scene.label(`${key} = ${t[key]}`, (from[0] + to[0]) / 2, (from[1] + to[1]) / 2, (local - 0.6) / 0.4, C[key],
              { dx: out[0] * 26, dy: -out[1] * 22, align: "center", size: 13 });
          }
        });
        if (show.labels) {
          [[A, "A"], [B, "B"], [P, "C"]].forEach(([at, name]) => {
            const d = Math.hypot(at[0] - centroid[0], at[1] - centroid[1]);
            scene.label(name, at[0], at[1], p, C.sides, { dx: ((at[0] - centroid[0]) / d) * 16, dy: -((at[1] - centroid[1]) / d) * 16, align: "center", size: 15 });
          });
        }
      },
    });
    tl.add({
      id: "inequality", caption: sol.steps[1].math, duration: 0.8, rate: rate.linear,
      draw: (p) => scene.flash(P[0], P[1], p, C.marks),
    });
    tl.add({
      id: "by-sides", caption: `By sides: ${sol.by_sides}`, duration: 1.0,
      draw: (p) => { if (show.marks) sides.forEach(({ key, from, to }) => ticks(from, to, sol.marks[key], C.marks, p)); },
    });
    sol.order.forEach((name) => {
      const corner = corners[name];
      tl.add({
        id: "angles", caption: `${name} = ${t[name]}`, duration: 0.7,
        draw: (p) => {
          wedge(scene, corner.at[0], corner.at[1], r, corner.from, lerp(corner.from, corner.to, p), corner.color);
          if (show.labels && p > 0.5) polarLabel(t[name], corner.at[0], corner.at[1], r + px(24), (corner.from + corner.to) / 2, (p - 0.5) * 2, corner.color, 13);
        },
      });
    });
    const equalCaption = sol.equilateral ? "Equilateral: A = B = C = 60°"
      : sol.apex ? `Base angles theorem: equal legs, so equal base angles, ${t.base} each`
        : "Scalene: no two sides equal, so no two angles equal";
    tl.add({
      id: "equal-angles", caption: equalCaption, duration: 1.0,
      draw: (p) => {
        if (!show.marks) return;
        Object.entries(corners).forEach(([name, corner]) => {
          for (let k = 0; k < sol.marks[name.toLowerCase()]; k++) {
            arc(scene, corner.at[0], corner.at[1], r - px(5) * k, corner.from, lerp(corner.from, corner.to, p), C.marks, { width: 2 });
          }
        });
      },
    });
    // Smallest angle to largest: each corner flashes in turn, in the order of the sides that face them.
    sol.order.forEach((name, i) => tl.add({
      id: "order", caption: i === 0 ? `Shortest side to longest: ${t.sides}, so ${t.angles}` : undefined, duration: 0.55, rate: rate.linear,
      draw: (p) => scene.flash(corners[name].at[0], corners[name].at[1], p, corners[name].color),
    }));
    const largest = sol.order[2], top = corners[largest];
    tl.add({
      id: "by-angles", caption: sol.steps.find((s) => s.id === "by-angles").math.split(": ")[0] + `: ${sol.by_angles}`, duration: 1.2,
      draw: (p) => {
        const size = Math.min(r * 0.55, px(16));
        if (sol.by_angles === "right") {
          rightAngle(scene, top.at[0], top.at[1], top.from, size, C.marks, { width: 2.5, opacity: p });
        } else if (show.guide) {
          const [gx, gy] = polar(top.at[0], top.at[1], r * 1.6, top.from + 90);
          scene.line(top.at[0], top.at[1], gx, gy, p, C.guide, { width: 2, dash: [6, 5] });
          rightAngle(scene, top.at[0], top.at[1], top.from, size, C.guide, { width: 1.5, opacity: p });
          if (show.labels && p > 0.6) polarLabel("90°", top.at[0], top.at[1], r * 1.6 + px(14), top.from + 90, (p - 0.6) / 0.4, C.guide, 12);
        }
        if (show.labels) scene.label(sol.verdict, centroid[0], Math.max(A[1], B[1], P[1]), p, C.marks, { dx: 0, dy: -44, align: "center" });
      },
    });
    if (sol.area !== null) {
      tl.add({
        id: "area", caption: `Area = (√3 / 4) × ${t.a}² = ${t.area}`, duration: 1.0,
        draw: (p) => {
          polygon(scene, [A, B, P], C.marks, { fill: C.marks, alpha: 0.18, width: 0, opacity: p });
          if (show.labels) scene.label(`Area = ${t.area}`, centroid[0], centroid[1], p, C.marks, { dx: 0, dy: 0, align: "center", size: 14 });
        },
      });
    }
  }

  // ---- Timeline: no triangle, so the shorter sides swing down onto the longest ------
  function openSteps(tl, sol) {
    const show = state.show;
    const t = sol.texts;
    const [s1, s2, long] = sol.order.map((name) => name.toLowerCase());
    const L = sol.inputs[long], l1 = sol.inputs[s1], l2 = sol.inputs[s2];

    const SWING_TIME = 1.6;
    let swingStart = 0;  // when the swing step starts, set once it is added

    // The shorter sides are drawn once, at the angle the swing has reached, so they move rather than copy.
    tl.add({
      id: "sides", caption: `The longest side, ${long} = ${t[long]}, along the bottom; ${s1} and ${s2} hinged at its ends`, duration: 1.2, parallel: show.grid,
      draw: (p) => {
        const q = rate.smooth(Math.min(Math.max((tl.time - swingStart) / SWING_TIME, 0), 1));
        const lift = px(5) * q;  // flat, the shorter sides sit just above the longest, so all three stay visible
        const [x1, y1] = polar(0, lift, l1, lerp(SWING, 0, q)), [x2, y2] = polar(L, lift, l2, lerp(180 - SWING, 180, q));
        scene.line(0, 0, L, 0, p, C[long], { width: 3 });
        scene.line(0, lift, x1, y1, p, C[s1], { width: 3 });
        scene.line(L, lift, x2, y2, p, C[s2], { width: 3 });
        if (show.labels) {
          scene.label(`${long} = ${t[long]}`, L / 2, 0, p, C[long], { dx: 0, dy: 20, align: "center", size: 13 });
          scene.label(`${s1} = ${t[s1]}`, x1 / 2, y1 / 2, p, C[s1], { dx: -14 * (1 - q), dy: -16 * q, align: q < 0.5 ? "right" : "center", size: 13 });
          scene.label(`${s2} = ${t[s2]}`, (L + x2) / 2, y2 / 2, p, C[s2], { dx: 14 * (1 - q), dy: -16 * q, align: q < 0.5 ? "left" : "center", size: 13 });
        }
      },
    });
    swingStart = tl.total;
    tl.add({
      id: "inequality", caption: `Swing ${s1} and ${s2} down: even flat they reach only ${t[s1]} + ${t[s2]}, against ${long} = ${t[long]}`,
      duration: SWING_TIME, rate: rate.linear, draw: () => {},
    });
    tl.add({
      id: "by-sides", caption: sol.gap === 0 ? "They meet flat on the longest side: no corner, so no triangle" : `They fall ${t.gap} short: no triangle to classify`, duration: 1.0,
      draw: (p) => {
        if (sol.gap > 0) scene.line(l1, 0, L - l2, 0, p, C.gap, { width: 6 });
        else scene.flash(l1, 0, p, C.gap);
        if (show.labels) scene.label(sol.gap === 0 ? "no room for a corner" : `short by ${t.gap}`, (l1 + L - l2) / 2, 0, p, C.gap, { dx: 0, dy: -40, align: "center", size: 13 });
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
    if (state.show.grid) tl.add({ id: "sides", duration: 0.6, draw: (p) => scene.grid(p) });
    if (sol.vertices) triangleSteps(tl, sol);
    else openSteps(tl, sol);
    return tl;
  }

  // ---- Camera: the whole figure, equal units across and up ------------------------
  function ideal(sol) {
    const longest = Math.max(sol.inputs.a, sol.inputs.b, sol.inputs.c);
    if (sol.vertices) {
      const { B, C: P } = sol.vertices;
      return equalView(scene, [Math.min(0, P[0]), Math.max(B[0], P[0]), 0, P[1] + 0.1 * longest], 0.12 * longest);  // room above for the verdict
    }
    return equalView(scene, [0, longest, -0.1 * longest, Math.sin(SWING * Math.PI / 180) * longest * 0.6], 0.15 * longest);
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
    if (KEYS.some((key) => !Number.isFinite(state[key]) || state[key] <= 0)) {
      el.error.textContent = "Enter three side lengths greater than 0.";
      el.error.hidden = false;
      return;
    }
    const sol = fromConfig ? config.solution : solve(state.a, state.b, state.c);
    // Not an input error, but say so beside the inputs: the sides fail the triangle inequality.
    el.error.textContent = sol.is_triangle ? "" : `No triangle: ${sol.verdict.slice("no triangle: ".length)}. Each side must be shorter than the other two together.`;
    el.error.hidden = sol.is_triangle;
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
