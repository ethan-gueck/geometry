"""Maps right-triangle elements onto the generic stage roles of general.themes."""

from general.themes import Theme, get_theme

ROLES = {
    "sides": "text",
    "a": "primary",
    "b": "secondary",
    "c": "highlight",
    "corner": "point",
    "guide": "guide",
    "gap": "warning",
}


def palette(theme: str | Theme | None = None) -> dict[str, str]:
    """Element -> CSS colour for the given theme."""
    stage = get_theme(theme).stage
    return {element: stage[role] for element, role in ROLES.items()}
