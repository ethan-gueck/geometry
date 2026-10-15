import pytest

from core import formula
from points_lines.solver import solve

CASES = [
    (-3, -1, 1, 1, 5, 3, -2, 4), (-3, -1, 3, 2, 1, 1, -2, 4), (-3, -2, 0, 3, 4, 0, -3, 3), (-3, -1, 3, 2, -2, 2, 2, 4),
    (-4, -2, 0, 0, 2, 1, 4, 2), (1, -3, 1, 0, 1, 4, -3, 0), (0, 0, 3, 4, 6, 8, 0, 5), (0.5, 1.5, 2, -0.25, 3.5, -2, 1, 1),
    (2, 2, -1, 2, 5, 2, 0, 0), (0, 0, 1, 0, 1, 1, 2, 1),
]


def test_the_formulas():
    assert formula.segment_length(0, 0, 3, 4) == 5 and formula.segment_addition(2, 3) == 5
    assert formula.are_collinear(0, 0, 1, 1, 3, 3) and not formula.are_collinear(0, 0, 1, 2, 3, 3)
    assert formula.are_collinear(2, 0, 2, 5, 2, -1)  # vertical: all x equal
    assert formula.is_between(0, 0, 1, 1, 3, 3) and not formula.is_between(0, 0, 4, 4, 3, 3)
    assert formula.determine_one_plane(0, 0, 1, 2, 3, 3) and not formula.determine_one_plane(0, 0, 1, 1, 2, 2)
    assert formula.line_intersection(0, 0, 2, 2, 0, 2, 2, 0) == ("point", (1.0, 1.0))
    assert formula.line_intersection(0, 0, 1, 1, 0, 1, 1, 2) == ("parallel", None)
    assert formula.line_intersection(0, 0, 1, 1, 2, 2, 3, 3) == ("same", None)


@pytest.mark.parametrize("points", CASES)
def test_the_solution_is_consistent(points):
    s = solve(*points)
    assert s.plane == (not s.collinear)
    assert not s.between or s.collinear  # between implies on one line
    assert s.between == (abs(s.ab + s.bc - s.ac) < 1e-9)
    if s.intersection["kind"] == "point":
        x, y = s.intersection["point"]
        ax, ay, bx, by, cx, cy, dx, dy = points
        assert formula.are_collinear(ax, ay, bx, by, x, y) and formula.are_collinear(cx, cy, dx, dy, x, y)


def test_steps():
    steps = [step["math"] for step in solve(-3, -2, 0, 3, 4, 0, -3, 3).steps]
    assert steps[2] == "m_AB = 1.667, m_BC = -0.75: different, so they are not collinear"
    assert steps[3] == "A, B and C are not on one line, so they determine exactly one plane"
    assert solve(-3, -1, 1, 1, 5, 3, -2, 4).steps[1]["math"].endswith("= AC: B is between A and C")
    assert solve(-3, -1, 3, 2, 1, 1, -2, 4).steps[1]["math"].endswith("B is on line AC but outside segment AC")
    assert solve(-3, -1, 3, 2, -2, 2, 2, 4).steps[4]["math"].startswith("lines AB and CD are parallel")
    assert solve(1, -3, 1, 0, 1, 4, -3, 0).steps[2]["math"].startswith("both undefined")


def test_two_points_make_a_line():
    with pytest.raises(ValueError):
        solve(1, 1, 1, 1, 0, 0, 2, 2)
    with pytest.raises(ValueError):
        solve(0, 0, 1, 1, 2, 2, 2, 2)
