import math

import pytest

from core import formula
from triangle_types.solver import angles_from_sides, chain, closes, marks, solve

TRIANGLES = [(5, 5, 5), (5, 5, 6), (6, 6, 10), (5, 3, 5), (3, 5, 5), (3, 4, 5), (5, 12, 13), (5, 6, 7), (4, 5, 8), (7, 2, 6), (0.5, 0.5, 0.5), (2.5, 6, 6.5)]
NOT_TRIANGLES = [(2, 3, 6), (1, 2, 3), (10, 2, 3), (4, 9, 4), (0, 3, 3)]
CASES = TRIANGLES + NOT_TRIANGLES


def test_classify_by_sides():
    assert formula.classify_triangle_by_sides(5, 5, 5) == "equilateral"
    assert formula.classify_triangle_by_sides(5, 5, 6) == formula.classify_triangle_by_sides(6, 5, 6) == "isosceles"
    assert formula.classify_triangle_by_sides(3, 4, 5) == "scalene"
    assert formula.is_isosceles(5, 5, 5) and not formula.is_scalene(5, 5, 5)  # every equilateral triangle is isosceles


def test_classify_by_angles():
    assert formula.classify_triangle_by_angles(60, 60, 60) == "acute"
    assert formula.classify_triangle_by_angles(30, 60, 90) == "right"
    assert formula.classify_triangle_by_angles(20, 40, 120) == "obtuse"
    assert formula.isosceles_base_angle(40) == 70 and formula.isosceles_base_angle(60) == 60
    assert formula.angles_smallest_to_largest(5, 3, 4) == ["B", "C", "A"]
    assert formula.equilateral_triangle_area(2) == pytest.approx(math.sqrt(3))


@pytest.mark.parametrize("a, b, c", TRIANGLES)
def test_triangles_are_drawn_with_their_sides_and_angles(a, b, c):
    s = solve(a, b, c)
    assert s.is_triangle and closes(a, b, c) and s.gap == 0
    A, B, C = (s.vertices[k] for k in "ABC")
    assert math.dist(B, C) == pytest.approx(a) and math.dist(C, A) == pytest.approx(b) and math.dist(A, B) == pytest.approx(c)
    assert sum(s.angles.values()) == pytest.approx(180)
    # The larger side faces the larger angle, and equal sides mean equal angles.
    for x, y in (("a", "b"), ("b", "c"), ("a", "c")):
        X, Y = x.upper(), y.upper()
        if math.isclose(s.inputs[x], s.inputs[y]):
            assert s.angles[X] == pytest.approx(s.angles[Y]) and s.marks[x] == s.marks[y]
        else:
            assert (s.inputs[x] > s.inputs[y]) == (s.angles[X] > s.angles[Y]) == (s.marks[x] > s.marks[y])


@pytest.mark.parametrize("a, b, c", NOT_TRIANGLES)
def test_no_triangle_when_the_inequality_fails(a, b, c):
    s = solve(a, b, c)
    assert not s.is_triangle and s.vertices is None and s.by_sides is None and s.by_angles is None
    longest = max(a, b, c)
    assert s.gap == pytest.approx(max(longest - (a + b + c - longest), 0)) and s.verdict.startswith("no triangle")


def test_kinds():
    assert (solve(5, 5, 5).by_sides, solve(5, 5, 5).by_angles, solve(5, 5, 5).area) == ("equilateral", "acute", pytest.approx(25 * math.sqrt(3) / 4))
    iso = solve(6, 6, 10)
    assert (iso.by_sides, iso.by_angles, iso.apex) == ("isosceles", "obtuse", "C") and iso.base_angle == pytest.approx(iso.angles["A"])
    assert solve(5, 3, 5).apex == "B" and solve(5, 3, 5).verdict == "an acute isosceles triangle"
    right = solve(3, 4, 5)
    assert right.angles["C"] == 90 and right.by_angles == "right" and right.verdict == "a right scalene triangle"
    assert solve(4, 5, 8).verdict == "an obtuse scalene triangle" and solve(4, 5, 8).area is None


def test_plumbing():
    assert angles_from_sides(1, 1, 1) == {"A": 60, "B": 60, "C": 60}
    assert chain(["b", "a", "c"], {"a": 5, "b": 3, "c": 5}) == "b < a = c"
    assert marks(["b", "a", "c"], {"a": 5, "b": 3, "c": 5}) == {"b": 1, "a": 2, "c": 2}
    assert not closes(1, 2, 3) and not closes(-1, 3, 3) and closes(2, 3, 4)


def test_steps():
    steps = [step["math"] for step in solve(5, 5, 6).steps]
    assert steps[1] == "a + b = 5 + 5 = 10 > c = 6: the sides close into a triangle"
    assert steps[2] == "a = b = 5, c = 6: isosceles, two equal sides, the legs"
    assert steps[4] == "A = B = (180° − C) / 2 = (180° − 73.74°) / 2 = 53.13°"
    assert steps[5] == "a = b < c, so A = B < C: 53.13° = 53.13° < 73.74°"
    assert steps[6].startswith("max(A, B, C) = C = 73.74° < 90°: acute")
    assert solve(3, 4, 5).steps[6]["math"].startswith("max(A, B, C) = C = 90°: right")
    assert solve(5, 5, 5).steps[-1]["math"].startswith("(√3 / 4) × 5² = 10.83")
    assert solve(2, 3, 6).steps[1]["math"] == "a + b = 2 + 3 = 5 < c = 6: the shorter sides fall 1 short of reaching across the longest"
    assert "no room for a corner" in solve(1, 2, 3).steps[1]["math"]
