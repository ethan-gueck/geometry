/*
 * angles_math.js — browser mirror of angles/solver.py and the G.1 section of core/formula.py.
 *
 * Loaded after shared/static/fmt.js (window.GeoFmt). Python stays the source of
 * truth: tests/test_js_parity.py runs this file and compares solve() with the
 * Python output. Exposes window.AngleMath (browser) or module.exports (Node).
 */
(function (global) {
  "use strict";
  const { clean, fmt, deg } = global.GeoFmt;

  // ---- core/formula.py: G.1 Angle Relationships -----------------------------------
  const isComplementaryAngle = (a, b) => a + b === 90;
  const isSupplementaryAngle = (a, b) => a + b === 180;

  // ---- angles/solver.py -------------------------------------------------------------
  const SHAPES = { 90: "a corner (a right angle)", 180: "a straight line" };

  /** The β that would bring α up to `total` (90° or 180°). Page plumbing, for the hints. */
  const needed = (a, total) => clean(total - a);

  function hint(a, total) {
    const need = needed(a, total);
    if (need > 0) return `β = ${total}° − ${deg(a)} = ${deg(need)} would make ${SHAPES[total]}`;
    return `no positive β makes ${SHAPES[total]}: α is already ${deg(a)}`;
  }

  function verdict(complementary, supplementary, total) {
    if (complementary) return `complementary: together they make ${SHAPES[90]}`;
    if (supplementary) return `supplementary: together they make ${SHAPES[180]}`;
    return `neither: ${deg(total)} is neither 90° (a corner) nor 180° (a straight line)`;
  }

  function steps(a, b, total, complementary, supplementary) {
    const test = (holds, target, name) => (holds
      ? `${deg(a)} + ${deg(b)} = ${target}°: ${name}, the outer rays make ${SHAPES[target]}`
      : `${deg(total)} ≠ ${target}°: not ${name}; ${hint(a, target)}`);
    return [
      { id: "alpha", title: "The first angle: α", math: `α = ${deg(a)}, opened from the first ray` },
      { id: "beta", title: "The second angle: β, next to α", math: `β = ${deg(b)}, sharing α's vertex and its second ray` },
      { id: "total", title: "Together: α + β", math: `α + β = ${deg(a)} + ${deg(b)} = ${deg(total)}` },
      { id: "complementary", title: "Complementary: α + β = 90°", math: test(complementary, 90, "complementary") },
      { id: "supplementary", title: "Supplementary: α + β = 180°", math: test(supplementary, 180, "supplementary") },
    ];
  }

  /** Same shape as AngleSolution.to_dict() in Python. */
  function solve(a, b) {
    const complementary = isComplementaryAngle(a, b);
    const supplementary = isSupplementaryAngle(a, b);
    const total = clean(a + b);  // page plumbing: the outer angle to draw and print
    return {
      inputs: { a, b },
      total,
      complementary,
      supplementary,
      needs: { complementary: needed(a, 90), supplementary: needed(a, 180) },
      texts: { a: deg(a), b: deg(b), total: deg(total), complementary: hint(a, 90), supplementary: hint(a, 180) },
      verdict: verdict(complementary, supplementary, total),
      steps: steps(a, b, total, complementary, supplementary),
    };
  }

  const api = {
    solve, fmt, deg, hint,
    is_complementary_angle: isComplementaryAngle, is_supplementary_angle: isSupplementaryAngle,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else global.AngleMath = api;
})(typeof window !== "undefined" ? window : globalThis);
