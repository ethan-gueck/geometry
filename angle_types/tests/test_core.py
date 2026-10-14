import math

import pytest

from angle_types.solver import classify, pi_text, radians_text, solve
from core import formula

CASES = [(130, 50), (40, 20), (90, 45), (180, 60), (250, 125), (360, 90), (0, 0), (30, 30), (135, 0), (45.5, 10.25), (300, 200), (1, 0.5), (89, 40), (270, 135)]


def test_the_type_tests():
    assert formula.is_acute_angle(30) and not formula.is_acute_angle(90) and not formula.is_acute_angle(0)
    assert formula.is_right_angle(90) and formula.is_obtuse_angle(120) and not formula.is_obtuse_angle(180)
    assert formula.is_straight_angle(180) and formula.is_reflex_angle(270) and not formula.is_reflex_angle(360)
    assert formula.is_full_turn(360)


def test_measure_addition_and_bisector():
    assert formula.degrees_to_radians(180) == pytest.approx(math.pi) and formula.degrees_to_radians(360) == pytest.approx(2 * math.pi)
    assert formula.reflex_angle(30) == 330 and formula.angle_addition(50, 80) == 130 and formula.angle_bisector(130) == 65


@pytest.mark.parametrize("theta, kind", [(0, "zero"), (40, "acute"), (90, "right"), (130, "obtuse"), (180, "straight"), (250, "reflex"), (360, "full")])
def test_classify(theta, kind):
    assert classify(theta) == kind


def test_radians_as_multiples_of_pi():
    assert [pi_text(t) for t in (0, 30, 45, 90, 135, 180, 270, 360, 130, 1)] == ["0", "π/6", "π/4", "π/2", "3π/4", "π", "3π/2", "2π", "13π/18", ""]
    assert radians_text(90) == "π/2 ≈ 1.571 rad" and radians_text(1) == "0.01745 rad"


@pytest.mark.parametrize("theta, d", CASES)
def test_the_parts_add_up(theta, d):
    s = solve(theta, d)
    assert s.dbc + d == pytest.approx(theta) and s.outside + theta == pytest.approx(360)
    assert s.bisector == pytest.approx(theta / 2) and s.bisected == (abs(d - theta / 2) < 1e-9)


def test_steps_and_bad_inputs():
    steps = [step["math"] for step in solve(130, 50).steps]
    assert steps[0] == "θ = 130°: obtuse: between 90° and 180°, wider than a right angle"
    assert steps[2] == "360° − 130° = 230°" and steps[3] == "50° + 80° = 130°"
    assert steps[4] == "½ × 130° = 65°; BD would bisect ∠ABC at 65°, not 50°"
    assert solve(90, 45).steps[4]["math"] == "½ × 90° = 45°: BD is the bisector"
    for theta, d in ((400, 10), (-5, 0), (90, 100)):
        with pytest.raises(ValueError):
            solve(theta, d)
