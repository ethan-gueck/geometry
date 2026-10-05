"""G.3 Pythagorean Theorem: a² + b² = c² for a right triangle, and c² against a² + b² to classify any triangle.

    solver.py    the page's calculations, built on core/formula.py (G.3)
    html/        interactive page built on solver.py + general.web / general.styles
    style.py     maps this topic's elements onto general theme roles
    api.py       what this topic publishes to the static API (PP.use / PP.embed)
"""

from .solver import classify, solve

__all__ = ["classify", "solve"]
