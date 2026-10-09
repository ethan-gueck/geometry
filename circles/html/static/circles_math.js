/*
 * circles_math.js — browser mirror of circles/solver.py and the G.9 section of core/formula.py.
 *
 * Loaded after shared/static/fmt.js (window.GeoFmt). Python stays the source of truth:
 * tests/test_js_parity.py runs this file and compares solve() with the Python output.
 * Exposes window.CircleMath (browser) or module.exports (Node).
 */
(function (global) {
  "use strict";
  const { clean, fmt } = global.GeoFmt;

  // ---- core/formula.py: G.9 Circles ------------------------------------------------
  const circumferenceOfACircle = (r) => 2 * Math.PI * r;       // C = 2πr
  const areaOfACircle = (r) => Math.PI * r ** 2;               // A = πr²
  const arcLength = (r, theta) => r * theta;                   // s = rθ, θ in radians
  const sectorOfACircle = (r, theta) => (1 / 2) * r ** 2 * theta;  // A_sector = ½r²θ

  // ---- circles/solver.py ----------------------------------------------------------
  function solve(r, degrees) {
    if (!(r > 0)) throw new Error("The radius must be greater than 0.");
    if (!(degrees >= 0 && degrees <= 360)) throw new Error("The central angle must be between 0° and 360°.");
    const theta = (degrees * Math.PI) / 180;
    const c = circumferenceOfACircle(r), a = areaOfACircle(r);
    const s = arcLength(r, theta), sector = sectorOfACircle(r, theta);
    const share = degrees / 360;
    const steps = [
      { id: "radius", title: "Radius and diameter", math: `r = ${fmt(r)}, so d = 2r = ${fmt(2 * r)}` },
      { id: "circumference", title: "Circumference: C = 2πr", math: `C = 2π · ${fmt(r)} = ${fmt(c)}  (also πd = π · ${fmt(2 * r)})` },
      { id: "area", title: "Area: A = πr²", math: `A = π · ${fmt(r)}² = π · ${fmt(r * r)} = ${fmt(a)}` },
      { id: "angle", title: "The angle in radians", math: `θ = ${fmt(degrees)}° × π / 180 = ${fmt(theta)} rad` },
      { id: "arc", title: "Arc length: s = rθ", math: `s = ${fmt(r)} · ${fmt(theta)} = ${fmt(s)}` },
      { id: "sector", title: "Sector area: A_sector = ½r²θ", math: `A_sector = ½ · ${fmt(r)}² · ${fmt(theta)} = ${fmt(sector)}` },
      { id: "check", title: "Check: the same share of the circle", math: `s / C = ${fmt(s / c)} and A_sector / A = ${fmt(sector / a)}: both θ / 2π = ${fmt(share)}, ${fmt(share * 100)}% of the circle` },
    ];
    return {
      r, degrees, radians: clean(theta), diameter: clean(2 * r), circumference: clean(c), area: clean(a),
      arc: clean(s), sector: clean(sector), share: clean(share), steps,
    };
  }

  const api = {
    solve, fmt,
    circumference_of_a_circle: circumferenceOfACircle, area_of_a_circle: areaOfACircle,
    arc_length: arcLength, sector_of_a_circle: sectorOfACircle,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else global.CircleMath = api;
})(typeof window !== "undefined" ? window : globalThis);
