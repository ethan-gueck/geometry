import json
import re

from triangle_angles.html import build_triangle_angles_html
from triangle_angles.style import ROLES


def _config(document: str) -> dict:
    return json.loads(re.search(r'<script id="pp-config" type="application/json">(.*?)</script>', document, re.S).group(1))


def test_page_inlines_its_scripts_and_has_the_code_popup():
    document = build_triangle_angles_html(output_path=None)
    assert "{{" not in document and "<script src=" not in document
    assert "window.GeoFmt" in document and "window.TriangleMath" in document and "window.GeoFigure" in document
    assert "stage-settings" in document and 'data-show="proof"' in document
    dialog = document.split('<dialog class="code-modal"')[1].split("</dialog>")[0]
    assert 'id="pp-code-0-triangle-angle-sum"' in dialog
    for other in ("is-complementary-angle", "is-supplementary-angle", "pythagorean-theorem", "is-obtuse-triangle"):
        assert f'id="pp-code-0-{other}"' not in dialog  # only the G.2 section
    assert "vertices" not in dialog and "G.13 Coordinate Transformations" not in dialog


def test_config_carries_solution_and_roles():
    config = _config(build_triangle_angles_html(30, 60, 90, output_path=None))
    assert config["initial"] == {"a": 30, "b": 60, "c": 90}
    assert config["solution"]["is_triangle"] is True and config["solution"]["texts"]["total"] == "180°"
    assert set(ROLES.values()) <= set(config["theme"]["stage"])
