/*
 * points_lines_math.js — browser mirror of points_lines/solver.py and the G.1 section of core/formula.py.
 *
 * Loaded after shared/static/fmt.js (window.GeoFmt). Python stays the source of
 * truth: tests/test_js_parity.py runs this file and compares solve() with the
 * Python output. Exposes window.PointsMath (browser) or module.exports (Node).
 */
(function (global) {
  "use strict";
  const { clean, fmt } = global.GeoFmt;

  /** Python's math.isclose(a, b, abs_tol=1e-9) with its default rel_tol of 1e-9. */
  const isclose = (a, b) => Math.abs(a - b) <= Math.max(1e-9 * Math.max(Math.abs(a), Math.abs(b)), 1e-9);

  // ---- core/formula.py: G.1 Points, Lines, Rays, Segments & Planes ----------------
  const segmentLength = (x1, y1, x2, y2) => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  const segmentAddition = (ab, bc) => ab + bc;
  const areCollinear = (ax, ay, bx, by, cx, cy) => isclose((by - ay) * (cx - bx), (cy - by) * (bx - ax));
  function isBetween(ax, ay, bx, by, cx, cy) {
    const ab = segmentLength(ax, ay, bx, by), bc = segmentLength(bx, by, cx, cy), ac = segmentLength(ax, ay, cx, cy);
    return isclose(segmentAddition(ab, bc), ac);
  }
  const determineOnePlane = (ax, ay, bx, by, cx, cy) => !areCollinear(ax, ay, bx, by, cx, cy);
  function lineIntersection(ax, ay, bx, by, cx, cy, dx, dy) {
    const denominator = (bx - ax) * (dy - cy) - (by - ay) * (dx - cx);
    if (isclose(denominator, 0)) return areCollinear(ax, ay, bx, by, cx, cy) ? ["same", null] : ["parallel", null];
    const t = ((cx - ax) * (dy - cy) - (cy - ay) * (dx - cx)) / denominator;
    return ["point", [ax + t * (bx - ax), ay + t * (by - ay)]];
  }

  // ---- points_lines/solver.py -------------------------------------------------------
  function validate(ax, ay, bx, by, cx, cy, dx, dy) {
    if (ax === bx && ay === by) throw new Error("A and B are the same point; a line needs two different points.");
    if (cx === dx && cy === dy) throw new Error("C and D are the same point; a line needs two different points.");
  }

  const point = (x, y) => `(${fmt(x)}, ${fmt(y)})`;
  const slope = (x1, y1, x2, y2) => (clean(x2 - x1) === 0 ? null : clean((y2 - y1) / (x2 - x1)));
  const slopeText = (m) => (m === null ? "undefined (vertical)" : fmt(m));

  function steps(ab, bc, ac, collinear, between, mAb, mBc, kind, meet) {
    const total = clean(segmentAddition(ab, bc));
    let addition;
    if (between) addition = `AB + BC = ${fmt(ab)} + ${fmt(bc)} = ${fmt(total)} = AC: B is between A and C`;
    else if (collinear) addition = `AB + BC = ${fmt(total)} ≠ AC = ${fmt(ac)}: B is on line AC but outside segment AC`;
    else addition = `AB + BC = ${fmt(total)} > AC = ${fmt(ac)}: B is off the segment, so the path through B is ${fmt(total - ac)} longer`;
    const same = mAb === null && mBc === null
      ? "both undefined: A, B and C share one x, so they are collinear"
      : `m_AB = ${slopeText(mAb)}, m_BC = ${slopeText(mBc)}: ` + (collinear ? "equal, so A, B and C are collinear" : "different, so they are not collinear");
    const plane = !collinear
      ? "A, B and C are not on one line, so they determine exactly one plane"
      : "A, B and C are on one line, so many planes contain them (any plane through that line)";
    let crossing;
    if (kind === "point") crossing = `lines AB and CD meet in exactly one point, ${point(...meet)}`;
    else if (kind === "parallel") crossing = "lines AB and CD are parallel: same slope, different lines, so they never meet";
    else crossing = "lines AB and CD are the same line: they meet everywhere";
    return [
      { id: "segment", title: "Segment, ray and line through A and B", math: `AB = ${fmt(ab)}: the segment stops at A and B, the ray starts at A, the line runs both ways` },
      { id: "addition", title: "Segment addition: AB + BC = AC when B is between", math: addition },
      { id: "collinear", title: "Collinearity: m_AB = m_BC", math: same },
      { id: "plane", title: "Plane postulate: three noncollinear points", math: plane },
      { id: "intersection", title: "Two lines meet once, never, or everywhere", math: crossing },
    ];
  }

  /** Same shape as PointsSolution.to_dict() in Python. */
  function solve(ax, ay, bx, by, cx, cy, dx, dy) {
    validate(ax, ay, bx, by, cx, cy, dx, dy);
    const ab = clean(segmentLength(ax, ay, bx, by));
    const bc = clean(segmentLength(bx, by, cx, cy));
    const ac = clean(segmentLength(ax, ay, cx, cy));
    const cd = clean(segmentLength(cx, cy, dx, dy));
    const collinear = areCollinear(ax, ay, bx, by, cx, cy);
    const between = isBetween(ax, ay, bx, by, cx, cy);
    const plane = determineOnePlane(ax, ay, bx, by, cx, cy);
    const mAb = slope(ax, ay, bx, by), mBc = slope(bx, by, cx, cy);
    let [kind, meet] = lineIntersection(ax, ay, bx, by, cx, cy, dx, dy);
    meet = meet === null ? null : [clean(meet[0]), clean(meet[1])];
    const xs = [ax, bx, cx, dx], ys = [ay, by, cy, dy];
    if (meet !== null && Math.abs(meet[0]) <= 50 && Math.abs(meet[1]) <= 50) { xs.push(meet[0]); ys.push(meet[1]); }
    return {
      inputs: { ax, ay, bx, by, cx, cy, dx, dy },
      ab, bc, ac, cd,
      collinear,
      between,
      plane,
      slopes: { ab: mAb, bc: mBc },
      intersection: { kind, point: meet },
      bounds: [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)],
      steps: steps(ab, bc, ac, collinear, between, mAb, mBc, kind, meet),
    };
  }

  const api = {
    solve, fmt,
    segment_length: segmentLength, segment_addition: segmentAddition, are_collinear: areCollinear,
    is_between: isBetween, determine_one_plane: determineOnePlane, line_intersection: lineIntersection,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else global.PointsMath = api;
})(typeof window !== "undefined" ? window : globalThis);
