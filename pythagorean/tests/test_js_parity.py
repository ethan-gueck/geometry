"""The browser module (html/static/pythagorean_math.js) must match solver.py exactly."""

import json

import pytest

from general.jsrun import AVAILABLE, assert_close, run_js
from pythagorean.api import TOPIC
from pythagorean.solver import classify, solve

from .test_core import LEGS, SIDES

MODULE = TOPIC.modules[0]

pytestmark = pytest.mark.skipif(not AVAILABLE, reason="no JavaScript runtime (node or osascript)")


def test_solve_matches_python():
    # No squares that are 4-significant-digit ties (100.25, 1.5625): Python .4g and JS toPrecision round those differently.
    cases = LEGS + [(9, 12), (0.5, 0.5), (20, 21), (11, 3.2)]
    calls = f"{json.dumps(cases)}.map(function (t) {{ return window.{MODULE.global_name}.solve(t[0], t[1]); }})"
    for case, js in zip(cases, run_js(list(MODULE.scripts), calls)):
        assert_close(json.loads(json.dumps(solve(*case).to_dict())), js, str(case))


def test_classify_matches_python():
    cases = SIDES + [(5, 12, 13), (12, 13, 5), (7, 7, 9.5), (30, 2, 29), (0.5, 0.5, 0.5), (20, 21, 29)]
    calls = f"{json.dumps(cases)}.map(function (t) {{ return window.{MODULE.global_name}.classify(t[0], t[1], t[2]); }})"
    for case, js in zip(cases, run_js(list(MODULE.scripts), calls)):
        assert_close(json.loads(json.dumps(classify(*case).to_dict())), js, str(case))


def test_every_published_function_exists_in_js():
    assert set(MODULE.functions) <= set(run_js(list(MODULE.scripts), f"Object.keys(window.{MODULE.global_name})"))
