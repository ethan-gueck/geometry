"""Three sides a, b and c: is it a triangle, and which kind, by its sides and by its angles? Step by step.

The mathematics lives in core/formula.py (section G.4 Classifying Triangles):
is_equilateral, is_isosceles, is_scalene and classify_triangle_by_sides count
the equal sides; classify_triangle_by_angles reads the largest angle;
isosceles_base_angle shares what the apex leaves of 180°;
angles_smallest_to_largest orders the angles by their opposite sides; and
equilateral_triangle_area is (√3 / 4) s². This module calls those and adds what
the page needs around them, all page plumbing rather than the G.4 card: the
triangle inequality check, the angles from the sides by the law of cosines,
where to draw the corners, how many tick marks and arcs each side and angle
gets, and each step written out with the numbers. The JavaScript mirror
(html/static/triangle_types_math.js) is kept identical by tests/test_js_parity.py.
"""

from __future__ import annotations

import math
from dataclasses import asdict, dataclass

from core import formula
from shared.fmt import clean, deg, fmt

SIDES = ("a", "b", "c")
PAIRS = (("a", "b"), ("b", "c"), ("a", "c"))  # the side pairs, in the order an isosceles pair is looked for

BY_SIDES = {
    "equilateral": "all three sides equal",
    "isosceles": "two equal sides, the legs",
    "scalene": "no two sides equal",
}
BY_ANGLES = {
    "acute": "the largest angle is under 90°, so all three are",
    "right": "the largest angle is exactly 90°",
    "obtuse": "the largest angle is over 90°",
}


def closes(a: float, b: float, c: float) -> bool:
    """Triangle inequality: every side positive and shorter than the other two together.

    Page plumbing for validating the inputs (the inequality itself is on the G.5 card).
    """
    return min(a, b, c) > 0 and a < b + c and b < a + c and c < a + b


def angles_from_sides(a: float, b: float, c: float) -> dict:
    """A, B and C in degrees, each from its opposite side by the law of cosines, e.g. cos A = (b² + c² − a²) / 2bc.

    Page plumbing, not part of the G.4 card: the classification needs the angles,
    and the user sets only the sides. The cosine is held to −1 … 1 against float noise.
    """

    def corner(opposite: float, x: float, y: float) -> float:
        cosine = max(-1.0, min(1.0, (x * x + y * y - opposite * opposite) / (2 * x * y)))
        return clean(math.degrees(math.acos(cosine)))

    return {"A": corner(a, b, c), "B": corner(b, a, c), "C": corner(c, a, b)}


def vertices(b: float, c: float, angle_a: float) -> dict:
    """Corners to draw: A at the origin, AB = c along the x-axis, C at distance b from A at angle A (page plumbing)."""
    t = math.radians(angle_a)
    return {"A": [0.0, 0.0], "B": [float(c), 0.0], "C": [clean(b * math.cos(t)), clean(b * math.sin(t))]}


def relation(x: float, y: float) -> str:
    """'=' when two lengths (or angles) are equal to float precision, else '<' (x ≤ y is given)."""
    return "=" if math.isclose(x, y) else "<"


def chain(names: list[str], values: dict) -> str:
    """Names in order with = or < between them, e.g. 'a = b < c'."""
    text = names[0]
    for prev, name in zip(names, names[1:]):
        text += f" {relation(values[prev], values[name])} {name}"
    return text


def marks(order: list[str], sides: dict) -> dict:
    """How many tick marks each side gets (and arcs its opposite angle): equal sides share a count, longer sides get more.

    Page plumbing for the drawing: the counts rank the equal-length classes, shortest first.
    """
    counts, rank = {}, 1
    for i, name in enumerate(order):
        if i and not math.isclose(sides[order[i - 1]], sides[name]):
            rank += 1
        counts[name] = rank
    return counts


def isosceles_pair(sides: dict) -> tuple[str, str] | None:
    """The two equal sides of an isosceles triangle, e.g. ('a', 'b'); None if no two are equal."""
    return next((pair for pair in PAIRS if math.isclose(sides[pair[0]], sides[pair[1]])), None)


