"""Shared by every Geometry topic: number formatting and figure drawing.

    fmt.py             clean, fmt and deg: how numbers are written on every page
    static/fmt.js      the browser copy of fmt.py (window.GeoFmt), loaded before each page's math module
    static/figure.js   drawing helpers on the Manim canvas: an equal-unit view, angle wedges, polygons, right-angle marks

Not a topic (no api.py), so the site build does not publish it as one.
"""

from .fmt import FMT_SCRIPT, FIGURE_SCRIPT, clean, deg, fmt

__all__ = ["FIGURE_SCRIPT", "FMT_SCRIPT", "clean", "deg", "fmt"]
