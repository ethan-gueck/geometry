"""How numbers are written on the Geometry pages: the same rule as the algebra pages.

The browser copy is static/fmt.js (window.GeoFmt). Each topic's
tests/test_js_parity.py runs it with that topic's math module, so the two stay
identical.
"""

from __future__ import annotations

from pathlib import Path

STATIC = Path(__file__).resolve().parent / "static"
FMT_SCRIPT = STATIC / "fmt.js"  # loaded first by every page and published with every math module
FIGURE_SCRIPT = STATIC / "figure.js"  # drawing helpers for the page controllers


def clean(value: float) -> float:
    """Round away float noise (e.g. 1.9999999999 -> 2.0, -0.0 -> 0.0)."""
    rounded = round(value, 10)
    return 0.0 if rounded == 0 else rounded


def fmt(value: float) -> str:
    """Compact human-readable number: 2.0 -> '2', 0.3333333 -> '0.3333'."""
    return f"{clean(value):.4g}"


def deg(value: float) -> str:
    """An angle in degrees: 30.0 -> '30°'."""
    return f"{fmt(value)}°"