def triangle_steps(sides: dict, angles: dict, by_sides: str, by_angles: str, order: list[str], apex: str | None, base: float | None, area: float | None) -> list[dict]:
    """The G.4 classification, with these sides and angles in it."""
    s = {k: fmt(v) for k, v in sides.items()}
    t = {k: deg(v) for k, v in angles.items()}
    low = [name.lower() for name in order]  # the sides, shortest first
    shorter = clean(sides[low[0]] + sides[low[1]])
    if by_sides == "equilateral":
        equal = f"a = b = c = {s['a']}: equilateral, {BY_SIDES['equilateral']}"
        angle_step = {
            "id": "equal-angles", "title": "Equilateral: A = B = C = 60°",
            "math": "Three equal sides, so three equal angles, sharing 180°: 180° / 3 = 60° each",
        }
    elif by_sides == "isosceles":
        x, y = (n for n in SIDES if n != apex.lower())
        equal = f"{x} = {y} = {s[x]}, {apex.lower()} = {s[apex.lower()]}: isosceles, {BY_SIDES['isosceles']}"
        angle_step = {
            "id": "equal-angles", "title": f"Base angles theorem: {x} = {y} ⟺ {x.upper()} = {y.upper()}",
            "math": f"{x.upper()} = {y.upper()} = (180° − {apex}) / 2 = (180° − {t[apex]}) / 2 = {deg(base)}",
        }
    else:
        equal = f"a = {s['a']}, b = {s['b']}, c = {s['c']}, all different: scalene, {BY_SIDES['scalene']}"
        angle_step = {
            "id": "equal-angles", "title": "Scalene: no two angles equal",
            "math": f"No two sides equal, so no two angles: A = {t['A']}, B = {t['B']}, C = {t['C']}",
        }
    largest = order[-1]
    measure = t[largest] if by_angles == "right" else f"{t[largest]} {'<' if by_angles == 'acute' else '>'} 90°"
    steps = [
        {"id": "sides", "title": "The three sides: a, b, c opposite angles A, B, C", "math": f"a = {s['a']}, b = {s['b']}, c = {s['c']}"},
        {
            "id": "inequality", "title": "Triangle inequality: the two shorter sides outreach the longest",
            "math": f"{low[0]} + {low[1]} = {s[low[0]]} + {s[low[1]]} = {fmt(shorter)} > {low[2]} = {s[low[2]]}: the sides close into a triangle",
        },
        {"id": "by-sides", "title": "By sides: how many are equal", "math": equal},
        {"id": "angles", "title": "The angles, from the sides by the law of cosines", "math": f"A = {t['A']}, B = {t['B']}, C = {t['C']}: A + B + C = 180°"},
        angle_step,
        {
            "id": "order", "title": "Side–angle order: a > b ⟺ A > B",
            "math": f"{chain(low, sides)}, so {chain(order, angles)}: " + " ".join(
                f"{t[name]} {relation(angles[name], angles[nxt])}" for name, nxt in zip(order, order[1:])) + f" {t[largest]}",
        },
        {"id": "by-angles", "title": "By the largest angle: under, at or over 90°", "math": f"max(A, B, C) = {largest} = {measure}: {by_angles}, {BY_ANGLES[by_angles]}"},
    ]
    if area is not None:
        steps.append({"id": "area", "title": "Equilateral area: (√3 / 4) s²", "math": f"(√3 / 4) × {s['a']}² = {fmt(area)}, half the base s times the height (√3 / 2) s"})
    return steps


