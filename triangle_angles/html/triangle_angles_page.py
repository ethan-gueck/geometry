"""Interactive page: three angles A, B and C, and the 180° angle sum that makes them a triangle."""

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
TEMPLATE = HTML_DIR / "templates" / "triangle_angles.html"
DEFAULT_OUTPUT = HTML_DIR.parent / "output" / "triangle_angles.html"
FORMULA = HTML_DIR.parent.parent / "core" / "formula.py"  # the Geometry track's mathematics, one section per neuron

# fmt comes from the shared browser module, so it loads first.
MATH_SCRIPTS = (FMT_SCRIPT, STATIC / "triangle_angles_math.js")
BUNDLE = WIDGET.extend(css=[STATIC / "triangle_angles.css"], js=[*MATH_SCRIPTS, FIGURE_SCRIPT, STATIC / "triangle_angles.js"])
# The "View the code" popup shows only the concept: the G.2 section of core/formula.py.
MATH = ("triangle_angle_sum",)
# The animation's toggles, in the gear menu in the corner of the stage.
SHOW = (("labels", "Labels"), ("proof", "Parallel-line proof"), ("grid", "Grid", False))
CODE = (CodeFile(FORMULA, "The triangle angle sum in Python: the three angles of a triangle add up to 180°.", only=MATH),)


def build_triangle_angles_html(
    a: float = 60,
    b: float = 70,
    c: float = 50,
    output_path: str | Path | None = DEFAULT_OUTPUT,
    *,
    theme: str | Theme | None = None,
    title: str = "Triangle Angle Sum",
) -> Path | str:
    """Build the page with angles A = a, B = b, C = c preloaded; ``output_path=None`` returns the HTML."""
    config = {"initial": {"a": a, "b": b, "c": c}, "solution": solve(a, b, c).to_dict(), "roles": ROLES}
    document = render_page(TEMPLATE, title=title, config=config, theme=theme, bundle=BUNDLE, code=CODE, show=SHOW)
    return document if output_path is None else write_page(document, output_path)
