"""Interactive page: four points, the segments, rays and lines through them, and where two lines meet."""

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
TEMPLATE = HTML_DIR / "templates" / "points_lines.html"
DEFAULT_OUTPUT = HTML_DIR.parent / "output" / "points_lines.html"
FORMULA = HTML_DIR.parent.parent / "core" / "formula.py"  # the Geometry track's mathematics, one section per neuron
KEYS = ("ax", "ay", "bx", "by", "cx", "cy", "dx", "dy")
DEFAULT = (-3, -1, 1, 1, 5, 3, -2, 4)

# fmt comes from the shared browser module, so it loads first.
MATH_SCRIPTS = (FMT_SCRIPT, STATIC / "points_lines_math.js")
BUNDLE = WIDGET.extend(css=[STATIC / "points_lines.css"], js=[*MATH_SCRIPTS, FIGURE_SCRIPT, STATIC / "points_lines.js"])
# The "View the code" popup shows only the concept: the G.1 section of core/formula.py.
MATH = ("segment_length", "segment_addition", "are_collinear", "is_between", "determine_one_plane", "line_intersection")
# The animation's toggles, in the gear menu in the corner of the stage.
SHOW = (("labels", "Labels"), ("ray", "Ray AB"), ("line", "Line AB"), ("path", "Path A → B → C"), ("cd", "Line CD"), ("grid", "Grid"))
CODE = (CodeFile(FORMULA, "Points and lines in Python: segment length, segment addition, collinearity and where two lines meet.", only=MATH),)


def build_points_lines_html(
    *points: float,
    output_path: str | Path | None = DEFAULT_OUTPUT,
    theme: str | Theme | None = None,
    title: str = "Points, Lines, Rays, Segments & Planes",
) -> Path | str:
    """Build the page with A, B, C, D preloaded (ax, ay, bx, by, cx, cy, dx, dy); ``output_path=None`` returns the HTML."""
    values = points or DEFAULT
    initial = dict(zip(KEYS, values))
    config = {"initial": initial, "solution": solve(*values).to_dict(), "roles": ROLES}
    document = render_page(TEMPLATE, title=title, config=config, theme=theme, bundle=BUNDLE, code=CODE, show=SHOW)
    return document if output_path is None else write_page(document, output_path)
