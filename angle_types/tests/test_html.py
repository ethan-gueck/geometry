import json
import re

from angle_types.html import build_angle_types_html
from angle_types.style import ROLES


def _config(document: str) -> dict:
    return json.loads(re.search(r'<script id="pp-config" type="application/json">(.*?)</script>', document, re.S).group(1))


def test_page_inlines_its_scripts_and_has_the_code_popup():
    document = build_angle_types_html(output_path=None)
    assert "{{" not in document and "<script src=" not in document
    assert "window.GeoFmt" in document and "window.AngleTypeMath" in document and "window.GeoFigure" in document
    assert 'class="masthead__back"' in document and "theme-toggle" in document
    dialog = document.split('<dialog class="code-modal"')[1].split("</dialog>")[0]
    for name in ("is-acute-angle", "is-reflex-angle", "degrees-to-radians", "reflex-angle", "angle-addition", "angle-bisector"):
        assert f'id="pp-code-0-{name}"' in dialog
    for other in ("is-complementary-angle", "pythagorean-theorem"):
        assert f'id="pp-code-0-{other}"' not in dialog  # only the G.2 section


def test_config_carries_solution_and_roles():
    config = _config(build_angle_types_html(90, 45, output_path=None))
    assert config["initial"] == {"theta": 90, "d": 45}
    assert config["solution"]["kind"] == "right" and config["solution"]["bisected"] is True
    assert set(ROLES.values()) <= set(config["theme"]["stage"])
