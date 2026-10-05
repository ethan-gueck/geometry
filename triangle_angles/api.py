"""What this topic publishes to the static API (see general/api).

Frontend usage once deployed:
    PP.call("triangle_angles/triangle_angles", "solve", 60, 70, 50)
    PP.embed("#el", "triangle_angles/triangle_angles", { a: 60, b: 70, c: 50 })
"""

from core import formula
from general.api import JSModule, Page, Topic

from . import solver
from .html.triangle_angles_page import MATH_SCRIPTS, build_triangle_angles_html


def _build_page(output_path, theme=None):
    return build_triangle_angles_html(60, 70, 50, output_path, theme=theme)


TOPIC = Topic(
    title="Triangle Angle Sum",
    description="The three angles of a triangle add up to 180°: A + B + C = 180°, shown with a line through one corner parallel to the opposite side.",
    cards=("G.2",),  # flashcard: Triangle Angle Sum & Triangle Inequality
    modules=(
        JSModule(
            name="triangle_angles",
            global_name="TriangleMath",
            scripts=MATH_SCRIPTS,
            functions={
                "solve": solver.solve,
                "vertices": solver.vertices,
                "triangle_angle_sum": formula.triangle_angle_sum,
            },
        ),
    ),
    pages=(
        Page(
            name="triangle_angles",
            title="Triangle Angle Sum",
            description="Interactive walkthrough of A + B + C = 180°: the triangle the angles make, and why they always fill a straight line.",
            build=_build_page,
            params=("a", "b", "c"),
            example={"a": 60, "b": 70, "c": 50},
        ),
    ),
)
