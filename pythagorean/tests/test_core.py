import math

import pytest

from core import formula
from pythagorean.solver import classify, corner_cosine, is_triple, longest_last, solve

TRIPLES = [(3, 4, 5), (5, 12, 13), (8, 15, 17), (7, 24, 25), (6, 8, 10)]
LEGS = [(a, b) for a, b, _ in TRIPLES] + [(1, 1), (2.5, 6), (1.5, 2), (2, 3), (10, 0.6)]
SIDES = [(5, 6, 7), (4, 5, 8), (6, 8, 10), (13, 5, 12), (2, 3, 6), (1, 1, 2), (3, 3, 3), (9, 4, 6), (2.5, 6, 6.5)]


def test_pythagorean_theorem_and_classification():
    assert formula.pythagorean_theorem(3, 4) == 5
    assert formula.is_acute_triangle(5, 6, 7) and not formula.is_obtuse_triangle(5, 6, 7)
    assert formula.is_obtuse_triangle(4, 5, 8) and not formula.is_acute_triangle(4, 5, 8)
    assert not formula.is_acute_triangle(3, 4, 5) and not formula.is_obtuse_triangle(3, 4, 5)  # right: neither


@pytest.mark.parametrize("a, b, c", TRIPLES)
def test_triples(a, b, c):
    s = solve(a, b)
    assert s.sides["c"] == c and s.triple and s.kind == "right"
    assert s.squares["a"] + s.squares["b"] == s.squares["c"] == s.sum
    assert s.vertices == {"C": [0.0, 0.0], "B": [a, 0.0], "A": [0.0, b]}
    assert classify(a, b, c).kind == "right" and classify(a, b, c).triple


@pytest.mark.parametrize("a, b", LEGS)
def test_legs_give_the_hypotenuse(a, b):
    s = solve(a, b)
    assert s.sides["c"] == pytest.approx(math.hypot(a, b))
    assert s.squares["c"] == pytest.approx(a * a + b * b) and s.sign == "="


@pytest.mark.parametrize("a, b, c", SIDES)
def test_classify_matches_the_formulas(a, b, c):
    s = classify(a, b, c)
    x, y, z = s.sides["a"], s.sides["b"], s.sides["c"]
    assert sorted((x, y, z)) == sorted((a, b, c)) and z == max(a, b, c)
    assert s.sign == ("<" if formula.is_acute_triangle(x, y, z) else ">" if formula.is_obtuse_triangle(x, y, z) else "=")
    if s.vertices:
        (cx, cy), (bx, by), (ax, ay) = s.vertices["C"], s.vertices["B"], s.vertices["A"]
        assert math.dist((cx, cy), (bx, by)) == pytest.approx(x)
        assert math.dist((cx, cy), (ax, ay)) == pytest.approx(y)
        assert math.dist((bx, by), (ax, ay)) == pytest.approx(z)


def test_kinds():
    assert classify(5, 6, 7).kind == "acute" and classify(4, 5, 8).kind == "obtuse" and classify(3, 3, 3).kind == "acute"
    assert classify(2, 3, 6).kind == "none" and classify(2, 3, 6).vertices is None
    assert classify(1, 1, 2).kind == "none"  # flat: a + b = c does not close
    assert classify(13, 5, 12).relabelled and not classify(5, 12, 13).relabelled


def test_helpers():
    assert longest_last(13, 5, 12) == (12, 5, 13) and longest_last(5, 13, 12) == (5, 12, 13) and longest_last(3, 4, 5) == (3, 4, 5)
    assert corner_cosine(3, 4, 5) == 0 and corner_cosine(2, 3, 6) < -1
    assert is_triple(3, 4, 5) and not is_triple(1, 1, math.sqrt(2))


def test_steps():
    legs = [step["math"] for step in solve(3, 4).steps]
    assert legs[1] == "a² = 3² = 9, b² = 4² = 16"
    assert legs[2].startswith("c² = 9 + 16 = 25: the square on the hypotenuse")
    assert legs[3] == "c = √25 = 5: 3, 4, 5 are whole numbers, a Pythagorean triple"
    assert solve(1, 1).steps[3]["math"] == "c = √2 = 1.414"
    sides = [step["math"] for step in classify(4, 5, 8).steps]
    assert sides[2] == "c² = 64 > a² + b² = 16 + 25 = 41"
    assert sides[3] == "c² > a² + b²: obtuse: the angle opposite c is more than 90°"
    assert classify(13, 5, 12).steps[0]["math"] == "a = 12, b = 5, c = 13, relabelled so that c is the longest"
