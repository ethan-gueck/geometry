"""G.1 Angle Relationships: two adjacent angles α and β, and whether they are complementary or supplementary.

    solver.py    the page's calculations, built on core/formula.py (G.1)
    html/        interactive page built on solver.py + general.web / general.styles
    style.py     maps this topic's elements onto general theme roles
    api.py       what this topic publishes to the static API (PP.use / PP.embed)
"""

from .solver import solve

__all__ = ["solve"]
