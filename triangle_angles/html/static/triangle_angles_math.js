/*
 * triangle_angles_math.js — browser mirror of triangle_angles/solver.py and the G.2 section of core/formula.py.
 *
 * Loaded after shared/static/fmt.js (window.GeoFmt). Python stays the source of
 * truth: tests/test_js_parity.py runs this file and compares solve() with the
 * Python output. Exposes window.TriangleMath (browser) or module.exports (Node).
 */
(function (global) {
  "use strict";
  const { clean, fmt, deg } = global.GeoFmt;

  // ---- core/formula.py: G.2 Triangle Angle Sum ------------------------------------
  const triangleAngleSum = (a, b, c) => a + b + c === 180;

  // ---- triangle_angles/solver.py ------------------------------------------------------
  const BASE = 6;  // length of the drawn side AB, in figure units
  const radians = (x) => x * (Math.PI / 180);  // as Python's math.radians

  /** Corners to draw the triangle (page plumbing: the law of sines places C). */
  function vertices(a, b, c) {
    if (Math.min(a, b, c) <= 0) return null;
    const side = (BASE * Math.sin(radians(b))) / Math.sin(radians(c));
    const apex = [clean(side * Math.cos(radians(a))), clean(side * Math.sin(radians(a)))];
    return { A: [0, 0], B: [BASE, 0], C: apex };
  }

  function verdict(isTriangle, total, miss, positive) {
    if (isTriangle && positive) return "a triangle: the three angles add up to 180°";
    if (isTriangle) return "no triangle: the angles add up to 180°, but every angle of a triangle is more than 0°";
    return `no triangle: the angles add up to ${deg(total)}, ${deg(Math.abs(miss))} ${miss > 0 ? "short of" : "over"} 180°`;
  }

  function steps(a, b, c, total, miss, isTriangle) {
    const angles = `${deg(a)} + ${deg(b)} + ${deg(c)}`;
    const off = `${deg(Math.abs(miss))} ${miss > 0 ? "short of" : "over"} 180°`;
    let check, why;
    if (isTriangle) {
      check = `${deg(total)} = 180°: these angles make a triangle`;
      why = {
        id: "proof", title: "Why: a line through C parallel to AB",
        math: `A and B reappear at C as alternate interior angles, either side of C itself, and the three fill a straight line: ${angles} = 180°`,
      };
    } else {
      check = `${deg(total)} ≠ 180°: ${off}, so no triangle has these angles`;
      why = {
        id: "proof", title: "Side by side at one point",
        math: `Laid next to each other, A, B and C turn through ${deg(total)}: ${off}, so they ${miss > 0 ? "leave a gap in" : "overlap past"} the straight line`,
      };
    }
    return [
      { id: "angles", title: "The three angles", math: `A = ${deg(a)}, B = ${deg(b)}, C = ${deg(c)}` },
      { id: "sum", title: "Add them: A + B + C", math: `${angles} = ${deg(total)}` },
      { id: "check", title: "Triangle angle sum: A + B + C = 180°", math: check },
      why,
    ];
  }

  /** Same shape as TriangleAngleSolution.to_dict() in Python. */
  function solve(a, b, c) {
    const isTriangle = triangleAngleSum(a, b, c);
    const total = clean(a + b + c);  // page plumbing: the total to print and lay out
    const miss = clean(180 - total);  // how far short of (+) or over (−) a straight angle
    const corners = isTriangle ? vertices(a, b, c) : null;
    return {
      inputs: { a, b, c },
      total,
      is_triangle: isTriangle,
      miss,
      vertices: corners,
      texts: { a: deg(a), b: deg(b), c: deg(c), total: deg(total), miss: deg(Math.abs(miss)) },
      verdict: verdict(isTriangle, total, miss, corners !== null),
      steps: steps(a, b, c, total, miss, isTriangle),
    };
  }

  const api = { solve, fmt, deg, vertices, triangle_angle_sum: triangleAngleSum };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else global.TriangleMath = api;
})(typeof window !== "undefined" ? window : globalThis);
