import json
import re

from circles.html import build_circles_html
from circles.style import ROLES


def _config(document: str) -> dict:
    return json.loads(re.search(r'<script id="pp-config" type="application/json">(.*?)</script>', document, re.S).group(1))


def test_page_inlines_its_scripts_and_has_the_code_popup():
    document = build_circles_html(output_path=None)
    assert "{{" not in document and "window.CircleMath" in document and "window.GeoFmt" in document and "<script src=" not in document
    dialog = document.split('<dialog class="code-modal"')[1]
    for name in ("circumference-of-a-circle", "area-of-a-circle", "arc-length", "sector-of-a-circle"):
        assert f'id="pp-code-0-{name}"' in dialog
    assert "mathematics behind every neuron" not in dialog  # only the functions


def test_config_carries_solution_and_roles():
    config = _config(build_circles_html(2, 90, output_path=None))
    assert config["initial"] == {"r": 2, "degrees": 90}
    assert abs(config["solution"]["share"] - 0.25) < 1e-12
    assert set(ROLES.values()) <= set(config["theme"]["stage"])