def open_steps(sides: dict, order: list[str], gap: float) -> list[dict]:
    """Why three lengths that fail the triangle inequality make no triangle."""
    s = {k: fmt(v) for k, v in sides.items()}
    low = [name.lower() for name in order]
    shorter = clean(sides[low[0]] + sides[low[1]])
    fail = f"{low[0]} + {low[1]} = {s[low[0]]} + {s[low[1]]} = {fmt(shorter)}"
    if gap == 0:
        fail += f" = {low[2]} = {s[low[2]]}: the shorter sides lie flat along the longest, with no room for a corner"
    else:
        fail += f" < {low[2]} = {s[low[2]]}: the shorter sides fall {fmt(gap)} short of reaching across the longest"
    return [
        {"id": "sides", "title": "The three sides: a, b, c opposite angles A, B, C", "math": f"a = {s['a']}, b = {s['b']}, c = {s['c']}"},
        {"id": "inequality", "title": "Triangle inequality: the two shorter sides outreach the longest", "math": fail},
        {"id": "by-sides", "title": "Nothing to classify", "math": f"No triangle, so no type by sides or by angles: lengthen {low[0]} or {low[1]}, or shorten {low[2]}"},
    ]


@dataclass(frozen=True)
class TriangleTypeSolution:
    """Everything the page needs, computed once."""

    inputs: dict
    is_triangle: bool
    gap: float
    angles: dict | None
    vertices: dict | None
    equilateral: bool
    isosceles: bool
    scalene: bool
    by_sides: str | None
    by_angles: str | None
    order: list
    marks: dict
    apex: str | None
    base_angle: float | None
    area: float | None
    texts: dict
    verdict: str
    steps: list

    def to_dict(self) -> dict:
        return asdict(self)


def solve(a: float, b: float, c: float) -> TriangleTypeSolution:
    """Sides a, b, c: the triangle inequality, then the G.4 types by sides and by angles, the angle order and the steps."""
    sides = {"a": a, "b": b, "c": c}
    order = formula.angles_smallest_to_largest(a, b, c)  # angle names, smallest first; their opposite sides sort the same way
    low = [name.lower() for name in order]
    gap = clean(max(sides[low[2]] - sides[low[0]] - sides[low[1]], 0))  # page plumbing: how far the shorter sides miss
    texts = {k: fmt(v) for k, v in sides.items()}
    texts["sides"] = chain(low, sides)
    if not closes(a, b, c):
        texts["gap"] = fmt(gap)
        return TriangleTypeSolution(
            inputs=sides, is_triangle=False, gap=gap, angles=None, vertices=None,
            equilateral=False, isosceles=False, scalene=False, by_sides=None, by_angles=None,
            order=order, marks=marks(low, sides), apex=None, base_angle=None, area=None, texts=texts,
            verdict=f"no triangle: {low[0]} + {low[1]} = {fmt(clean(sides[low[0]] + sides[low[1]]))} does not exceed {low[2]} = {texts[low[2]]}",
            steps=open_steps(sides, order, gap),
        )
    angles = angles_from_sides(a, b, c)
    by_sides = formula.classify_triangle_by_sides(a, b, c)
    by_angles = formula.classify_triangle_by_angles(angles["A"], angles["B"], angles["C"])
    pair = isosceles_pair(sides) if by_sides == "isosceles" else None
    apex = next(n for n in SIDES if n not in pair).upper() if pair else None  # the angle between the equal legs
    base = clean(formula.isosceles_base_angle(angles[apex])) if apex else None
    area = clean(formula.equilateral_triangle_area(a)) if by_sides == "equilateral" else None
    texts.update({k: deg(v) for k, v in angles.items()})
    texts["angles"] = chain(order, angles)
    if base is not None:
        texts["base"] = deg(base)
    if area is not None:
        texts["area"] = fmt(area)
    return TriangleTypeSolution(
        inputs=sides,
        is_triangle=True,
        gap=gap,
        angles=angles,
        vertices=vertices(b, c, angles["A"]),
        equilateral=formula.is_equilateral(a, b, c),
        isosceles=formula.is_isosceles(a, b, c),
        scalene=formula.is_scalene(a, b, c),
        by_sides=by_sides,
        by_angles=by_angles,
        order=order,
        marks=marks(low, sides),
        apex=apex,
        base_angle=base,
        area=area,
        texts=texts,
        verdict=f"{'a' if by_angles == 'right' else 'an'} {by_angles} {by_sides} triangle",
        steps=triangle_steps(sides, angles, by_sides, by_angles, order, apex, base, area),
    )
