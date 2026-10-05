import json
import re

from angles.html import build_angles_html
from angles.style import ROLES


def _config(document: str) -> dict:
    return json.loads(re.search(r'<script id="pp-config" type="application/json">(.*?)</script>', document, re.S).group(1))


def test_page_inlines_its_scripts_and_has_the_code_popup():
    document = build_angles_html(output_path=None)
    assert "{{" not in document and "<script src=" not in document
    assert "window.GeoFmt" in document and "window.AngleMath" in document and "window.GeoFigure" in document
    assert "stage-settings" in document and 'data-show="guides"' in document
    dialog = document.split('<dialog class="code-modal"')[1].split("</dialog>")[0]
    for name in ("is-complementary-angle", "is-supplementary-angle"):
        assert f'id="pp-code-0-{name}"' in dialog
    for other in ("triangle-angle-sum", "pythagorean-theorem", "is-acute-triangle"):
        assert f'id="pp-code-0-{other}"' not in dialog  # only the G.1 section
    assert "clean" not in dialog and "G.13 Coordinate Transformations" not in dialog


def test_config_carries_solution_and_roles():
    config = _config(build_angles_html(120, 60, output_path=None))
    assert config["initial"] == {"a": 120, "b": 60}
    assert config["solution"]["supplementary"] is True and config["solution"]["texts"]["total"] == "180°"
    assert set(ROLES.values()) <= set(config["theme"]["stage"])
