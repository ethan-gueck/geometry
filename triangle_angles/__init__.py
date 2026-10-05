"""G.2 Triangle Angle Sum: three angles A, B and C make a triangle only when A + B + C = 180°.

    solver.py    the page's calculations, built on core/formula.py (G.2)
    html/        interactive page built on solver.py + general.web / general.styles
    style.py     maps this topic's elements onto general theme roles
    api.py       what this topic publishes to the static API (PP.use / PP.embed)
"""

from .solver import solve

__all__ = ["solve"]
