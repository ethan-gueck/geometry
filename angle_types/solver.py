"""One angle ∠ABC = θ: its type, its measure in radians, the angle outside it, and a ray BD inside it.

The mathematics lives in core/formula.py (section G.2 Angles: Measure & Types): the six type tests
(is_acute_angle … is_full_turn), degrees_to_radians, reflex_angle, angle_addition and
angle_bisector. This module calls those and adds what the page needs around them: input checks,
the type's name, radians as a multiple of π where it is exact, and each formula written out with
the numbers. The JavaScript mirror (html/static/angle_types_math.js) is kept identical by
tests/test_js_parity.py.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass

from core import formula
from shared.fmt import clean, deg, fmt

# Each type with the range the card gives it, in the order of the card.
TYPES = {
    "zero": "a zero angle: the two sides lie on top of each other",
    "acute": "acute: between 0° and 90°, smaller than a right angle",
    "right": "right: exactly 90°, the sides are perpendicular",
    "obtuse": "obtuse: between 90° and 180°, wider than a right angle",
    "straight": "straight: exactly 180°, the sides make a line",
    "reflex": "reflex: between 180° and 360°, more than a straight angle",
    "full": "a full turn: 360°, one revolution",
}


def validate(theta: float, d: float) -> None:
    if not 0 <= theta <= 360:
        raise ValueError("Enter ∠ABC between 0° and 360°.")
    if not 0 <= d <= theta:
        raise ValueError("Ray BD must lie inside ∠ABC: ∠ABD between 0° and ∠ABC.")


def classify(theta: float) -> str:
    """The angle's type, from the six tests on the G.2 card (and 0° for no turn at all)."""
    if formula.is_acute_angle(theta):
        return "acute"
    if formula.is_right_angle(theta):
        return "right"
    if formula.is_obtuse_angle(theta):
        return "obtuse"
    if formula.is_straight_angle(theta):
        return "straight"
    if formula.is_reflex_angle(theta):
        return "reflex"
    if formula.is_full_turn(theta):
        return "full"
    return "zero"


def pi_text(theta: float) -> str:
    """θ in radians as a multiple of π when it is exact with a small denominator (90° -> 'π/2'), else ''."""
    for q in range(1, 37):
        p = theta * q / 180
        if abs(p - round(p)) < 1e-9:
            p = round(p)
            if p == 0:
                return "0"
            top = "π" if p == 1 else f"{p}π"
            return top if q == 1 else f"{top}/{q}"
    return ""


def radians_text(theta: float) -> str:
    """'π/2 ≈ 1.571 rad', or just '2.269 rad' when θ is not a neat fraction of π."""
    rad = formula.degrees_to_radians(theta)
    exact = pi_text(theta)
    if exact in ("", "0"):
        return f"{fmt(rad)} rad"
    return f"{exact} ≈ {fmt(rad)} rad"


def steps(theta: float, d: float, kind: str, outside: float, dbc: float, half: float, bisected: bool) -> list[dict]:
    """Each formula on the G.2 card, with this angle in it."""
    rad = formula.degrees_to_radians(theta)
    exact = pi_text(theta)
    as_pi = f" = {exact}" if exact not in ("", "0") else ""
    return [
        {"id": "type", "title": "Type: compare θ with 90°, 180° and 360°", "math": f"θ = {deg(theta)}: {TYPES[kind]}"},
        {"id": "radians", "title": "Radians: θ × π / 180°", "math": f"{fmt(theta)} × π / 180 = {fmt(rad)} rad{as_pi}"},
        {"id": "outside", "title": "The angle outside: 360° − θ", "math": f"360° − {deg(theta)} = {deg(outside)}"},
        {"id": "addition", "title": "Angle addition: m∠ABD + m∠DBC = m∠ABC",
         "math": f"{deg(d)} + {deg(dbc)} = {deg(formula.angle_addition(d, dbc))}"},
        {"id": "bisector", "title": "Bisector: half of m∠ABC on each side",
         "math": f"½ × {deg(theta)} = {deg(half)}" + (": BD is the bisector" if bisected else f"; BD would bisect ∠ABC at {deg(half)}, not {deg(d)}")},
    ]


@dataclass(frozen=True)
class AngleTypeSolution:
    """Everything the page needs, computed once."""

    inputs: dict
    kind: str
    type_text: str
    radians: float
    radians_text: str
    outside: float
    dbc: float
    bisector: float
    bisected: bool
    texts: dict
    steps: list

    def to_dict(self) -> dict:
        return asdict(self)


def solve(theta: float, d: float) -> AngleTypeSolution:
    """∠ABC = θ with ray BD at ∠ABD = d: the type, radians, outside angle, angle addition and bisector."""
    validate(theta, d)
    kind = classify(theta)
    outside = clean(formula.reflex_angle(theta))
    dbc = clean(theta - d)  # page plumbing: the part of ∠ABC past BD
    half = clean(formula.angle_bisector(theta))
    bisected = clean(d) == half
    return AngleTypeSolution(
        inputs={"theta": theta, "d": d},
        kind=kind,
        type_text=TYPES[kind],
        radians=clean(formula.degrees_to_radians(theta)),
        radians_text=radians_text(theta),
        outside=outside,
        dbc=dbc,
        bisector=half,
        bisected=bisected,
        texts={"theta": deg(theta), "d": deg(d), "dbc": deg(dbc), "outside": deg(outside), "bisector": deg(half)},
        steps=steps(theta, d, kind, outside, dbc, half, bisected),
    )
