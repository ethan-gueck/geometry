"""The browser module (html/static/triangle_types_math.js) must match solver.py exactly."""

import json

import pytest

from general.jsrun import AVAILABLE, assert_close, run_js
from triangle_types.api import TOPIC
from triangle_types.solver import solve

from .test_core import CASES

MODULE = TOPIC.modules[0]

pytestmark = pytest.mark.skipif(not AVAILABLE, reason="no JavaScript runtime (node or osascript)")


def test_solve_matches_python():
    # No values that are 4-significant-digit ties (1.5625): Python .4g and JS toPrecision round those differently.
    cases = CASES + [(8, 8, 3), (10, 7, 7), (9, 12, 15), (1, 1, 1.9), (4.5, 6, 7.5), (2, 2, 4.2), (13, 13, 13)]
    calls = f"{json.dumps(cases)}.map(function (t) {{ return window.{MODULE.global_name}.solve(t[0], t[1], t[2]); }})"
    for case, js in zip(cases, run_js(list(MODULE.scripts), calls)):
        assert_close(json.loads(json.dumps(solve(*case).to_dict())), js, str(case))


def test_every_published_function_exists_in_js():
    assert set(MODULE.functions) <= set(run_js(list(MODULE.scripts), f"Object.keys(window.{MODULE.global_name})"))
