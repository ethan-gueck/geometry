"""What this topic publishes to the static API (see general/api).

Frontend usage once deployed:
    PP.call("points_lines/points_lines", "solve", -3, -1, 1, 1, 5, 3, -2, 4)
    PP.embed("#el", "points_lines/points_lines", { ax: -3, ay: -1, bx: 1, by: 1, cx: 5, cy: 3, dx: -2, dy: 4 })
"""

from core import formula
from general.api import JSModule, Page, Topic

from . import solver
from .html.points_lines_page import DEFAULT, KEYS, MATH_SCRIPTS, build_points_lines_html


def _build_page(output_path, theme=None):
    return build_points_lines_html(*DEFAULT, output_path=output_path, theme=theme)


TOPIC = Topic(
    title="Points, Lines, Rays, Segments & Planes",
    description="Four points: the segment, ray and line through A and B, segment addition and collinearity for A, B and C, the plane they determine, and where line AB meets line CD.",
    cards=("G.1",),  # flashcard: Points, Lines, Rays, Segments & Planes
    modules=(
        JSModule(
            name="points_lines",
            global_name="PointsMath",
            scripts=MATH_SCRIPTS,
            functions={
                "solve": solver.solve,
                "segment_length": formula.segment_length,
                "segment_addition": formula.segment_addition,
                "are_collinear": formula.are_collinear,
                "is_between": formula.is_between,
                "determine_one_plane": formula.determine_one_plane,
                "line_intersection": formula.line_intersection,
            },
        ),
    ),
    pages=(
        Page(
            name="points_lines",
            title="Points, Lines, Rays, Segments & Planes",
            description="Interactive walkthrough of segments, rays and lines, segment addition, collinearity, the plane postulate and how two lines meet.",
            build=_build_page,
            params=KEYS,
            example=dict(zip(KEYS, DEFAULT)),
        ),
    ),
)
