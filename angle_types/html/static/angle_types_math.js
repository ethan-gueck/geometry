/*
 * angle_types_math.js — browser mirror of angle_types/solver.py and the G.2 section of core/formula.py.
 *
 * Loaded after shared/static/fmt.js (window.GeoFmt). Python stays the source of
 * truth: tests/test_js_parity.py runs this file and compares solve() with the
 * Python output. Exposes window.AngleTypeMath (browser) or module.exports (Node).
 */
(function (global) {
  "use strict";
  const { clean, fmt, deg } = global.GeoFmt;

  // ---- core/formula.py: G.2 Angles: Measure & Types ---------------------------------
  const isAcuteAngle = (theta) => 0 < theta && theta < 90;
  const isRightAngle = (theta) => theta === 90;
  const isObtuseAngle = (theta) => 90 < theta && theta < 180;
  const isStraightAngle = (theta) => theta === 180;
  const isReflexAngle = (theta) => 180 < theta && theta < 360;
  const isFullTurn = (theta) => theta === 360;
  const degreesToRadians = (theta) => theta * Math.PI / 180;
  const reflexAngle = (theta) => 360 - theta;
  const angleAddition = (abd, dbc) => abd + dbc;
  const angleBisector = (abc) => abc / 2;

  // ---- angle_types/solver.py --------------------------------------------------------
  const TYPES = {
    zero: "a zero angle: the two sides lie on top of each other",
    acute: "acute: between 0° and 90°, smaller than a right angle",
    right: "right: exactly 90°, the sides are perpendicular",
    obtuse: "obtuse: between 90° and 180°, wider than a right angle",
    straight: "straight: exactly 180°, the sides make a line",
    reflex: "reflex: between 180° and 360°, more than a straight angle",
    full: "a full turn: 360°, one revolution",
  };

  function validate(theta, d) {
    if (!(theta >= 0 && theta <= 360)) throw new Error("Enter ∠ABC between 0° and 360°.");
    if (!(d >= 0 && d <= theta)) throw new Error("Ray BD must lie inside ∠ABC: ∠ABD between 0° and ∠ABC.");
  }

  function classify(theta) {
    if (isAcuteAngle(theta)) return "acute";
    if (isRightAngle(theta)) return "right";
    if (isObtuseAngle(theta)) return "obtuse";
    if (isStraightAngle(theta)) return "straight";
    if (isReflexAngle(theta)) return "reflex";
    if (isFullTurn(theta)) return "full";
    return "zero";
  }

  function piText(theta) {
    for (let q = 1; q <= 36; q++) {
      let p = theta * q / 180;
      if (Math.abs(p - Math.round(p)) < 1e-9) {
        p = Math.round(p);
        if (p === 0) return "0";
        const top = p === 1 ? "π" : `${p}π`;
        return q === 1 ? top : `${top}/${q}`;
      }
    }
    return "";
  }

  function radiansText(theta) {
    const rad = degreesToRadians(theta);
    const exact = piText(theta);
    if (exact === "" || exact === "0") return `${fmt(rad)} rad`;
    return `${exact} ≈ ${fmt(rad)} rad`;
  }

  function steps(theta, d, kind, outside, dbc, half, bisected) {
    const rad = degreesToRadians(theta);
    const exact = piText(theta);
    const asPi = exact !== "" && exact !== "0" ? ` = ${exact}` : "";
    return [
      { id: "type", title: "Type: compare θ with 90°, 180° and 360°", math: `θ = ${deg(theta)}: ${TYPES[kind]}` },
      { id: "radians", title: "Radians: θ × π / 180°", math: `${fmt(theta)} × π / 180 = ${fmt(rad)} rad${asPi}` },
      { id: "outside", title: "The angle outside: 360° − θ", math: `360° − ${deg(theta)} = ${deg(outside)}` },
      { id: "addition", title: "Angle addition: m∠ABD + m∠DBC = m∠ABC", math: `${deg(d)} + ${deg(dbc)} = ${deg(angleAddition(d, dbc))}` },
      { id: "bisector", title: "Bisector: half of m∠ABC on each side",
        math: `½ × ${deg(theta)} = ${deg(half)}` + (bisected ? ": BD is the bisector" : `; BD would bisect ∠ABC at ${deg(half)}, not ${deg(d)}`) },
    ];
  }

  /** Same shape as AngleTypeSolution.to_dict() in Python. */
  function solve(theta, d) {
    validate(theta, d);
    const kind = classify(theta);
    const outside = clean(reflexAngle(theta));
    const dbc = clean(theta - d);  // page plumbing: the part of ∠ABC past BD
    const half = clean(angleBisector(theta));
    const bisected = clean(d) === half;
    return {
      inputs: { theta, d },
      kind,
      type_text: TYPES[kind],
      radians: clean(degreesToRadians(theta)),
      radians_text: radiansText(theta),
      outside,
      dbc,
      bisector: half,
      bisected,
      texts: { theta: deg(theta), d: deg(d), dbc: deg(dbc), outside: deg(outside), bisector: deg(half) },
      steps: steps(theta, d, kind, outside, dbc, half, bisected),
    };
  }

  const api = {
    solve, classify, fmt, deg,
    is_acute_angle: isAcuteAngle, is_right_angle: isRightAngle, is_obtuse_angle: isObtuseAngle,
    is_straight_angle: isStraightAngle, is_reflex_angle: isReflexAngle, is_full_turn: isFullTurn,
    degrees_to_radians: degreesToRadians, reflex_angle: reflexAngle, angle_addition: angleAddition, angle_bisector: angleBisector,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else global.AngleTypeMath = api;
})(typeof window !== "undefined" ? window : globalThis);
