"""G.2 Angles: Measure & Types: one angle ∠ABC, its type, radians and outside angle, and a ray BD inside it.

    solver.py    the page's calculations, built on core/formula.py (G.2)
    html/        interactive page built on solver.py + general.web / general.styles
    style.py     maps this topic's elements onto general theme roles
    api.py       what this topic publishes to the static API (PP.use / PP.embed)
"""

from .solver import solve

__all__ = ["solve"]
