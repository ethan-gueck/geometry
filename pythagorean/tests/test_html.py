import json
import re

from pythagorean.html import build_pythagorean_html
from pythagorean.style import ROLES


def _config(document: str) -> dict:
    return json.loads(re.search(r'<script id="pp-config" type="application/json">(.*?)</script>', document, re.S).group(1))


def test_page_inlines_its_scripts_and_has_the_code_popup():
    document = build_pythagorean_html(output_path=None)
    assert "{{" not in document and "<script src=" not in document
    assert "window.GeoFmt" in document and "window.PythagorasMath" in document and "window.GeoFigure" in document
    assert "stage-settings" in document and 'data-show="squares"' in document
    dialog = document.split('<dialog class="code-modal"')[1].split("</dialog>")[0]
    for name in ("pythagorean-theorem", "is-acute-triangle", "is-obtuse-triangle"):
        assert f'id="pp-code-0-{name}"' in dialog
    for other in ("is-complementary-angle", "triangle-angle-sum"):
        assert f'id="pp-code-0-{other}"' not in dialog  # only the G.3 section
    assert "corner_cosine" not in dialog and "G.13 Coordinate Transformations" not in dialog


def test_config_carries_solution_and_roles():
    legs = _config(build_pythagorean_html(5, 12, output_path=None))
    assert legs["initial"] == {"mode": "legs", "a": 5, "b": 12}
    assert legs["solution"]["texts"]["c"] == "13" and legs["solution"]["triple"] is True
    sides = _config(build_pythagorean_html(4, 5, 8, output_path=None))
    assert sides["initial"] == {"mode": "sides", "a": 4, "b": 5, "c": 8} and sides["solution"]["kind"] == "obtuse"
    assert set(ROLES.values()) <= set(legs["theme"]["stage"])
