from __future__ import annotations


class DomainError(Exception):
    """A rule of the platform was violated. Becomes an HTTP error with a human-readable message."""

    def __init__(self, message: str, status: int = 400):
        super().__init__(message)
        self.message = message
        self.status = status


class NotFound(DomainError):
    def __init__(self, message: str = "Not found"):
        super().__init__(message, 404)


class Forbidden(DomainError):
    def __init__(self, message: str = "Your role cannot make that change."):
        super().__init__(message, 403)


class Conflict(DomainError):
    def __init__(self, message: str):
        super().__init__(message, 409)
