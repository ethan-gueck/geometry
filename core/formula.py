"""Geometry: the mathematics behind every neuron in this track, in flashcard order."""

# _____________ G.1 Angle Relationships _____________

def is_complementary_angle(a, b):
    """Two angles are complementary if they add up to 90°."""
    return a + b == 90

def is_supplementary_angle(a, b):
    """Two angles are supplementary if they add up to 180°."""
    return a + b == 180

# _____________ G.2 Triangle Angle Sum & Triangle Inequality _____________

def triangle_angle_sum(a, b, c):
    """The sum of the interior angles of a triangle is 180°."""
    return a + b + c == 180

# _____________ G.3 Pythagorean Theorem _____________

def pythagorean_theorem(a, b):
    """In a right triangle, the square of the hypotenuse is equal to the sum of the squares of the other two sides."""
    return (a**2 + b**2) ** 0.5

def is_acute_triangle(a, b, c):
    """c² < a² + b²: acute, with c the longest side."""
    return c**2 < a**2 + b**2

def is_obtuse_triangle(a, b, c):
    """c² > a² + b²: obtuse, with c the longest side."""
    return c**2 > a**2 + b**2

# _____________ G.4 Special Right Triangles _____________

# _____________ G.5 Similar Triangles & Scale Factor _____________

# _____________ G.6 Distance & Midpoint Formulas _____________

# _____________ G.7 Polygon Angle Sums & Diagonals _____________

# _____________ G.8 Area of Plane Figures _____________

# _____________ G.9 Circles: Circumference, Area, Arcs & Sectors _____________

# _____________ G.10 Circle Theorems _____________

# _____________ G.11 Prisms & Cylinders _____________

# _____________ G.12 Pyramids, Cones & Spheres _____________

# _____________ G.13 Coordinate Transformations _____________
