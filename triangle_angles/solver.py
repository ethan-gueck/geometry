"""Three angles A, B and C: do they add up to 180°, and so make a triangle? Step by step.

The mathematics lives in core/formula.py (section G.2 Triangle Angle Sum &
Triangle Inequality): triangle_angle_sum, A + B + C = 180°. This module calls
it and adds what the page needs around it: angles as text, the total and how
far it misses 180°, where to draw the triangle's corners, and the check
written out with the numbers. The card's exterior-angle and triangle-inequality
parts join the page once they are written in formula.py. The JavaScript
mirror (html/static/triangle_angles_math.js) is kept identical by
tests/test_js_parity.py.
"""

from __future__ import annotations

import math
from dataclasses import asdict, dataclass

from core import formula
from shared.fmt import clean, deg

BASE = 6  # length of the drawn side AB, in figure units


def vertices(a: float, b: float, c: float) -> dict | None:
    """Corners to draw the triangle with angles A, B, C: AB along the x-axis, C above it.

    Page plumbing for the drawing, not part of the G.2 card: the law of sines
    gives side AC = AB · sin B / sin C, and C sits that far from A at angle A.
    None when an angle is not positive, since then there is no triangle to draw.
    """
    if min(a, b, c) <= 0:
        return None
    side = BASE * math.sin(math.radians(b)) / math.sin(math.radians(c))
    apex = [clean(side * math.cos(math.radians(a))), clean(side * math.sin(math.radians(a)))]
    return {"A": [0.0, 0.0], "B": [float(BASE), 0.0], "C": apex}


def verdict(is_triangle: bool, total: float, miss: float, positive: bool) -> str:
    """One line on whether A, B and C can be the angles of a triangle."""
    if is_triangle and positive:
        return "a triangle: the three angles add up to 180°"
    if is_triangle:
        return "no triangle: the angles add up to 180°, but every angle of a triangle is more than 0°"
    return f"no triangle: the angles add up to {deg(total)}, {deg(abs(miss))} {'short of' if miss > 0 else 'over'} 180°"


def steps(a: float, b: float, c: float, total: float, miss: float, is_triangle: bool) -> list[dict]:
    """The angle sum on the G.2 card, with these angles in it."""
    angles = f"{deg(a)} + {deg(b)} + {deg(c)}"
    off = f"{deg(abs(miss))} {'short of' if miss > 0 else 'over'} 180°"
    if is_triangle:
        check = f"{deg(total)} = 180°: these angles make a triangle"
        why = {
            "id": "proof", "title": "Why: a line through C parallel to AB",
            "math": f"A and B reappear at C as alternate interior angles, either side of C itself, and the three fill a straight line: {angles} = 180°",
        }
    else:
        check = f"{deg(total)} ≠ 180°: {off}, so no triangle has these angles"
        why = {
            "id": "proof", "title": "Side by side at one point",
            "math": f"Laid next to each other, A, B and C turn through {deg(total)}: {off}, so they {'leave a gap in' if miss > 0 else 'overlap past'} the straight line",
        }
    return [
        {"id": "angles", "title": "The three angles", "math": f"A = {deg(a)}, B = {deg(b)}, C = {deg(c)}"},
        {"id": "sum", "title": "Add them: A + B + C", "math": f"{angles} = {deg(total)}"},
        {"id": "check", "title": "Triangle angle sum: A + B + C = 180°", "math": check},
        why,
    ]


@dataclass(frozen=True)
class TriangleAngleSolution:
    """Everything the page needs, computed once."""

    inputs: dict
    total: float
    is_triangle: bool
    miss: float
    vertices: dict | None
    texts: dict
    verdict: str
    steps: list

    def to_dict(self) -> dict:
        return asdict(self)


def solve(a: float, b: float, c: float) -> TriangleAngleSolution:
    """Angles A = a, B = b, C = c: the G.2 angle-sum check, the triangle to draw and the steps."""
    is_triangle = formula.triangle_angle_sum(a, b, c)
    total = clean(a + b + c)  # page plumbing: the total to print and lay out
    miss = clean(180 - total)  # how far short of (+) or over (−) a straight angle
    corners = vertices(a, b, c) if is_triangle else None
    return TriangleAngleSolution(
        inputs={"a": a, "b": b, "c": c},
        total=total,
        is_triangle=is_triangle,
        miss=miss,
        vertices=corners,
        texts={"a": deg(a), "b": deg(b), "c": deg(c), "total": deg(total), "miss": deg(abs(miss))},
        verdict=verdict(is_triangle, total, miss, corners is not None),
        steps=steps(a, b, c, total, miss, is_triangle),
    )
