"""
Authentication Middleware Module

Provides JWT token validation and authentication middleware
for FastAPI applications.
"""

from .auth_middleware import (
    AuthMiddleware,
    get_current_user,
    get_current_user_id,
    get_current_user_email,
    optional_auth,
    validate_bearer_token,
    require_auth,
    require_role,
    configure_auth_middleware,
    auth_exception_handler
)

__all__ = [
    "AuthMiddleware",
    "get_current_user",
    "get_current_user_id",
    "get_current_user_email",
    "optional_auth",
    "validate_bearer_token",
    "require_auth",
    "require_role",
    "configure_auth_middleware",
    "auth_exception_handler"
]