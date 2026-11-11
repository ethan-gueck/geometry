"""G.4 Classifying Triangles: three sides a, b and c, typed by their sides (equilateral, isosceles, scalene) and by their largest angle (acute, right, obtuse).

    solver.py    the page's calculations, built on core/formula.py (G.4)
    html/        interactive page built on solver.py + general.web / general.styles
    style.py     maps this topic's elements onto general theme roles
    api.py       what this topic publishes to the static API (PP.use / PP.embed)
"""

from .solver import solve

__all__ = ["solve"]
