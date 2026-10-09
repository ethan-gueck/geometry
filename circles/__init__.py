"""G.9 Circles: circumference, area, arc length and sector area from a radius and a central angle.

    solver.py    the page's calculations, built on core/formula.py (G.9)
    html/        interactive page built on solver.py + general.web / general.styles
    style.py     maps this topic's elements onto general theme roles
    api.py       what this topic publishes to the static API (PP.use / PP.embed)
"""

from .solver import solve

__all__ = ["solve"]
