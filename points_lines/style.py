"""Maps point-and-line figure elements onto the generic stage roles of general.themes."""

from general.themes import Theme, get_theme

ROLES = {
    "points": "point",
    "segment": "primary",
    "ray": "highlight",
    "line": "secondary",
    "path": "warning",
    "other": "muted",
    "meet": "highlight",
    "guide": "guide",
}


def palette(theme: str | Theme | None = None) -> dict[str, str]:
    """Element -> CSS colour for the given theme."""
    stage = get_theme(theme).stage
    return {element: stage[role] for element, role in ROLES.items()}
