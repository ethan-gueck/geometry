import json
import re

from triangle_types.html import build_triangle_types_html
from triangle_types.style import ROLES


def _config(document: str) -> dict:
    return json.loads(re.search(r'<script id="pp-config" type="application/json">(.*?)</script>', document, re.S).group(1))


def test_page_inlines_its_scripts_and_has_the_code_popup():
    document = build_triangle_types_html(output_path=None)
    assert "{{" not in document and "<script src=" not in document
    assert "window.GeoFmt" in document and "window.TriangleTypeMath" in document and "window.GeoFigure" in document
    assert "stage-settings" in document and 'data-show="marks"' in document and 'data-show="guide"' in document
    assert "Geometry · G.4" in document
    dialog = document.split('<dialog class="code-modal"')[1].split("</dialog>")[0]
    for name in ("is-equilateral", "is-isosceles", "is-scalene", "classify-triangle-by-sides", "classify-triangle-by-angles",
                 "isosceles-base-angle", "angles-smallest-to-largest", "equilateral-triangle-area"):
        assert f'id="pp-code-0-{name}"' in dialog
    for other in ("triangle-angle-sum", "pythagorean-theorem", "is-obtuse-triangle"):
        assert f'id="pp-code-0-{other}"' not in dialog  # only the G.4 section
    assert "angles_from_sides" not in dialog and "closes" not in dialog


def test_config_carries_solution_and_roles():
    config = _config(build_triangle_types_html(3, 4, 5, output_path=None))
    assert config["initial"] == {"a": 3, "b": 4, "c": 5}
    assert config["solution"]["by_angles"] == "right" and config["solution"]["by_sides"] == "scalene"
    assert set(ROLES.values()) <= set(config["theme"]["stage"])
