"""The Pythagorean theorem: the hypotenuse from two legs, and any three sides classified as acute, right or obtuse.

The mathematics lives in core/formula.py (section G.3 Pythagorean Theorem):
pythagorean_theorem, c = √(a² + b²), and is_acute_triangle / is_obtuse_triangle,
which compare c² with a² + b² for c the longest side. This module calls those
and adds what the page needs around them: the squares as numbers, the sides
relabelled so c is the longest, where to draw the triangle's corners, and each
step written out with the numbers. The JavaScript mirror
(html/static/pythagorean_math.js) is kept identical by tests/test_js_parity.py.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass

from core import formula
from shared.fmt import clean, fmt

KINDS = {
    "right": "right: the angle opposite c is exactly 90°",
    "acute": "acute: the angle opposite c, and so every angle, is less than 90°",
    "obtuse": "obtuse: the angle opposite c is more than 90°",
    "none": "no triangle: sides a and b cannot meet across c",
}


def longest_last(a: float, b: float, c: float) -> tuple[float, float, float]:
    """The sides with the longest as c, as the G.3 formulas expect; a and b keep their order otherwise."""
    if c >= a and c >= b:
        return a, b, c
    return (c, b, a) if a >= b else (a, c, b)


def corner_cosine(a: float, b: float, c: float) -> float:
    """cos of the angle between sides a and b (opposite c). Page plumbing for the drawing, not part of the G.3 card.

    By the law of cosines it is (a² + b² − c²) / 2ab: 0 for a right angle, and
    outside −1 … 1 when the three lengths cannot close into a triangle.
    """
    return clean((a * a + b * b - c * c) / (2 * a * b))


def vertices(a: float, b: float, cosine: float) -> dict | None:
    """Corners to draw: C at the origin, CB = a along the x-axis, CA = b at the angle with this cosine.

    None when the lengths do not close (|cos| ≥ 1).
    """
    if not -1 < cosine < 1:
        return None
    sine = (1 - cosine * cosine) ** 0.5
    return {"C": [0.0, 0.0], "B": [clean(a), 0.0], "A": [clean(b * cosine), clean(b * sine)]}


def is_triple(a: float, b: float, c: float) -> bool:
    """Three whole numbers with a² + b² = c²."""
    return all(float(s).is_integer() and s > 0 for s in (a, b, c))


def legs_steps(a: float, b: float, c: float, squares: dict, triple: bool) -> list[dict]:
    """a² + b² = c² from the legs, with these numbers in it."""
    a2, b2, c2 = (fmt(squares[k]) for k in "abc")
    hypotenuse = f"c = √{c2} = {fmt(c)}"
    if triple:
        hypotenuse += f": {fmt(a)}, {fmt(b)}, {fmt(c)} are whole numbers, a Pythagorean triple"
    return [
        {"id": "legs", "title": "The legs: a and b meet at the right angle", "math": f"a = {fmt(a)}, b = {fmt(b)}"},
        {"id": "squares", "title": "Square each leg", "math": f"a² = {fmt(a)}² = {a2}, b² = {fmt(b)}² = {b2}"},
        {"id": "sum", "title": "Pythagorean theorem: a² + b² = c²", "math": f"c² = {a2} + {b2} = {c2}: the square on the hypotenuse has the area of the other two together"},
        {"id": "hypotenuse", "title": "The hypotenuse: c = √(a² + b²)", "math": hypotenuse},
    ]


def sides_steps(sides: dict, squares: dict, total: float, sign: str, kind: str, relabelled: bool) -> list[dict]:
    """c² against a² + b² for three sides, with these numbers in it."""
    a, b, c = (fmt(sides[k]) for k in "abc")
    a2, b2, c2 = (fmt(squares[k]) for k in "abc")
    order = f"a = {a}, b = {b}, c = {c}"
    if relabelled:
        order += ", relabelled so that c is the longest"
    return [
        {"id": "sides", "title": "The three sides, c the longest", "math": order},
        {"id": "squares", "title": "Square each side", "math": f"a² = {a2}, b² = {b2}, c² = {c2}"},
        {"id": "compare", "title": "Compare c² with a² + b²", "math": f"c² = {c2} {sign} a² + b² = {a2} + {b2} = {fmt(total)}"},
        {"id": "kind", "title": "Classify: c² < a² + b² acute, c² > a² + b² obtuse", "math": f"c² {sign} a² + b²: {KINDS[kind]}"},
    ]


@dataclass(frozen=True)
class PythagoreanSolution:
    """Everything the page needs, computed once."""

    mode: str
    inputs: dict
    sides: dict
    relabelled: bool
    squares: dict
    sum: float
    sign: str
    kind: str
    vertices: dict | None
    triple: bool
    texts: dict
    verdict: str
    steps: list

    def to_dict(self) -> dict:
        return asdict(self)


def solve(a: float, b: float) -> PythagoreanSolution:
    """Legs a and b of a right triangle: the hypotenuse c = √(a² + b²), with the steps."""
    c_exact = formula.pythagorean_theorem(a, b)
    c = clean(c_exact)
    squares = {"a": clean(a * a), "b": clean(b * b), "c": clean(c_exact * c_exact)}
    total = clean(a * a + b * b)
    triple = is_triple(a, b, c)
    return PythagoreanSolution(
        mode="legs",
        inputs={"a": a, "b": b},
        sides={"a": a, "b": b, "c": c},
        relabelled=False,
        squares=squares,
        sum=total,
        sign="=",
        kind="right",
        vertices=vertices(a, b, 0.0),  # the right angle at C
        triple=triple,
        texts={"a": fmt(a), "b": fmt(b), "c": fmt(c), "a2": fmt(squares["a"]), "b2": fmt(squares["b"]), "c2": fmt(squares["c"]), "sum": fmt(total)},
        verdict=f"c = √({fmt(a)}² + {fmt(b)}²) = {fmt(c)}" + (": a Pythagorean triple" if triple else ""),
        steps=legs_steps(a, b, c, squares, triple),
    )


def classify(a: float, b: float, c: float) -> PythagoreanSolution:
    """Any three sides: acute, right or obtuse by c² against a² + b² (c the longest), with the steps."""
    x, y, z = longest_last(a, b, c)
    acute = formula.is_acute_triangle(x, y, z)
    obtuse = formula.is_obtuse_triangle(x, y, z)
    sign = "<" if acute else ">" if obtuse else "="
    corners = vertices(x, y, corner_cosine(x, y, z)) if min(x, y, z) > 0 else None
    kind = "none" if corners is None else "acute" if acute else "obtuse" if obtuse else "right"
    sides = {"a": x, "b": y, "c": z}
    squares = {"a": clean(x * x), "b": clean(y * y), "c": clean(z * z)}
    total = clean(x * x + y * y)
    return PythagoreanSolution(
        mode="sides",
        inputs={"a": a, "b": b, "c": c},
        sides=sides,
        relabelled=(x, y, z) != (a, b, c),
        squares=squares,
        sum=total,
        sign=sign,
        kind=kind,
        vertices=corners,
        triple=kind == "right" and is_triple(x, y, z),
        texts={"a": fmt(x), "b": fmt(y), "c": fmt(z), "a2": fmt(squares["a"]), "b2": fmt(squares["b"]), "c2": fmt(squares["c"]), "sum": fmt(total)},
        verdict=KINDS[kind],
        steps=sides_steps(sides, squares, total, sign, kind, (x, y, z) != (a, b, c)),
    )
