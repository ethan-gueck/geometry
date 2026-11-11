"""Interactive page: three sides a, b and c, the triangle they make, and its type by sides and by angles."""

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
TEMPLATE = HTML_DIR / "templates" / "triangle_types.html"
DEFAULT_OUTPUT = HTML_DIR.parent / "output" / "triangle_types.html"
FORMULA = HTML_DIR.parent.parent / "core" / "formula.py"  # the Geometry track's mathematics, one section per neuron

# fmt comes from the shared browser module, so it loads first.
MATH_SCRIPTS = (FMT_SCRIPT, STATIC / "triangle_types_math.js")
BUNDLE = WIDGET.extend(css=[STATIC / "triangle_types.css"], js=[*MATH_SCRIPTS, FIGURE_SCRIPT, STATIC / "triangle_types.js"])
# The "View the code" popup shows only the concept: the G.4 section of core/formula.py.
MATH = (
    "is_equilateral", "is_isosceles", "is_scalene", "classify_triangle_by_sides", "classify_triangle_by_angles",
    "isosceles_base_angle", "angles_smallest_to_largest", "equilateral_triangle_area",
)
# The animation's toggles, in the gear menu in the corner of the stage.
SHOW = (("labels", "Labels"), ("marks", "Tick marks & arcs"), ("guide", "90° guide"), ("grid", "Grid", False))
CODE = (CodeFile(FORMULA, "Classifying triangles in Python: by how many sides are equal, and by the largest angle against 90°.", only=MATH),)


def build_triangle_types_html(
    a: float = 5,
    b: float = 5,
    c: float = 6,
    output_path: str | Path | None = DEFAULT_OUTPUT,
    *,
    theme: str | Theme | None = None,
    title: str = "Classifying Triangles",
) -> Path | str:
    """Build the page with sides a, b, c preloaded; ``output_path=None`` returns the HTML."""
    config = {"initial": {"a": a, "b": b, "c": c}, "solution": solve(a, b, c).to_dict(), "roles": ROLES}
    document = render_page(TEMPLATE, title=title, config=config, theme=theme, bundle=BUNDLE, code=CODE, show=SHOW)
    return document if output_path is None else write_page(document, output_path)
