import math

import pytest

from core import formula
from triangle_angles.solver import BASE, solve, vertices

TRIANGLES = [(60, 60, 60), (90, 45, 45), (30, 60, 90), (100, 40, 40), (60, 70, 50), (20, 30, 130), (1, 1, 178), (22.5, 67.5, 90)]
NOT_TRIANGLES = [(70, 60, 80), (50, 40, 60), (90, 90, 90), (10, 20, 30), (120, 100, 90), (60, 60, 59.5)]
CASES = TRIANGLES + NOT_TRIANGLES


def test_triangle_angle_sum():
    assert formula.triangle_angle_sum(60, 60, 60) and formula.triangle_angle_sum(30, 60, 90)
    assert not formula.triangle_angle_sum(70, 60, 80)


@pytest.mark.parametrize("a, b, c", TRIANGLES)
def test_vertices_have_the_angles(a, b, c):
    s = solve(a, b, c)
    assert s.is_triangle and s.miss == 0 and s.verdict.startswith("a triangle")
    (ax, ay), (bx, by), (cx, cy) = s.vertices["A"], s.vertices["B"], s.vertices["C"]
    assert (ax, ay, bx, by) == (0, 0, BASE, 0) and cy > 0

    def angle(px, py, qx, qy, rx, ry):
        """The angle at p between the rays to q and r, in degrees."""
        return math.degrees(abs(math.atan2((qx - px) * (ry - py) - (qy - py) * (rx - px), (qx - px) * (rx - px) + (qy - py) * (ry - py))))

    assert angle(ax, ay, bx, by, cx, cy) == pytest.approx(a, abs=1e-6)
    assert angle(bx, by, cx, cy, ax, ay) == pytest.approx(b, abs=1e-6)
    assert angle(cx, cy, ax, ay, bx, by) == pytest.approx(c, abs=1e-6)


@pytest.mark.parametrize("a, b, c", NOT_TRIANGLES)
def test_no_triangle_when_the_sum_misses(a, b, c):
    s = solve(a, b, c)
    assert not s.is_triangle and s.vertices is None
    assert s.miss == pytest.approx(180 - (a + b + c)) and s.verdict.startswith("no triangle")


def test_angles_that_are_not_positive_draw_nothing():
    assert vertices(0, 90, 90) is None and solve(-10, 100, 90).vertices is None
    assert "more than 0°" in solve(0, 90, 90).verdict


def test_steps():
    steps = [step["math"] for step in solve(60, 70, 50).steps]
    assert steps[0] == "A = 60°, B = 70°, C = 50°"
    assert steps[1] == "60° + 70° + 50° = 180°"
    assert steps[2] == "180° = 180°: these angles make a triangle"
    assert steps[3].endswith("the three fill a straight line: 60° + 70° + 50° = 180°")
    short = [step["math"] for step in solve(50, 40, 60).steps]
    assert short[2] == "150° ≠ 180°: 30° short of 180°, so no triangle has these angles"
    assert short[3].endswith("so they leave a gap in the straight line")
    assert solve(70, 60, 80).steps[2]["math"] == "210° ≠ 180°: 30° over 180°, so no triangle has these angles"
