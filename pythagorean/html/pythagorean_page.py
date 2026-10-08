"""Interactive page: the squares on a right triangle's sides, a² + b² = c², and any three sides classified."""

from __future__ import annotations

from pathlib import Path

from general.styles import WIDGET
from general.themes import Theme
from general.web import CodeFile, render_page, write_page
from shared.fmt import FIGURE_SCRIPT, FMT_SCRIPT

from ..solver import classify, solve
from ..style import ROLES

HTML_DIR = Path(__file__).resolve().parent
STATIC = HTML_DIR / "static"
TEMPLATE = HTML_DIR / "templates" / "pythagorean.html"
DEFAULT_OUTPUT = HTML_DIR.parent / "output" / "pythagorean.html"
FORMULA = HTML_DIR.parent.parent / "core" / "formula.py"  # the Geometry track's mathematics, one section per neuron

# fmt comes from the shared browser module, so it loads first.
MATH_SCRIPTS = (FMT_SCRIPT, STATIC / "pythagorean_math.js")
BUNDLE = WIDGET.extend(css=[STATIC / "pythagorean.css"], js=[*MATH_SCRIPTS, FIGURE_SCRIPT, STATIC / "pythagorean.js"])
# The "View the code" popup shows only the concept: the G.3 section of core/formula.py.
MATH = ("pythagorean_theorem", "is_acute_triangle", "is_obtuse_triangle")
# The animation's toggles, in the gear menu in the corner of the stage.
SHOW = (("labels", "Labels"), ("squares", "Squares on the sides"), ("units", "Unit squares"), ("grid", "Grid", False))
CODE = (CodeFile(FORMULA, "The Pythagorean theorem in Python, and c² against a² + b² to tell acute from obtuse.", only=MATH),)


def build_pythagorean_html(
    a: float = 3,
    b: float = 4,
    c: float | None = None,
    output_path: str | Path | None = DEFAULT_OUTPUT,
    *,
    theme: str | Theme | None = None,
    title: str = "Pythagorean Theorem",
) -> Path | str:
    """Build the page with legs a and b preloaded, or with all three sides when ``c`` is given.

    ``output_path=None`` returns the HTML.
    """
    if c is None:
        initial, solution = {"mode": "legs", "a": a, "b": b}, solve(a, b)
    else:
        initial, solution = {"mode": "sides", "a": a, "b": b, "c": c}, classify(a, b, c)
    config = {"initial": initial, "solution": solution.to_dict(), "roles": ROLES}
    document = render_page(TEMPLATE, title=title, config=config, theme=theme, bundle=BUNDLE, code=CODE, show=SHOW)
    return document if output_path is None else write_page(document, output_path)
