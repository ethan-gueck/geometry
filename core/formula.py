"""Geometry: the mathematics behind every neuron in this track, in flashcard order."""

import math

# _____________ G.1 Points, Lines, Rays, Segments & Planes _____________

def segment_length(x1, y1, x2, y2):
    """AB = √((x₂ − x₁)² + (y₂ − y₁)²): the length of segment AB, written without the bar."""
    return math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)

def segment_addition(ab, bc):
    """AB + BC = AC: when B lies on segment AC, the two pieces add up to the whole."""
    return ab + bc

def are_collinear(ax, ay, bx, by, cx, cy):
    """m_AB = m_BC: three points lie on one line when the slopes agree (or all x are equal).

    Written cross-multiplied, (y_B − y_A)(x_C − x_B) = (y_C − y_B)(x_B − x_A), so a vertical line needs no division.
    """
    return math.isclose((by - ay) * (cx - bx), (cy - by) * (bx - ax), abs_tol=1e-9)

def is_between(ax, ay, bx, by, cx, cy):
    """B is between A and C exactly when AB + BC = AC: any detour off the segment makes the sum longer."""
    ab = segment_length(ax, ay, bx, by)
    bc = segment_length(bx, by, cx, cy)
    ac = segment_length(ax, ay, cx, cy)
    return math.isclose(segment_addition(ab, bc), ac, abs_tol=1e-9)

def determine_one_plane(ax, ay, bx, by, cx, cy):
    """Three noncollinear points determine exactly one plane; three points on one line lie in many."""
    return not are_collinear(ax, ay, bx, by, cx, cy)

def line_intersection(ax, ay, bx, by, cx, cy, dx, dy):
    """Lines AB and CD meet in one point, never (parallel), or everywhere (the same line).

    Returns ("point", (x, y)), ("parallel", None) or ("same", None).
    """
    denominator = (bx - ax) * (dy - cy) - (by - ay) * (dx - cx)
    if math.isclose(denominator, 0, abs_tol=1e-9):
        if are_collinear(ax, ay, bx, by, cx, cy):
            return "same", None
        return "parallel", None
    t = ((cx - ax) * (dy - cy) - (cy - ay) * (dx - cx)) / denominator
    return "point", (ax + t * (bx - ax), ay + t * (by - ay))

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

def special_right_triangle_30_60_90(short_leg):
    """In a 30°-60°-90° triangle, the hypotenuse is twice the short leg and the long leg is √3 times the short leg."""
    hypotenuse = 2 * short_leg
    long_leg = short_leg * math.sqrt(3)
    return hypotenuse, long_leg

def special_right_triangle_45_45_90(leg):
    """In a 45°-45°-90° triangle, the hypotenuse is √2 times the leg."""
    hypotenuse = leg * math.sqrt(2)
    return hypotenuse

def height_of_equilateral_triangle(side):
    """h = (√3 / 2) * s: the height of an equilateral triangle with side length s."""
    return (math.sqrt(3) / 2) * side

def diagonal_of_square(side):
    """d = s√2: the diagonal of a square with side length s."""
    return side * math.sqrt(2)

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
