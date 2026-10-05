"""What this topic publishes to the static API (see general/api).

Frontend usage once deployed:
    PP.call("pythagorean/pythagorean", "solve", 3, 4)
    PP.call("pythagorean/pythagorean", "classify", 5, 6, 7)
    PP.embed("#el", "pythagorean/pythagorean", { a: 3, b: 4 })          // legs: c = √(a² + b²)
    PP.embed("#el", "pythagorean/pythagorean", { a: 4, b: 5, c: 8 })    // any three sides
"""

from core import formula
from general.api import JSModule, Page, Topic

from . import solver
from .html.pythagorean_page import MATH_SCRIPTS, build_pythagorean_html


def _build_page(output_path, theme=None):
    return build_pythagorean_html(3, 4, None, output_path, theme=theme)


TOPIC = Topic(
    title="Pythagorean Theorem",
    description="a² + b² = c²: the squares on a right triangle's legs add up to the square on its hypotenuse, and c² against a² + b² tells acute from obtuse.",
    cards=("G.3",),  # flashcard: Pythagorean Theorem
    modules=(
        JSModule(
            name="pythagorean",
            global_name="PythagorasMath",
            scripts=MATH_SCRIPTS,
            functions={
                "solve": solver.solve,
                "classify": solver.classify,
                "pythagorean_theorem": formula.pythagorean_theorem,
                "is_acute_triangle": formula.is_acute_triangle,
                "is_obtuse_triangle": formula.is_obtuse_triangle,
            },
        ),
    ),
    pages=(
        Page(
            name="pythagorean",
            title="Pythagorean Theorem",
            description="Interactive walkthrough of a² + b² = c² with the squares on each side, and a test of any three sides: acute, right or obtuse.",
            build=_build_page,
            params=("a", "b", "c"),
            example={"a": 3, "b": 4},
        ),
    ),
)
