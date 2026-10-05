/*
 * pythagorean_math.js — browser mirror of pythagorean/solver.py and the G.3 section of core/formula.py.
 *
 * Loaded after shared/static/fmt.js (window.GeoFmt). Python stays the source of
 * truth: tests/test_js_parity.py runs this file and compares solve() and
 * classify() with the Python output. Exposes window.PythagorasMath (browser)
 * or module.exports (Node).
 */
(function (global) {
  "use strict";
  const { clean, fmt } = global.GeoFmt;

  // ---- core/formula.py: G.3 Pythagorean Theorem ---------------------------------
  const pythagoreanTheorem = (a, b) => (a ** 2 + b ** 2) ** 0.5;
  const isAcuteTriangle = (a, b, c) => c ** 2 < a ** 2 + b ** 2;
  const isObtuseTriangle = (a, b, c) => c ** 2 > a ** 2 + b ** 2;

  // ---- pythagorean/solver.py ------------------------------------------------------
  const KINDS = {
    right: "right: the angle opposite c is exactly 90°",
    acute: "acute: the angle opposite c, and so every angle, is less than 90°",
    obtuse: "obtuse: the angle opposite c is more than 90°",
    none: "no triangle: sides a and b cannot meet across c",
  };

  /** The sides with the longest as c, as the G.3 formulas expect. */
  function longestLast(a, b, c) {
    if (c >= a && c >= b) return [a, b, c];
    return a >= b ? [c, b, a] : [a, c, b];
  }

  /** cos of the angle opposite c (page plumbing for the drawing: the law of cosines). */
  const cornerCosine = (a, b, c) => clean((a * a + b * b - c * c) / (2 * a * b));

  function vertices(a, b, cosine) {
    if (!(cosine > -1 && cosine < 1)) return null;
    const sine = (1 - cosine * cosine) ** 0.5;
    return { C: [0, 0], B: [clean(a), 0], A: [clean(b * cosine), clean(b * sine)] };
  }

  const isTriple = (a, b, c) => [a, b, c].every((s) => Number.isInteger(s) && s > 0);

  function legsSteps(a, b, c, squares, triple) {
    const [a2, b2, c2] = ["a", "b", "c"].map((k) => fmt(squares[k]));
    let hypotenuse = `c = √${c2} = ${fmt(c)}`;
    if (triple) hypotenuse += `: ${fmt(a)}, ${fmt(b)}, ${fmt(c)} are whole numbers, a Pythagorean triple`;
    return [
      { id: "legs", title: "The legs: a and b meet at the right angle", math: `a = ${fmt(a)}, b = ${fmt(b)}` },
      { id: "squares", title: "Square each leg", math: `a² = ${fmt(a)}² = ${a2}, b² = ${fmt(b)}² = ${b2}` },
      { id: "sum", title: "Pythagorean theorem: a² + b² = c²", math: `c² = ${a2} + ${b2} = ${c2}: the square on the hypotenuse has the area of the other two together` },
      { id: "hypotenuse", title: "The hypotenuse: c = √(a² + b²)", math: hypotenuse },
    ];
  }

  function sidesSteps(sides, squares, total, sign, kind, relabelled) {
    const [a, b, c] = ["a", "b", "c"].map((k) => fmt(sides[k]));
    const [a2, b2, c2] = ["a", "b", "c"].map((k) => fmt(squares[k]));
    let order = `a = ${a}, b = ${b}, c = ${c}`;
    if (relabelled) order += ", relabelled so that c is the longest";
    return [
      { id: "sides", title: "The three sides, c the longest", math: order },
      { id: "squares", title: "Square each side", math: `a² = ${a2}, b² = ${b2}, c² = ${c2}` },
      { id: "compare", title: "Compare c² with a² + b²", math: `c² = ${c2} ${sign} a² + b² = ${a2} + ${b2} = ${fmt(total)}` },
      { id: "kind", title: "Classify: c² < a² + b² acute, c² > a² + b² obtuse", math: `c² ${sign} a² + b²: ${KINDS[kind]}` },
    ];
  }

  const texts = (sides, squares, total) => ({
    a: fmt(sides.a), b: fmt(sides.b), c: fmt(sides.c),
    a2: fmt(squares.a), b2: fmt(squares.b), c2: fmt(squares.c), sum: fmt(total),
  });

  /** Same shape as solve() in Python: legs a and b, hypotenuse c = √(a² + b²). */
  function solve(a, b) {
    const cExact = pythagoreanTheorem(a, b);
    const c = clean(cExact);
    const squares = { a: clean(a * a), b: clean(b * b), c: clean(cExact * cExact) };
    const total = clean(a * a + b * b);
    const triple = isTriple(a, b, c);
    const sides = { a, b, c };
    return {
      mode: "legs",
      inputs: { a, b },
      sides,
      relabelled: false,
      squares,
      sum: total,
      sign: "=",
      kind: "right",
      vertices: vertices(a, b, 0),  // the right angle at C
      triple,
      texts: texts(sides, squares, total),
      verdict: `c = √(${fmt(a)}² + ${fmt(b)}²) = ${fmt(c)}` + (triple ? ": a Pythagorean triple" : ""),
      steps: legsSteps(a, b, c, squares, triple),
    };
  }

  /** Same shape as classify() in Python: any three sides, acute, right or obtuse. */
  function classify(a, b, c) {
    const [x, y, z] = longestLast(a, b, c);
    const acute = isAcuteTriangle(x, y, z);
    const obtuse = isObtuseTriangle(x, y, z);
    const sign = acute ? "<" : obtuse ? ">" : "=";
    const corners = Math.min(x, y, z) > 0 ? vertices(x, y, cornerCosine(x, y, z)) : null;
    const kind = corners === null ? "none" : acute ? "acute" : obtuse ? "obtuse" : "right";
    const sides = { a: x, b: y, c: z };
    const squares = { a: clean(x * x), b: clean(y * y), c: clean(z * z) };
    const total = clean(x * x + y * y);
    const relabelled = x !== a || y !== b || z !== c;
    return {
      mode: "sides",
      inputs: { a, b, c },
      sides,
      relabelled,
      squares,
      sum: total,
      sign,
      kind,
      vertices: corners,
      triple: kind === "right" && isTriple(x, y, z),
      texts: texts(sides, squares, total),
      verdict: KINDS[kind],
      steps: sidesSteps(sides, squares, total, sign, kind, relabelled),
    };
  }

  const api = {
    solve, classify, fmt,
    pythagorean_theorem: pythagoreanTheorem, is_acute_triangle: isAcuteTriangle, is_obtuse_triangle: isObtuseTriangle,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else global.PythagorasMath = api;
})(typeof window !== "undefined" ? window : globalThis);
