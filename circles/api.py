"""What this topic publishes to the static API (see general/api).

Frontend usage once deployed:
    PP.call("circles/circles", "solve", 3, 60)      // r = 3, θ = 60°: C, A, s and A_sector
    PP.embed("#el", "circles/circles", { r: 3, degrees: 60 })
"""

from core import formula
from general.api import JSModule, Page, Topic

from . import solver
from .html.circles_page import MATH_SCRIPTS, build_circles_html


def _build_page(output_path, theme=None):
    return build_circles_html(3, 60, output_path, theme=theme)


TOPIC = Topic(
    title="Circles: Circumference, Area, Arcs & Sectors",
    description="C = 2πr and A = πr², and for a central angle θ in radians the arc s = rθ and the sector ½r²θ: the same share θ / 2π of the circle.",
    cards=("G.9",),  # flashcard: Circles: Circumference, Area, Arcs & Sectors
    modules=(
        JSModule(
            name="circles",
            global_name="CircleMath",
            scripts=MATH_SCRIPTS,
            functions={
                "solve": solver.solve,
                "circumference_of_a_circle": formula.circumference_of_a_circle,
                "area_of_a_circle": formula.area_of_a_circle,
                "arc_length": formula.arc_length,
                "sector_of_a_circle": formula.sector_of_a_circle,
            },
        ),
    ),
    pages=(
        Page(
            name="circles",
            title="Circles: Circumference, Area, Arcs & Sectors",
            description="Interactive circle: trace its circumference, fill its area, then cut a sector with a central angle and measure its arc.",
            build=_build_page,
            params=("r", "degrees"),
            example={"r": 3, "degrees": 60},
        ),
    ),
)
