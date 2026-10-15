"""G.1 Points, Lines, Rays, Segments & Planes: four points, the segments, rays and lines through them, and where two lines meet.

    solver.py    the page's calculations, built on core/formula.py (G.1)
    html/        interactive page built on solver.py + general.web / general.styles
    style.py     maps this topic's elements onto general theme roles
    api.py       what this topic publishes to the static API (PP.use / PP.embed)
"""

from .solver import solve

__all__ = ["solve"]
