"""Geometry: the mathematics behind every neuron in this track, in flashcard order."""

import math

# _____________ G.1 Points, Lines, Rays, Segments & Planes _____________

# _____________ G.2 Angles: Measure & Types _____________

def is_acute_angle(theta):
    """0° < θ < 90°: an acute angle is smaller than a right angle."""
    return 0 < theta < 90

def is_right_angle(theta):
    """θ = 90°: a right angle, marked with a small square; its sides are perpendicular."""
    return theta == 90

def is_obtuse_angle(theta):
    """90° < θ < 180°: an obtuse angle is larger than a right angle and smaller than a straight one."""
    return 90 < theta < 180

def is_straight_angle(theta):
    """θ = 180°: a straight angle; its two sides are opposite rays, so the angle is a line."""
    return theta == 180

def is_reflex_angle(theta):
    """180° < θ < 360°: a reflex angle is larger than a straight angle."""
    return 180 < theta < 360

def is_full_turn(theta):
    """θ = 360°: one full revolution, 2π radians."""
    return theta == 360

def degrees_to_radians(theta):
    """θ rad = θ° × π / 180°: a full turn is 360° = 2π rad, a straight angle 180° = π rad."""
    return theta * math.pi / 180

def reflex_angle(theta):
    """360° − θ: the angle on the outside, going the other way round the vertex."""
    return 360 - theta

def angle_addition(abd, dbc):
    """m∠ABC = m∠ABD + m∠DBC: if D is inside ∠ABC, the two parts add up to the whole."""
    return abd + dbc

def angle_bisector(abc):
    """m∠ABD = m∠DBC = ½ m∠ABC: the bisector BD splits the angle into two equal halves."""
    return abc / 2


# _____________ G.3 Angle Relationships _____________

def is_complementary_angle(a, b):
    """Two angles are complementary if they add up to 90°."""
    return a + b == 90

def is_supplementary_angle(a, b):
    """Two angles are supplementary if they add up to 180°."""
    return a + b == 180

# _____________ G.4 Classifying Triangles _____________

# _____________ G.5 Triangle Angle Sum & Triangle Inequality _____________

def triangle_angle_sum(a, b, c):
    """The sum of the interior angles of a triangle is 180°."""
    return a + b + c == 180

# _____________ G.6 Triangle Congruence _____________

# _____________ G.7 Pythagorean Theorem _____________

def pythagorean_theorem(a, b):
    """In a right triangle, the square of the hypotenuse is equal to the sum of the squares of the other two sides."""
    return (a**2 + b**2) ** 0.5

def is_acute_triangle(a, b, c):
    """c² < a² + b²: acute, with c the longest side."""
    return c**2 < a**2 + b**2

def is_obtuse_triangle(a, b, c):
    """c² > a² + b²: obtuse, with c the longest side."""
    return c**2 > a**2 + b**2

# _____________ G.8 Special Right Triangles _____________

# _____________ G.9 Similar Triangles & Scale Factor _____________

# _____________ G.10 Similarity Criteria & Proportional Segments _____________

# _____________ G.11 Triangle Centers _____________

# _____________ G.12 Distance & Midpoint Formulas _____________

# _____________ G.13 Polygon Angle Sums & Diagonals _____________

# _____________ G.14 Quadrilateral Properties _____________

# _____________ G.15 Area of Plane Figures _____________

# _____________ G.16 Triangle Area: Heron’s Formula & Alternatives _____________

# _____________ G.17 Circles: Circumference, Area, Arcs & Sectors _____________

def circumference_of_a_circle(r):
    """C = 2πr: the circumference C is the distance around a circle of radius r.

    r is the radius (the distance from the center to any point on the circle) and π ≈ 3.14159
    is the ratio of any circle's circumference to its diameter d = 2r, so C = πd as well.
    """
    return 2 * math.pi * r

def area_of_a_circle(r):
    """A = πr²: the area A enclosed by a circle of radius r.

    r is the radius and π ≈ 3.14159; doubling the radius multiplies the area by four.
    """
    return math.pi * r ** 2

def arc_length(r, theta):
    """s = rθ: the arc length s cut off by a central angle θ in a circle of radius r.

    θ (theta) is the central angle in radians: the arc is the fraction θ / 2π of the
    circumference 2πr. For an angle in degrees, convert first with math.radians(degrees).
    """
    return r * theta

def sector_of_a_circle(r, theta):
    """A_sector = ½r²θ: the area of the pie-shaped sector between two radii and the arc between them.

    r is the radius and θ (theta) the central angle in radians: the sector is the fraction
    θ / 2π of the circle's area πr². For an angle in degrees, convert first with math.radians(degrees).
    """
    return (1 / 2) * r ** 2 * theta

# _____________ G.18 Circle Theorems _____________

# _____________ G.19 Equation of a Circle _____________

# _____________ G.20 Coordinate Geometry Proofs _____________

# _____________ G.21 Prisms & Cylinders _____________

# _____________ G.22 Pyramids, Cones & Spheres _____________

# _____________ G.23 Surface Area of Solids _____________

# _____________ G.24 Coordinate Transformations _____________

# _____________ G.25 Rotations, Rigid Motions & Compositions _____________
