"""What this topic publishes to the static API (see general/api).

Frontend usage once deployed:
    PP.call("angles/angles", "solve", 30, 60)
    PP.embed("#el", "angles/angles", { a: 30, b: 60 })
"""

from core import formula
from general.api import JSModule, Page, Topic

from . import solver
from .html.angles_page import MATH_SCRIPTS, build_angles_html


def _build_page(output_path, theme=None):
    return build_angles_html(30, 60, output_path, theme=theme)


TOPIC = Topic(
    title="Angle Relationships",
    description="Two adjacent angles α and β: complementary when α + β = 90° (a corner), supplementary when α + β = 180° (a straight line).",
    cards=("G.1",),  # flashcard: Angle Relationships
    modules=(
        JSModule(
            name="angles",
            global_name="AngleMath",
            scripts=MATH_SCRIPTS,
            functions={
                "solve": solver.solve,
                "hint": solver.hint,
                "is_complementary_angle": formula.is_complementary_angle,
                "is_supplementary_angle": formula.is_supplementary_angle,
            },
        ),
    ),
    pages=(
        Page(
            name="angles",
            title="Angle Relationships",
            description="Interactive walkthrough of complementary and supplementary angles: α and β side by side, making a corner or a straight line.",
            build=_build_page,
            params=("a", "b"),
            example={"a": 30, "b": 60},
        ),
    ),
)
