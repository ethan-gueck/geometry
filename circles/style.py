"""Maps circle elements onto the generic stage roles of general.themes."""

from general.themes import Theme, get_theme

ROLES = {
    "circle": "primary",  # the circumference C
    "disc": "secondary",  # the area A
    "radius": "point",  # the centre and the radius r
    "sector": "highlight",  # the sector between the two radii
    "arc": "warning",  # the arc s cut off by θ
}


def palette(theme: str | Theme | None = None) -> dict[str, str]:
    """Element -> CSS colour for the given theme."""
    stage = get_theme(theme).stage
    return {element: stage[role] for element, role in ROLES.items()}
