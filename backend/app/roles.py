"""Roles and the permission table. The browser mirrors this table only to grey out controls;
every rule here is enforced again on the server."""

from __future__ import annotations

ADMIN = "admin"
CRISIS_MANAGER = "crisis-manager"
RESOURCE_COORDINATOR = "resource-coordinator"
HELP_SEEKER = "help-seeker"

ALL_ROLES = (ADMIN, CRISIS_MANAGER, RESOURCE_COORDINATOR, HELP_SEEKER)
WORKSPACE_ROLES = (ADMIN, CRISIS_MANAGER, RESOURCE_COORDINATOR)

ROLE_LABELS = {
    ADMIN: "Admin",
    CRISIS_MANAGER: "Crisis manager",
    RESOURCE_COORDINATOR: "Resource coordinator",
    HELP_SEEKER: "Help seeker",
}

PERMISSIONS: dict[str, frozenset[str]] = {
    # 7-module workspace
    "view": frozenset(WORKSPACE_ROLES),
    "crisis": frozenset({ADMIN, CRISIS_MANAGER}),
    "resource": frozenset({ADMIN, RESOURCE_COORDINATOR}),
    "allocate": frozenset({ADMIN, CRISIS_MANAGER, RESOURCE_COORDINATOR}),
    "approve": frozenset({ADMIN, CRISIS_MANAGER}),
    "users": frozenset({ADMIN}),
    "message": frozenset({ADMIN, CRISIS_MANAGER, RESOURCE_COORDINATOR}),
    "save": frozenset({ADMIN, CRISIS_MANAGER, RESOURCE_COORDINATOR}),
    # help-request desk
    "request.raise": frozenset({HELP_SEEKER, CRISIS_MANAGER, ADMIN}),
    "request.review": frozenset({ADMIN, CRISIS_MANAGER}),  # verify / assign / resolve
    "request.dispatch": frozenset({ADMIN, RESOURCE_COORDINATOR}),
    "request.view_all": frozenset({ADMIN, CRISIS_MANAGER, RESOURCE_COORDINATOR}),
}


def can(role: str, permission: str) -> bool:
    return role in PERMISSIONS.get(permission, frozenset())
