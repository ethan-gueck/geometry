/*
 * fmt.js — browser copy of shared/fmt.py: how numbers are written on every Geometry page.
 *
 * Loaded before each page's math module. Python's f"{v:.4g}" and
 * toPrecision(4) agree except on exact ties (1.5625, 7.8125), which the
 * parity tests avoid. Exposes window.GeoFmt (browser) or module.exports (Node).
 */
(function (global) {
  "use strict";
  const clean = (v) => { const r = Number(v.toFixed(10)); return r === 0 ? 0 : r; };
  const fmt = (v) => String(Number(clean(v).toPrecision(4)));
  const deg = (v) => `${fmt(v)}°`;

  const api = { clean, fmt, deg };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else global.GeoFmt = api;
})(typeof window !== "undefined" ? window : globalThis);
