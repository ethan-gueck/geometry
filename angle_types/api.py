"""What this topic publishes to the static API (see general/api).

Frontend usage once deployed:
    PP.call("angle_types/angle_types", "solve", 130, 50)
    PP.embed("#el", "angle_types/angle_types", { theta: 130, d: 50 })
"""

from core import formula
from general.api import JSModule, Page, Topic

from . import solver
from .html.angle_types_page import MATH_SCRIPTS, build_angle_types_html


def _build_page(output_path, theme=None):
    return build_angle_types_html(130, 50, output_path, theme=theme)


TOPIC = Topic(
    title="Angles: Measure & Types",
    description="One angle ∠ABC: acute, right, obtuse, straight, reflex or a full turn; its measure in degrees and radians; the angle outside it; and a ray BD inside it that adds up (angle addition) or bisects it.",
    cards=("G.2",),  # flashcard: Angles: Measure & Types
    modules=(
        JSModule(
            name="angle_types",
            global_name="AngleTypeMath",
            scripts=MATH_SCRIPTS,
            functions={
                "solve": solver.solve,
                "classify": solver.classify,
                "is_acute_angle": formula.is_acute_angle,
                "is_right_angle": formula.is_right_angle,
                "is_obtuse_angle": formula.is_obtuse_angle,
                "is_straight_angle": formula.is_straight_angle,
                "is_reflex_angle": formula.is_reflex_angle,
                "is_full_turn": formula.is_full_turn,
                "degrees_to_radians": formula.degrees_to_radians,
                "reflex_angle": formula.reflex_angle,
                "angle_addition": formula.angle_addition,
                "angle_bisector": formula.angle_bisector,
            },
        ),
    ),
    pages=(
        Page(
            name="angle_types",
            title="Angles: Measure & Types",
            description="Interactive walkthrough of an angle's type and measure, the angle outside it, angle addition and the bisector.",
            build=_build_page,
            params=("theta", "d"),
            example={"theta": 130, "d": 50},
        ),
    ),
)
