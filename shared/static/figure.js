/*
 * figure.js — drawing helpers for geometric figures on the shared Manim canvas.
 *
 * Figures need equal units across and up, so angles and squares are not
 * distorted: equalView() frames a bounding box that way, like the complex
 * numbers page's ideal() view. The rest draw in math coordinates through the
 * canvas context, clipped to the stage like ManimCanvas's own primitives.
 * Angles are in degrees, anticlockwise from the positive x direction.
 * Exposes window.GeoFigure = { equalView, unit, polar, wedge, arc, polygon, segments, rightAngle }.
 */
(function (global) {
  "use strict";
  const { niceStep } = global.Manim;
  const RAD = Math.PI / 180;

  /** A view showing [x0, x1] × [y0, y1] plus `pad` all round, with equal units across and up. */
  function equalView(scene, [x0, x1, y0, y1], pad = 0.6) {
    const k = (scene.width - 2 * scene.margin) / (scene.height - 2 * scene.margin) || 16 / 9;
    let hx = (x1 - x0) / 2 + pad, hy = (y1 - y0) / 2 + pad;
    if (hx / hy < k) hx = hy * k; else hy = hx / k;
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    const step = niceStep(2 * Math.min(hx, hy), 6);
    return { x_min: cx - hx, x_max: cx + hx, y_min: cy - hy, y_max: cy + hy, x_step: step, y_step: step };
  }

  /** Pixels per unit (the same across and up in an equal-unit view). */
  const unit = (scene) => scene.px(1) - scene.px(0);

  /** The point r away from (x, y) in direction `angle`. */
  const polar = (x, y, r, angle) => [x + r * Math.cos(angle * RAD), y + r * Math.sin(angle * RAD)];

  /** Shared stroke and fill settings, then `path()` stroked and/or filled inside the stage clip. */
  function paint(scene, path, { color, fill = null, alpha = 0.25, width = 2, dash = null, opacity = 1 }) {
    scene.withClip(() => {
      const { ctx } = scene;
      ctx.globalAlpha = opacity;
      ctx.beginPath();
      path(ctx);
      if (fill) {
        ctx.save();
        ctx.globalAlpha = opacity * alpha;
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.restore();
      }
      if (width > 0) {
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.lineJoin = "round";
        if (dash) ctx.setLineDash(dash);
        ctx.stroke();
      }
    });
  }

  /** An arc of radius r about (x, y), from angle `from` to `to` (either way round). */
  function arc(scene, x, y, r, from, to, color, options = {}) {
    if (r <= 0 || from === to) return;
    paint(scene, (ctx) => {
      ctx.arc(scene.px(x), scene.py(y), r * unit(scene), -from * RAD, -to * RAD, to > from);
    }, { color, ...options });
  }

  /** A filled angle wedge (sector) of radius r about (x, y) from `from` to `to`, outlined along its arc. */
  function wedge(scene, x, y, r, from, to, color, { alpha = 0.28, width = 2, opacity = 1 } = {}) {
    if (r <= 0 || from === to) return;
    const cx = scene.px(x), cy = scene.py(y), R = r * unit(scene);
    paint(scene, (ctx) => {
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, R, -from * RAD, -to * RAD, to > from);
      ctx.closePath();
    }, { color, fill: color, alpha, width: 0, opacity });
    arc(scene, x, y, r, from, to, color, { width, opacity });
  }

  /** A closed polygon through `points` ([[x, y], ...]), filled and/or outlined. */
  function polygon(scene, points, color, { fill = null, alpha = 0.22, width = 2, dash = null, opacity = 1 } = {}) {
    if (points.length < 2) return;
    paint(scene, (ctx) => {
      points.forEach(([x, y], i) => (i ? ctx.lineTo(scene.px(x), scene.py(y)) : ctx.moveTo(scene.px(x), scene.py(y))));
      ctx.closePath();
    }, { color, fill, alpha, width, dash, opacity });
  }

  /** Several line segments ([[x1, y1, x2, y2], ...]) in one stroke, e.g. a faint grid of unit squares. */
  function segments(scene, list, color, { width = 1, dash = null, opacity = 1 } = {}) {
    if (!list.length) return;
    paint(scene, (ctx) => {
      list.forEach(([x1, y1, x2, y2]) => { ctx.moveTo(scene.px(x1), scene.py(y1)); ctx.lineTo(scene.px(x2), scene.py(y2)); });
    }, { color, width, dash, opacity });
  }

  /** The small square that marks a right angle at (x, y), between directions `angle` and `angle` + 90°. */
  function rightAngle(scene, x, y, angle, size, color, { width = 2, opacity = 1 } = {}) {
    const a = polar(x, y, size, angle), b = polar(x, y, size, angle + 90);
    const corner = [a[0] + b[0] - x, a[1] + b[1] - y];
    paint(scene, (ctx) => {
      ctx.moveTo(scene.px(a[0]), scene.py(a[1]));
      ctx.lineTo(scene.px(corner[0]), scene.py(corner[1]));
      ctx.lineTo(scene.px(b[0]), scene.py(b[1]));
    }, { color, width, opacity });
  }

  global.GeoFigure = { equalView, unit, polar, wedge, arc, polygon, segments, rightAngle };
})(window);
