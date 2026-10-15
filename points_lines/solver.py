"""Four points A, B, C, D: segments, rays and lines through them, collinearity, and where two lines meet.

The mathematics lives in core/formula.py (section G.1 Points, Lines, Rays, Segments & Planes):
segment_length, segment_addition, are_collinear, is_between, determine_one_plane and
line_intersection. This module calls those and adds what the page needs around them: input
checks, the slopes to compare, each postulate written out with the numbers, and the box the
figure has to show. The JavaScript mirror (html/static/points_lines_math.js) is kept identical by
tests/test_js_parity.py.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass

from core import formula
from shared.fmt import clean, fmt


def validate(ax: float, ay: float, bx: float, by: float, cx: float, cy: float, dx: float, dy: float) -> None:
    if ax == bx and ay == by:
        raise ValueError("A and B are the same point; a line needs two different points.")
    if cx == dx and cy == dy:
        raise ValueError("C and D are the same point; a line needs two different points.")


def point(x: float, y: float) -> str:
    return f"({fmt(x)}, {fmt(y)})"


def slope(x1: float, y1: float, x2: float, y2: float) -> float | None:
    """Rise over run between two points, or None when the run is 0 (a vertical line). Page plumbing."""
    if clean(x2 - x1) == 0:
        return None
    return clean((y2 - y1) / (x2 - x1))


def slope_text(m: float | None) -> str:
    return "undefined (vertical)" if m is None else fmt(m)


def steps(ab: float, bc: float, ac: float, collinear: bool, between: bool, m_ab, m_bc, kind: str, meet) -> list[dict]:
    """Each formula on the G.1 card, with these points in it."""
    total = clean(formula.segment_addition(ab, bc))
    if between:
        addition = f"AB + BC = {fmt(ab)} + {fmt(bc)} = {fmt(total)} = AC: B is between A and C"
    elif collinear:
        addition = f"AB + BC = {fmt(total)} ≠ AC = {fmt(ac)}: B is on line AC but outside segment AC"
    else:
        addition = f"AB + BC = {fmt(total)} > AC = {fmt(ac)}: B is off the segment, so the path through B is {fmt(total - ac)} longer"
    if m_ab is None and m_bc is None:
        same = "both undefined: A, B and C share one x, so they are collinear"
    else:
        same = f"m_AB = {slope_text(m_ab)}, m_BC = {slope_text(m_bc)}: " + ("equal, so A, B and C are collinear" if collinear else "different, so they are not collinear")
    plane = ("A, B and C are not on one line, so they determine exactly one plane" if not collinear
             else "A, B and C are on one line, so many planes contain them (any plane through that line)")
    if kind == "point":
        crossing = f"lines AB and CD meet in exactly one point, {point(*meet)}"
    elif kind == "parallel":
        crossing = "lines AB and CD are parallel: same slope, different lines, so they never meet"
    else:
        crossing = "lines AB and CD are the same line: they meet everywhere"
    return [
        {"id": "segment", "title": "Segment, ray and line through A and B", "math": f"AB = {fmt(ab)}: the segment stops at A and B, the ray starts at A, the line runs both ways"},
        {"id": "addition", "title": "Segment addition: AB + BC = AC when B is between", "math": addition},
        {"id": "collinear", "title": "Collinearity: m_AB = m_BC", "math": same},
        {"id": "plane", "title": "Plane postulate: three noncollinear points", "math": plane},
        {"id": "intersection", "title": "Two lines meet once, never, or everywhere", "math": crossing},
    ]


@dataclass(frozen=True)
class PointsSolution:
    """Everything the page needs, computed once."""

    inputs: dict
    ab: float
    bc: float
    ac: float
    cd: float
    collinear: bool
    between: bool
    plane: bool
    slopes: dict
    intersection: dict
    bounds: list
    steps: list

    def to_dict(self) -> dict:
        return asdict(self)


def solve(ax: float, ay: float, bx: float, by: float, cx: float, cy: float, dx: float, dy: float) -> PointsSolution:
    """The G.1 tests on A, B and C, and where line AB meets line CD."""
    validate(ax, ay, bx, by, cx, cy, dx, dy)
    ab = clean(formula.segment_length(ax, ay, bx, by))
    bc = clean(formula.segment_length(bx, by, cx, cy))
    ac = clean(formula.segment_length(ax, ay, cx, cy))
    cd = clean(formula.segment_length(cx, cy, dx, dy))
    collinear = formula.are_collinear(ax, ay, bx, by, cx, cy)
    between = formula.is_between(ax, ay, bx, by, cx, cy)
    plane = formula.determine_one_plane(ax, ay, bx, by, cx, cy)
    m_ab, m_bc = slope(ax, ay, bx, by), slope(bx, by, cx, cy)
    kind, meet = formula.line_intersection(ax, ay, bx, by, cx, cy, dx, dy)
    meet = None if meet is None else [clean(meet[0]), clean(meet[1])]
    xs, ys = [ax, bx, cx, dx], [ay, by, cy, dy]
    if meet is not None and abs(meet[0]) <= 50 and abs(meet[1]) <= 50:  # page plumbing: keep a nearby crossing in view
        xs.append(meet[0])
        ys.append(meet[1])
    return PointsSolution(
        inputs={"ax": ax, "ay": ay, "bx": bx, "by": by, "cx": cx, "cy": cy, "dx": dx, "dy": dy},
        ab=ab, bc=bc, ac=ac, cd=cd,
        collinear=collinear,
        between=between,
        plane=plane,
        slopes={"ab": m_ab, "bc": m_bc},
        intersection={"kind": kind, "point": meet},
        bounds=[min(xs), max(xs), min(ys), max(ys)],
        steps=steps(ab, bc, ac, collinear, between, m_ab, m_bc, kind, meet),
    )
