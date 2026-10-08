"""Interactive page: two adjacent angles α and β, and whether they make a corner or a straight line."""

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
TEMPLATE = HTML_DIR / "templates" / "angles.html"
DEFAULT_OUTPUT = HTML_DIR.parent / "output" / "angles.html"
FORMULA = HTML_DIR.parent.parent / "core" / "formula.py"  # the Geometry track's mathematics, one section per neuron

# fmt comes from the shared browser module, so it loads first.
MATH_SCRIPTS = (FMT_SCRIPT, STATIC / "angles_math.js")
BUNDLE = WIDGET.extend(css=[STATIC / "angles.css"], js=[*MATH_SCRIPTS, FIGURE_SCRIPT, STATIC / "angles.js"])
# The "View the code" popup shows only the concept: the G.1 section of core/formula.py.
MATH = ("is_complementary_angle", "is_supplementary_angle")
# The animation's toggles, in the gear menu in the corner of the stage.
SHOW = (("labels", "Labels"), ("arcs", "Angle arcs"), ("guides", "90° and 180° guides"), ("grid", "Grid", False))
CODE = (CodeFile(FORMULA, "Angle relationships in Python: complementary angles add to 90°, supplementary angles to 180°.", only=MATH),)


def build_angles_html(
    a: float = 30,
    b: float = 60,
    output_path: str | Path | None = DEFAULT_OUTPUT,
    *,
    theme: str | Theme | None = None,
    title: str = "Angle Relationships",
) -> Path | str:
    """Build the page with α = a and β = b preloaded; ``output_path=None`` returns the HTML."""
    config = {"initial": {"a": a, "b": b}, "solution": solve(a, b).to_dict(), "roles": ROLES}
    document = render_page(TEMPLATE, title=title, config=config, theme=theme, bundle=BUNDLE, code=CODE, show=SHOW)
    return document if output_path is None else write_page(document, output_path)
