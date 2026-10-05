"""Two adjacent angles α and β: their total, and whether they are complementary or supplementary, step by step.

The mathematics lives in core/formula.py (section G.1 Angle Relationships):
is_complementary_angle (α + β = 90°) and is_supplementary_angle
(α + β = 180°). This module calls those and adds what the page needs around
them: angles as text, the total α + β to draw, what β would have to be to
complete a corner or a straight line, and each test written out with the
numbers. The JavaScript mirror (html/static/angles_math.js) is kept identical
by tests/test_js_parity.py.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass

from core import formula
from shared.fmt import clean, deg

# What each total looks like: the card's "Complementary makes a Corner; Supplementary makes a Straight line".
SHAPES = {90: "a corner (a right angle)", 180: "a straight line"}


def needed(a: float, total: float) -> float:
    """The β that would bring α up to `total` (90° or 180°). Page plumbing, for the hints: total − α."""
    return clean(total - a)


def hint(a: float, total: float) -> str:
    """What β would complete `total`, or why no positive β can."""
    need = needed(a, total)
    if need > 0:
        return f"β = {total}° − {deg(a)} = {deg(need)} would make {SHAPES[total]}"
    return f"no positive β makes {SHAPES[total]}: α is already {deg(a)}"


def verdict(complementary: bool, supplementary: bool, total: float) -> str:
    """One line on what α and β make together."""
    if complementary:
        return f"complementary: together they make {SHAPES[90]}"
    if supplementary:
        return f"supplementary: together they make {SHAPES[180]}"
    return f"neither: {deg(total)} is neither 90° (a corner) nor 180° (a straight line)"


def steps(a: float, b: float, total: float, complementary: bool, supplementary: bool) -> list[dict]:
    """Each relationship on the G.1 card, with these angles in it."""

    def test(holds: bool, target: int, name: str) -> str:
        if holds:
            return f"{deg(a)} + {deg(b)} = {target}°: {name}, the outer rays make {SHAPES[target]}"
        return f"{deg(total)} ≠ {target}°: not {name}; {hint(a, target)}"

    return [
        {"id": "alpha", "title": "The first angle: α", "math": f"α = {deg(a)}, opened from the first ray"},
        {"id": "beta", "title": "The second angle: β, next to α", "math": f"β = {deg(b)}, sharing α's vertex and its second ray"},
        {"id": "total", "title": "Together: α + β", "math": f"α + β = {deg(a)} + {deg(b)} = {deg(total)}"},
        {"id": "complementary", "title": "Complementary: α + β = 90°", "math": test(complementary, 90, "complementary")},
        {"id": "supplementary", "title": "Supplementary: α + β = 180°", "math": test(supplementary, 180, "supplementary")},
    ]


@dataclass(frozen=True)
class AngleSolution:
    """Everything the page needs, computed once."""

    inputs: dict
    total: float
    complementary: bool
    supplementary: bool
    needs: dict
    texts: dict
    verdict: str
    steps: list

    def to_dict(self) -> dict:
        return asdict(self)


def solve(a: float, b: float) -> AngleSolution:
    """Adjacent angles α = a and β = b: their total and the two G.1 tests, with the steps."""
    complementary = formula.is_complementary_angle(a, b)
    supplementary = formula.is_supplementary_angle(a, b)
    total = clean(a + b)  # page plumbing: the outer angle to draw and print
    return AngleSolution(
        inputs={"a": a, "b": b},
        total=total,
        complementary=complementary,
        supplementary=supplementary,
        needs={"complementary": needed(a, 90), "supplementary": needed(a, 180)},
        texts={"a": deg(a), "b": deg(b), "total": deg(total), "complementary": hint(a, 90), "supplementary": hint(a, 180)},
        verdict=verdict(complementary, supplementary, total),
        steps=steps(a, b, total, complementary, supplementary),
    )
