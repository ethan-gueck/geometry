"""Interactive page: a circle's circumference and area, and the arc and sector cut off by a central angle."""

from __future__ import annotations

from pathlib import Path

from general.styles import WIDGET
from general.themes import Theme
from general.web import CodeFile, render_page, write_page
from shared.fmt import FIGURE_SCRIPT, FMT_SCRIPT

from ..solver import solve
from ..style import ROLES

HTML_DIR = Path(__file__).resolve().parent
STATIC = HTML_DIR / "static"
TEMPLATE = HTML_DIR / "templates" / "circles.html"
DEFAULT_OUTPUT = HTML_DIR.parent / "output" / "circles.html"
FORMULA = HTML_DIR.parent.parent / "core" / "formula.py"  # the Geometry track's mathematics, one section per neuron

# fmt comes from the shared browser module, so it loads first.
MATH_SCRIPTS = (FMT_SCRIPT, STATIC / "circles_math.js")
BUNDLE = WIDGET.extend(css=[STATIC / "circles.css"], js=[*MATH_SCRIPTS, FIGURE_SCRIPT, STATIC / "circles.js"])
# The "View the code" popup shows only the concept: the G.9 section of core/formula.py.
MATH = ("circumference_of_a_circle", "area_of_a_circle", "arc_length", "sector_of_a_circle")
# The animation's toggles, in the gear menu in the corner of the stage.
SHOW = (("labels", "Labels"), ("disc", "Shade the area"), ("grid", "Grid", False))
CODE = (CodeFile(FORMULA, "A circle's circumference and area, and the arc and sector cut off by a central angle, in Python.", only=MATH),)


def build_circles_html(
    r: float = 3,
    degrees: float = 60,
    output_path: str | Path | None = DEFAULT_OUTPUT,
    *,
    theme: str | Theme | None = None,
    title: str = "Circles: Circumference, Area, Arcs & Sectors",
) -> Path | str:
    """Build the page with radius r and a central angle in degrees preloaded; ``output_path=None`` returns the HTML."""
    config = {"initial": {"r": r, "degrees": degrees}, "solution": solve(r, degrees).to_dict(), "roles": ROLES}
    document = render_page(TEMPLATE, title=title, config=config, theme=theme, bundle=BUNDLE, code=CODE, show=SHOW)
    return document if output_path is None else write_page(document, output_path)
