"""A circle of radius r and a central angle θ: circumference, area, arc length and sector area.

core/formula.py holds the mathematics as written: G.9 circumference_of_a_circle (C = 2πr),
area_of_a_circle (A = πr²), arc_length (s = rθ) and sector_of_a_circle (A_sector = ½r²θ), the
last two with θ in radians. This module calls those and adds what the page needs around them:
the angle taken in degrees and converted to radians, the diameter, the share of the circle the
angle covers, the steps as text and a check that s / C and A_sector / A both equal θ / 2π.
The JavaScript mirror (html/static/circles_math.js) is kept identical by tests/test_js_parity.py.
"""

from __future__ import annotations

import math
from dataclasses import asdict, dataclass

from core import formula
from shared.fmt import clean, fmt


@dataclass(frozen=True)
class CircleSolution:
    """Everything the page needs, computed once."""

    r: float
    degrees: float
    radians: float
    diameter: float
    circumference: float
    area: float
    arc: float
    sector: float
    share: float
    steps: list

    def to_dict(self) -> dict:
        return asdict(self)


def solve(r: float, degrees: float) -> CircleSolution:
    """Circle of radius r with a central angle of `degrees` (0 to 360): C, A, s and A_sector."""
    if not r > 0:
        raise ValueError("The radius must be greater than 0.")
    if not 0 <= degrees <= 360:
        raise ValueError("The central angle must be between 0° and 360°.")
    theta = math.radians(degrees)  # the arc and sector formulas take radians
    c, a = formula.circumference_of_a_circle(r), formula.area_of_a_circle(r)
    s, sector = formula.arc_length(r, theta), formula.sector_of_a_circle(r, theta)
    share = degrees / 360
    steps = [
        {"id": "radius", "title": "Radius and diameter", "math": f"r = {fmt(r)}, so d = 2r = {fmt(2 * r)}"},
        {"id": "circumference", "title": "Circumference: C = 2πr", "math": f"C = 2π · {fmt(r)} = {fmt(c)}  (also πd = π · {fmt(2 * r)})"},
        {"id": "area", "title": "Area: A = πr²", "math": f"A = π · {fmt(r)}² = π · {fmt(r * r)} = {fmt(a)}"},
        {"id": "angle", "title": "The angle in radians", "math": f"θ = {fmt(degrees)}° × π / 180 = {fmt(theta)} rad"},
        {"id": "arc", "title": "Arc length: s = rθ", "math": f"s = {fmt(r)} · {fmt(theta)} = {fmt(s)}"},
        {"id": "sector", "title": "Sector area: A_sector = ½r²θ", "math": f"A_sector = ½ · {fmt(r)}² · {fmt(theta)} = {fmt(sector)}"},
        {"id": "check", "title": "Check: the same share of the circle", "math": f"s / C = {fmt(s / c)} and A_sector / A = {fmt(sector / a)}: both θ / 2π = {fmt(share)}, {fmt(share * 100)}% of the circle"},
    ]
    return CircleSolution(
        r=r, degrees=degrees, radians=clean(theta), diameter=clean(2 * r), circumference=clean(c), area=clean(a),
        arc=clean(s), sector=clean(sector), share=clean(share), steps=steps,
    )
