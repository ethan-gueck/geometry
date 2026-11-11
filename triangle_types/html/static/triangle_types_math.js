/*
 * triangle_types_math.js — browser mirror of triangle_types/solver.py and the G.4 section of core/formula.py.
 *
 * Loaded after shared/static/fmt.js (window.GeoFmt). Python stays the source of
 * truth: tests/test_js_parity.py runs this file and compares solve() with the
 * Python output. Exposes window.TriangleTypeMath (browser) or module.exports (Node).
 */
(function (global) {
  "use strict";
  const { clean, fmt, deg } = global.GeoFmt;

  // As Python's math.isclose with its defaults (rel_tol = 1e-9, abs_tol = 0).
  const isclose = (x, y) => x === y || Math.abs(x - y) <= 1e-9 * Math.max(Math.abs(x), Math.abs(y));

  // ---- core/formula.py: G.4 Classifying Triangles ---------------------------------
  const isEquilateral = (a, b, c) => isclose(a, b) && isclose(b, c);
  const isIsosceles = (a, b, c) => isclose(a, b) || isclose(b, c) || isclose(a, c);
  const isScalene = (a, b, c) => !isIsosceles(a, b, c);

  function classifyTriangleBySides(a, b, c) {
    if (isEquilateral(a, b, c)) return "equilateral";
    if (isIsosceles(a, b, c)) return "isosceles";
    return "scalene";
  }

  function classifyTriangleByAngles(A, B, C) {
    const largest = Math.max(A, B, C);
    if (isclose(largest, 90)) return "right";
    return largest < 90 ? "acute" : "obtuse";
  }

  const isoscelesBaseAngle = (apex) => (180 - apex) / 2;

  /** As Python's sorted() on (side, name) pairs: by length, ties by name. */
  const anglesSmallestToLargest = (a, b, c) =>
    [[a, "A"], [b, "B"], [c, "C"]].sort((x, y) => x[0] - y[0] || (x[1] < y[1] ? -1 : 1)).map(([, name]) => name);

  const equilateralTriangleArea = (s) => Math.sqrt(3) / 4 * s ** 2;

  // ---- triangle_types/solver.py -------------------------------------------------------
  const SIDES = ["a", "b", "c"];
  const PAIRS = [["a", "b"], ["b", "c"], ["a", "c"]];  // the side pairs, in the order an isosceles pair is looked for

  const BY_SIDES = {
    equilateral: "all three sides equal",
    isosceles: "two equal sides, the legs",
    scalene: "no two sides equal",
  };
  const BY_ANGLES = {
    acute: "the largest angle is under 90°, so all three are",
    right: "the largest angle is exactly 90°",
    obtuse: "the largest angle is over 90°",
  };

  const radians = (x) => x * (Math.PI / 180);  // as Python's math.radians
  const degrees = (x) => x * (180 / Math.PI);  // as Python's math.degrees

  /** Triangle inequality (page plumbing for validating the inputs). */
  const closes = (a, b, c) => Math.min(a, b, c) > 0 && a < b + c && b < a + c && c < a + b;

  /** A, B and C in degrees by the law of cosines (page plumbing). */
  function anglesFromSides(a, b, c) {
    const corner = (opposite, x, y) => {
      const cosine = Math.max(-1, Math.min(1, (x * x + y * y - opposite * opposite) / (2 * x * y)));
      return clean(degrees(Math.acos(cosine)));
    };
    return { A: corner(a, b, c), B: corner(b, a, c), C: corner(c, a, b) };
  }

  /** Corners to draw: A at the origin, AB = c along the x-axis, C at angle A (page plumbing). */
  function vertices(b, c, angleA) {
    const t = radians(angleA);
    return { A: [0, 0], B: [c, 0], C: [clean(b * Math.cos(t)), clean(b * Math.sin(t))] };
  }

  const relation = (x, y) => (isclose(x, y) ? "=" : "<");

  function chain(names, values) {
    let text = names[0];
    for (let i = 1; i < names.length; i++) text += ` ${relation(values[names[i - 1]], values[names[i]])} ${names[i]}`;
    return text;
  }

  /** Tick marks per side (arcs per opposite angle): equal sides share a count, longer sides get more. */
  function marks(order, sides) {
    const counts = {};
    let rank = 1;
    order.forEach((name, i) => {
      if (i && !isclose(sides[order[i - 1]], sides[name])) rank += 1;
      counts[name] = rank;
    });
    return counts;
  }

  const isoscelesPair = (sides) => PAIRS.find(([x, y]) => isclose(sides[x], sides[y])) || null;

  function triangleSteps(sides, angles, bySides, byAngles, order, apex, base, area) {
    const s = Object.fromEntries(Object.entries(sides).map(([k, v]) => [k, fmt(v)]));
    const t = Object.fromEntries(Object.entries(angles).map(([k, v]) => [k, deg(v)]));
    const low = order.map((name) => name.toLowerCase());  // the sides, shortest first
    const shorter = clean(sides[low[0]] + sides[low[1]]);
    let equal, angleStep;
    if (bySides === "equilateral") {
      equal = `a = b = c = ${s.a}: equilateral, ${BY_SIDES.equilateral}`;
      angleStep = {
        id: "equal-angles", title: "Equilateral: A = B = C = 60°",
        math: "Three equal sides, so three equal angles, sharing 180°: 180° / 3 = 60° each",
      };
    } else if (bySides === "isosceles") {
      const [x, y] = SIDES.filter((n) => n !== apex.toLowerCase());
      equal = `${x} = ${y} = ${s[x]}, ${apex.toLowerCase()} = ${s[apex.toLowerCase()]}: isosceles, ${BY_SIDES.isosceles}`;
      angleStep = {
        id: "equal-angles", title: `Base angles theorem: ${x} = ${y} ⟺ ${x.toUpperCase()} = ${y.toUpperCase()}`,
        math: `${x.toUpperCase()} = ${y.toUpperCase()} = (180° − ${apex}) / 2 = (180° − ${t[apex]}) / 2 = ${deg(base)}`,
      };
    } else {
      equal = `a = ${s.a}, b = ${s.b}, c = ${s.c}, all different: scalene, ${BY_SIDES.scalene}`;
      angleStep = {
        id: "equal-angles", title: "Scalene: no two angles equal",
        math: `No two sides equal, so no two angles: A = ${t.A}, B = ${t.B}, C = ${t.C}`,
      };
    }
    const largest = order[order.length - 1];
    const measure = byAngles === "right" ? t[largest] : `${t[largest]} ${byAngles === "acute" ? "<" : ">"} 90°`;
    const between = order.slice(0, -1).map((name, i) => `${t[name]} ${relation(angles[name], angles[order[i + 1]])}`).join(" ");
    const steps = [
      { id: "sides", title: "The three sides: a, b, c opposite angles A, B, C", math: `a = ${s.a}, b = ${s.b}, c = ${s.c}` },
      {
        id: "inequality", title: "Triangle inequality: the two shorter sides outreach the longest",
        math: `${low[0]} + ${low[1]} = ${s[low[0]]} + ${s[low[1]]} = ${fmt(shorter)} > ${low[2]} = ${s[low[2]]}: the sides close into a triangle`,
      },
      { id: "by-sides", title: "By sides: how many are equal", math: equal },
      { id: "angles", title: "The angles, from the sides by the law of cosines", math: `A = ${t.A}, B = ${t.B}, C = ${t.C}: A + B + C = 180°` },
      angleStep,
      { id: "order", title: "Side–angle order: a > b ⟺ A > B", math: `${chain(low, sides)}, so ${chain(order, angles)}: ${between} ${t[largest]}` },
      { id: "by-angles", title: "By the largest angle: under, at or over 90°", math: `max(A, B, C) = ${largest} = ${measure}: ${byAngles}, ${BY_ANGLES[byAngles]}` },
    ];
    if (area !== null) {
      steps.push({ id: "area", title: "Equilateral area: (√3 / 4) s²", math: `(√3 / 4) × ${s.a}² = ${fmt(area)}, half the base s times the height (√3 / 2) s` });
    }
    return steps;
  }

  function openSteps(sides, order, gap) {
    const s = Object.fromEntries(Object.entries(sides).map(([k, v]) => [k, fmt(v)]));
    const low = order.map((name) => name.toLowerCase());
    const shorter = clean(sides[low[0]] + sides[low[1]]);
    let fail = `${low[0]} + ${low[1]} = ${s[low[0]]} + ${s[low[1]]} = ${fmt(shorter)}`;
    if (gap === 0) fail += ` = ${low[2]} = ${s[low[2]]}: the shorter sides lie flat along the longest, with no room for a corner`;
    else fail += ` < ${low[2]} = ${s[low[2]]}: the shorter sides fall ${fmt(gap)} short of reaching across the longest`;
    return [
      { id: "sides", title: "The three sides: a, b, c opposite angles A, B, C", math: `a = ${s.a}, b = ${s.b}, c = ${s.c}` },
      { id: "inequality", title: "Triangle inequality: the two shorter sides outreach the longest", math: fail },
      { id: "by-sides", title: "Nothing to classify", math: `No triangle, so no type by sides or by angles: lengthen ${low[0]} or ${low[1]}, or shorten ${low[2]}` },
    ];
  }

  /** Same shape as TriangleTypeSolution.to_dict() in Python. */
  function solve(a, b, c) {
    const sides = { a, b, c };
    const order = anglesSmallestToLargest(a, b, c);  // angle names, smallest first; their opposite sides sort the same way
    const low = order.map((name) => name.toLowerCase());
    const gap = clean(Math.max(sides[low[2]] - sides[low[0]] - sides[low[1]], 0));  // page plumbing: how far the shorter sides miss
    const texts = { a: fmt(a), b: fmt(b), c: fmt(c), sides: chain(low, sides) };
    if (!closes(a, b, c)) {
      texts.gap = fmt(gap);
      return {
        inputs: sides, is_triangle: false, gap, angles: null, vertices: null,
        equilateral: false, isosceles: false, scalene: false, by_sides: null, by_angles: null,
        order, marks: marks(low, sides), apex: null, base_angle: null, area: null, texts,
        verdict: `no triangle: ${low[0]} + ${low[1]} = ${fmt(clean(sides[low[0]] + sides[low[1]]))} does not exceed ${low[2]} = ${texts[low[2]]}`,
        steps: openSteps(sides, order, gap),
      };
    }
    const angles = anglesFromSides(a, b, c);
    const bySides = classifyTriangleBySides(a, b, c);
    const byAngles = classifyTriangleByAngles(angles.A, angles.B, angles.C);
    const pair = bySides === "isosceles" ? isoscelesPair(sides) : null;
    const apex = pair ? SIDES.find((n) => !pair.includes(n)).toUpperCase() : null;  // the angle between the equal legs
    const base = apex ? clean(isoscelesBaseAngle(angles[apex])) : null;
    const area = bySides === "equilateral" ? clean(equilateralTriangleArea(a)) : null;
    Object.assign(texts, { A: deg(angles.A), B: deg(angles.B), C: deg(angles.C), angles: chain(order, angles) });
    if (base !== null) texts.base = deg(base);
    if (area !== null) texts.area = fmt(area);
    return {
      inputs: sides,
      is_triangle: true,
      gap,
      angles,
      vertices: vertices(b, c, angles.A),
      equilateral: isEquilateral(a, b, c),
      isosceles: isIsosceles(a, b, c),
      scalene: isScalene(a, b, c),
      by_sides: bySides,
      by_angles: byAngles,
      order,
      marks: marks(low, sides),
      apex,
      base_angle: base,
      area,
      texts,
      verdict: `${byAngles === "right" ? "a" : "an"} ${byAngles} ${bySides} triangle`,
      steps: triangleSteps(sides, angles, bySides, byAngles, order, apex, base, area),
    };
  }

  const api = {
    solve, fmt, deg, closes, vertices, angles_from_sides: anglesFromSides,
    is_equilateral: isEquilateral, is_isosceles: isIsosceles, is_scalene: isScalene,
    classify_triangle_by_sides: classifyTriangleBySides, classify_triangle_by_angles: classifyTriangleByAngles,
    isosceles_base_angle: isoscelesBaseAngle, angles_smallest_to_largest: anglesSmallestToLargest,
    equilateral_triangle_area: equilateralTriangleArea,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else global.TriangleTypeMath = api;
})(typeof window !== "undefined" ? window : globalThis);
