/*
 * circles.js — page controller for circles: circumference, area, arcs and sectors.
 *
 * Reads the Python-built config, wires the radius and angle controls, and turns a solution
 * into a Manim-style Timeline: the centre and a radius r, the circumference traced all the
 * way round (C = 2πr), the disc shaded (A = πr²), then a second radius swung through the
 * central angle θ, the sector filled (½r²θ) and its arc traced in bold (s = rθ). The figure
 * keeps equal units across and up so the circle stays round. The URL hash (#r=3&degrees=60)
 * presets the page and is watched, so links and PP.embed(...).set() update the page live.
 */
(function () {
  "use strict";
  const { ManimCanvas, Timeline, rate } = window.Manim;
  const { equalView, arc, wedge, polar } = window.GeoFigure;
  const { solve, fmt } = window.CircleMath;

  const config = JSON.parse(document.getElementById("pp-config").textContent);
  const C = Object.fromEntries(Object.entries(config.roles).map(([el, role]) => [el, config.theme.stage[role]]));
  const KEYS = ["r", "degrees"];

  const $ = (id) => document.getElementById(id);
  const el = {
    play: $("play"), finish: $("finish"), scrub: $("scrub"), speed: $("speed"), narration: $("narration"),
    run: $("run"), error: $("error"), results: $("results"), steps: $("steps"), glossary: $("glossary"),
  };
  const IDLE = "Press run to animate.";

  const TERMS = {
    "Radius r": "The distance from the centre to any point on the circle. The diameter d = 2r goes all the way across.",
    "π": "About 3.14159: the ratio of any circle's circumference to its diameter, C / d.",
    "Circumference C": "The distance around the circle: C = 2πr, or πd.",
    "Area A": "The region inside the circle: A = πr². Doubling r multiplies A by four.",
    "Central angle θ": "The angle at the centre between two radii. The arc and sector formulas need it in radians: θ = degrees × π / 180.",
    "Radian": "The angle whose arc is exactly one radius long, about 57.3°. A full turn is 2π radians.",
    "Arc length s": "The part of the circumference between the two radii: s = rθ.",
    "Sector A_sector": "The pie-slice region between the two radii and the arc: A_sector = ½r²θ.",
  };

  const state = { ...config.initial, show: {} };
  document.querySelectorAll("[data-show]").forEach((box) => { state.show[box.dataset.show] = box.checked; });

  const scene = new ManimCanvas($("scene"), { theme: config.theme });
  let timeline = null;
  let current = null;

  /** The circle framed with equal units across and up, so it stays round. */
  const ideal = (sol) => equalView(scene, [-sol.r, sol.r, -sol.r, sol.r], Math.max(0.6, sol.r * 0.28));

  const swatch = (color) => `<span class="swatch" style="background:${color}"></span>`;

  function renderGlossary() {
    el.glossary.innerHTML = Object.entries(TERMS).map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("");
  }

  function renderResults(sol) {
    const rows = [
      ["radius", "Radius r", `${swatch(C.radius)}${fmt(sol.r)}  (d = ${fmt(sol.diameter)})`],
      ["circumference", "Circumference C", `${swatch(C.circle)}${fmt(sol.circumference)}`],
      ["area", "Area A", `${swatch(C.disc)}${fmt(sol.area)}`],
      ["angle", "Central angle θ", `${fmt(sol.degrees)}° = ${fmt(sol.radians)} rad`],
      ["arc", "Arc length s", `${swatch(C.arc)}${fmt(sol.arc)}`],
      ["sector", "Sector area", `${swatch(C.sector)}${fmt(sol.sector)}`],
      ["check", "Share of the circle", `${fmt(sol.share * 100)}%`],
    ];
    el.results.innerHTML = rows.map(([id, k, v]) => `<dt data-step="${id}" title="${TERMS[k.split(" ").slice(0, 2).join(" ")] || ""}">${k}</dt><dd data-step="${id}">${v}</dd>`).join("");
  }

  function renderSteps(sol) {
    el.steps.innerHTML = sol.steps.map(({ id, title, math }) =>
      `<li class="steps__item" data-step="${id}"><p class="steps__title">${title}</p><p class="steps__math">${math}</p></li>`).join("");
  }

  function highlight(step) {
    el.narration.textContent = step ? step.caption : IDLE;
    document.querySelectorAll("[data-step]").forEach((node) => node.classList.toggle("is-active", !!step && node.dataset.step === step.id));
  }

  /** A radius from the centre at `angle` degrees, drawn out to length r × p. */
  function radius(r, angle, p, color) {
    const [x, y] = polar(0, 0, r * p, angle);
    scene.line(0, 0, x, y, 1, color, { width: 3 });
  }

  function buildTimeline(sol) {
    const { r, degrees } = sol;
    const show = state.show;
    const tl = new Timeline(scene, {
      onFrame: (t, total) => { el.scrub.value = total ? Math.round((t / total) * 1000) : 1000; },
      onStep: highlight,
      onDone: () => setPlaying(false),
    });
    tl.speed = Number(el.speed.value);

    if (show.grid) tl.add({ id: "radius", caption: "Set up the axes", duration: 0.7, draw: (p) => { scene.grid(p); scene.axes(p); } });
    tl.add({
      id: "radius", caption: `The centre and a radius r = ${fmt(r)}`, duration: 0.9,
      draw: (p) => {
        scene.dot(0, 0, Math.min(1, p * 3), C.radius, 5);
        radius(r, 0, p, C.radius);
        if (show.labels && p > 0.6) scene.label(`r = ${fmt(r)}`, r / 2, 0, 1, C.radius, { dx: 0, dy: 18, align: "center" });
      },
    });
    tl.add({
      id: "circumference", caption: `Trace the circumference: C = 2πr = ${fmt(sol.circumference)}`, duration: 1.8,
      draw: (p) => {
        arc(scene, 0, 0, r, 0, 360 * p, C.circle, { width: 4 });
        if (show.labels && p >= 1) scene.label(`C = ${fmt(sol.circumference)}`, ...polar(0, 0, r, 225), 1, C.circle, { dx: -8, dy: 16, align: "right" });
      },
    });
    if (show.disc) {
      tl.add({
        id: "area", caption: `Fill the area: A = πr² = ${fmt(sol.area)}`, duration: 1.1,
        draw: (p) => {
          wedge(scene, 0, 0, r, 0, 360, C.disc, { alpha: 0.16 * p, width: 0 });
          if (show.labels && p >= 1) scene.label(`A = ${fmt(sol.area)}`, ...polar(0, 0, r * 0.55, 230), 1, C.disc, { align: "center", dx: 0, dy: 0 });
        },
      });
    } else {
      tl.add({ id: "area", caption: `The area: A = πr² = ${fmt(sol.area)}`, duration: 0.7, rate: rate.linear, draw: () => {} });
    }
    if (degrees > 0) {
      tl.add({
        id: "angle", caption: `Swing a second radius through θ = ${fmt(degrees)}° = ${fmt(sol.radians)} rad`, duration: 1.2,
        draw: (p) => {
          radius(r, degrees * p, 1, C.radius);
          if (show.labels && p >= 1) scene.label(`θ = ${fmt(degrees)}°`, ...polar(0, 0, Math.min(r * 0.32, 1.2), degrees / 2), 1, C.radius, { align: "center", dx: 0, dy: 0, size: 13 });
        },
      });
      tl.add({
        id: "sector", caption: `The sector: ½r²θ = ${fmt(sol.sector)}`, duration: 1.1,
        draw: (p) => wedge(scene, 0, 0, r, 0, degrees, C.sector, { alpha: 0.38 * p, width: 0 }),
      });
      tl.add({
        id: "arc", caption: `Its arc: s = rθ = ${fmt(sol.arc)}`, duration: 1.2,
        draw: (p) => {
          arc(scene, 0, 0, r, 0, degrees * p, C.arc, { width: 7 });
          if (show.labels && p >= 1) scene.label(`s = ${fmt(sol.arc)}`, ...polar(0, 0, r, degrees / 2), 1, C.arc, { dx: 10, dy: -10, align: "left" });
        },
      });
    }
    tl.add({ id: "check", caption: `Both are ${fmt(sol.share * 100)}% of the circle: θ / 2π = ${fmt(sol.share)}`, duration: 1.0, rate: rate.linear, draw: () => {} });
    return tl;
  }

  // ---- Controls -----------------------------------------------------------------------
  function setPlaying(playing) { el.play.textContent = playing ? "❚❚ Pause" : "▶ Play"; }

  function syncInputs() {
    for (const key of KEYS) { $(`${key}-range`).value = state[key]; $(`${key}-num`).value = state[key]; }
  }

  function update({ fromConfig = false } = {}) {
    if (timeline) timeline.stop();
    setPlaying(false);
    let sol;
    try {
      if (KEYS.some((k) => !Number.isFinite(state[k]))) throw new Error("Enter a number for the radius and the angle.");
      sol = fromConfig ? config.solution : solve(state.r, state.degrees);
    } catch (error) {
      el.error.textContent = error.message;
      el.error.hidden = false;
      return;
    }
    el.error.hidden = true;
    current = sol;
    renderResults(sol);
    renderSteps(sol);
    timeline = buildTimeline(sol);
    timeline.finish();
    scene.moveTo(ideal(sol), { onFrame: () => { if (timeline && !timeline.playing) timeline.render(); } });
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
  scene.onResize = () => { if (current) scene.setView(ideal(current)); if (timeline) timeline.render(); };
  window.addEventListener("hashchange", () => { if (readHash()) { syncInputs(); update(); } });

  renderGlossary();
  scene.setView(ideal(config.solution));
  const fromHash = readHash();
  syncInputs();
  update({ fromConfig: !fromHash });
})();
