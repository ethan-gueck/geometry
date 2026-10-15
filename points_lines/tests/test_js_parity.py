"""The browser module (html/static/points_lines_math.js) must match solver.py exactly."""

import json

import pytest

from general.jsrun import AVAILABLE, assert_close, run_js
from points_lines.api import TOPIC
from points_lines.solver import solve

from .test_core import CASES

MODULE = TOPIC.modules[0]

pytestmark = pytest.mark.skipif(not AVAILABLE, reason="no JavaScript runtime (node or osascript)")


def test_solve_matches_python():
    calls = f"{json.dumps(CASES)}.map(function (t) {{ return window.{MODULE.global_name}.solve.apply(null, t); }})"
    for case, js in zip(CASES, run_js(list(MODULE.scripts), calls)):
        assert_close(json.loads(json.dumps(solve(*case).to_dict())), js, str(case))


def test_every_published_function_exists_in_js():
    assert set(MODULE.functions) <= set(run_js(list(MODULE.scripts), f"Object.keys(window.{MODULE.global_name})"))
