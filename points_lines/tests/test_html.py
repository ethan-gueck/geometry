import json
import re

from points_lines.html import build_points_lines_html
from points_lines.style import ROLES


def _config(document: str) -> dict:
    return json.loads(re.search(r'<script id="pp-config" type="application/json">(.*?)</script>', document, re.S).group(1))


def test_page_inlines_its_scripts_and_has_the_code_popup():
    document = build_points_lines_html(output_path=None)
    assert "{{" not in document and "<script src=" not in document
    assert "window.GeoFmt" in document and "window.PointsMath" in document and "window.GeoFigure" in document
    assert 'class="masthead__back"' in document and "theme-toggle" in document
    dialog = document.split('<dialog class="code-modal"')[1].split("</dialog>")[0]
    for name in ("segment-length", "segment-addition", "are-collinear", "is-between", "determine-one-plane", "line-intersection"):
        assert f'id="pp-code-0-{name}"' in dialog
    for other in ("is-acute-angle", "is-complementary-angle"):
        assert f'id="pp-code-0-{other}"' not in dialog  # only the G.1 section


def test_config_carries_solution_and_roles():
    config = _config(build_points_lines_html(-3, -1, 3, 2, -2, 2, 2, 4, output_path=None))
    assert config["initial"]["bx"] == 3 and config["solution"]["intersection"]["kind"] == "parallel"
    assert set(ROLES.values()) <= set(config["theme"]["stage"])
