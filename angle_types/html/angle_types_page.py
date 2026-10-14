"""Interactive page: one angle ∠ABC, its type and measure, the angle outside it, and a ray BD inside it."""

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
TEMPLATE = HTML_DIR / "templates" / "angle_types.html"
DEFAULT_OUTPUT = HTML_DIR.parent / "output" / "angle_types.html"
FORMULA = HTML_DIR.parent.parent / "core" / "formula.py"  # the Geometry track's mathematics, one section per neuron

# fmt comes from the shared browser module, so it loads first.
MATH_SCRIPTS = (FMT_SCRIPT, STATIC / "angle_types_math.js")
BUNDLE = WIDGET.extend(css=[STATIC / "angle_types.css"], js=[*MATH_SCRIPTS, FIGURE_SCRIPT, STATIC / "angle_types.js"])
# The "View the code" popup shows only the concept: the G.2 section of core/formula.py.
MATH = (
    "is_acute_angle", "is_right_angle", "is_obtuse_angle", "is_straight_angle", "is_reflex_angle", "is_full_turn",
    "degrees_to_radians", "reflex_angle", "angle_addition", "angle_bisector",
)
# The animation's toggles, in the gear menu in the corner of the stage.
SHOW = (("labels", "Labels"), ("ray", "Ray BD"), ("bisector", "Bisector"), ("outside", "Angle outside"), ("guides", "90° and 180° guides"), ("grid", "Grid", False))
CODE = (CodeFile(FORMULA, "Angle measure and types in Python: each type is a range of θ; radians are θ × π / 180.", only=MATH),)


def build_angle_types_html(
    theta: float = 130,
    d: float = 50,
    output_path: str | Path | None = DEFAULT_OUTPUT,
    *,
    theme: str | Theme | None = None,
    title: str = "Angles: Measure & Types",
) -> Path | str:
    """Build the page with ∠ABC = theta and ∠ABD = d preloaded; ``output_path=None`` returns the HTML."""
    config = {"initial": {"theta": theta, "d": d}, "solution": solve(theta, d).to_dict(), "roles": ROLES}
    document = render_page(TEMPLATE, title=title, config=config, theme=theme, bundle=BUNDLE, code=CODE, show=SHOW)
    return document if output_path is None else write_page(document, output_path)
