import pytest

from angles.solver import hint, solve
from core import formula

CASES = [(30, 60), (45, 45), (120, 60), (135, 45), (40, 70), (10, 15), (90, 0), (0, 180), (150, 120), (22.5, 67.5), (100, 80), (12.25, 30.5)]


def test_complementary_and_supplementary():
    assert formula.is_complementary_angle(30, 60) and not formula.is_complementary_angle(30, 70)
    assert formula.is_supplementary_angle(120, 60) and not formula.is_supplementary_angle(45, 45)


@pytest.mark.parametrize("a, b", CASES)
def test_solution_matches_the_formulas(a, b):
    s = solve(a, b)
    assert s.total == pytest.approx(a + b)
    assert s.complementary == formula.is_complementary_angle(a, b)
    assert s.supplementary == formula.is_supplementary_angle(a, b)
    assert s.needs == {"complementary": pytest.approx(90 - a), "supplementary": pytest.approx(180 - a)}
    assert not (s.complementary and s.supplementary)


def test_verdicts():
    assert solve(30, 60).verdict.startswith("complementary: together they make a corner")
    assert solve(120, 60).verdict.startswith("supplementary: together they make a straight line")
    assert solve(40, 70).verdict == "neither: 110° is neither 90° (a corner) nor 180° (a straight line)"


def test_hints():
    assert hint(30, 90) == "β = 90° − 30° = 60° would make a corner (a right angle)"
    assert hint(120, 90) == "no positive β makes a corner (a right angle): α is already 120°"
    assert hint(22.5, 180) == "β = 180° − 22.5° = 157.5° would make a straight line"


def test_steps():
    steps = [step["math"] for step in solve(40, 70).steps]
    assert steps[0] == "α = 40°, opened from the first ray"
    assert steps[2] == "α + β = 40° + 70° = 110°"
    assert steps[3].startswith("110° ≠ 90°: not complementary; β = 90° − 40° = 50°")
    assert steps[4].startswith("110° ≠ 180°: not supplementary; β = 180° − 40° = 140°")
    assert solve(45, 45).steps[3]["math"] == "45° + 45° = 90°: complementary, the outer rays make a corner (a right angle)"
