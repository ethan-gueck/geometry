"""What this topic publishes to the static API (see general/api).

Frontend usage once deployed:
    PP.call("triangle_types/triangle_types", "solve", 5, 5, 6)
    PP.embed("#el", "triangle_types/triangle_types", { a: 5, b: 5, c: 6 })
"""

from core import formula
from general.api import JSModule, Page, Topic

from . import solver
from .html.triangle_types_page import MATH_SCRIPTS, build_triangle_types_html


def _build_page(output_path, theme=None):
    return build_triangle_types_html(5, 5, 6, output_path, theme=theme)


TOPIC = Topic(
    title="Classifying Triangles",
    description="Triangles by their sides (equilateral, isosceles, scalene) and by their largest angle (acute, right, obtuse); the larger side faces the larger angle.",
    cards=("G.4",),  # flashcard: Classifying Triangles
    modules=(
        JSModule(
            name="triangle_types",
            global_name="TriangleTypeMath",
            scripts=MATH_SCRIPTS,
            functions={
                "solve": solver.solve,
                "closes": solver.closes,
                "angles_from_sides": solver.angles_from_sides,
                "is_equilateral": formula.is_equilateral,
                "is_isosceles": formula.is_isosceles,
                "is_scalene": formula.is_scalene,
                "classify_triangle_by_sides": formula.classify_triangle_by_sides,
                "classify_triangle_by_angles": formula.classify_triangle_by_angles,
                "isosceles_base_angle": formula.isosceles_base_angle,
                "angles_smallest_to_largest": formula.angles_smallest_to_largest,
                "equilateral_triangle_area": formula.equilateral_triangle_area,
            },
        ),
    ),
    pages=(
        Page(
            name="triangle_types",
            title="Classifying Triangles",
            description="Interactive walkthrough of three sides: equal sides tick-marked and equal angles arc-marked, the type by sides and by angles, and the angles in the order of their sides.",
            build=_build_page,
            params=("a", "b", "c"),
            example={"a": 5, "b": 5, "c": 6},
        ),
    ),
)
