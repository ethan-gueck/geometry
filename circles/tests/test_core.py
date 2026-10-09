import math

import pytest

from circles.solver import solve
from core import formula

CASES = [(3, 60), (1, 90), (6, 45), (2.5, 180), (2, 360), (4, 30), (0.5, 120), (10, 0)]


def test_circumference_and_area():
    assert formula.circumference_of_a_circle(1) == pytest.approx(2 * math.pi)
    assert formula.area_of_a_circle(3) == pytest.approx(9 * math.pi)
    assert formula.area_of_a_circle(4) == pytest.approx(4 * formula.area_of_a_circle(2))  # double r, four times the area


def test_a_full_turn_is_the_whole_circle():
    for r in (0.5, 2, 7):
        assert formula.arc_length(r, 2 * math.pi) == pytest.approx(formula.circumference_of_a_circle(r))
        assert formula.sector_of_a_circle(r, 2 * math.pi) == pytest.approx(formula.area_of_a_circle(r))


def test_one_radian_cuts_an_arc_one_radius_long():
    assert formula.arc_length(4, 1) == 4


@pytest.mark.parametrize("r, degrees", CASES)
def test_arc_and_sector_take_the_same_share(r, degrees):
    s = solve(r, degrees)
    assert s.arc / s.circumference == pytest.approx(degrees / 360)
    assert s.sector / s.area == pytest.approx(degrees / 360)
    assert s.radians == pytest.approx(math.radians(degrees))


def test_solution_values():
    s = solve(3, 60)
    assert (s.circumference, s.area) == (pytest.approx(6 * math.pi), pytest.approx(9 * math.pi))
    assert s.arc == pytest.approx(math.pi) and s.sector == pytest.approx(1.5 * math.pi)
    assert [step["id"] for step in s.steps] == ["radius", "circumference", "area", "angle", "arc", "sector", "check"]


@pytest.mark.parametrize("r, degrees", [(0, 60), (-1, 60), (2, -10), (2, 400)])
def test_out_of_range_inputs(r, degrees):
    with pytest.raises(ValueError):
        solve(r, degrees)
