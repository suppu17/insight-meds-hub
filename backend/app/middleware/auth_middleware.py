"""
Authentication Middleware

JWT token validation middleware for protecting FastAPI routes
and managing user authentication state.
"""

import logging
from typing import Optional, Dict, Any
from fastapi import Request, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from app.services.stytch_service import stytch_service

# Configure logging
logger = logging.getLogger(__name__)

# Security scheme for Swagger UI
security = HTTPBearer()


class AuthMiddleware(BaseHTTPMiddleware):
    """
    JWT Authentication Middleware

    Automatically validates JWT tokens for protected routes and
    injects user information into the request state.
    """

    def __init__(self, app, protected_paths: list = None):
        """
        Initialize authentication middleware

        Args:
            app: FastAPI application instance
            protected_paths: List of path prefixes that require authentication
        """
        super().__init__(app)
        self.protected_paths = protected_paths or [
            "/api/v1/protected",
            "/api/v1/user",
            "/auth/me"
        ]

    async def dispatch(self, request: Request, call_next):
        """
        Process request and validate authentication if required

        Args:
            request: FastAPI request object
            call_next: Next middleware in chain

        Returns:
            Response from next middleware or error response
        """
        path = request.url.path
        method = request.method

        # Skip authentication for public endpoints
        if not self._requires_authentication(path, method):
            return await call_next(request)

        try:
            # Extract and validate JWT token
            token = self._extract_token(request)
            user_data = self._validate_token(token)

            # Inject user data into request state
            request.state.user = user_data
            request.state.authenticated = True
            request.state.user_id = user_data.get("user_id")
            request.state.email = user_data.get("email")

            logger.debug(f"Authenticated user {user_data.get('user_id')} for {path}")

            return await call_next(request)

        except HTTPException as e:
            logger.warning(f"Authentication failed for {path}: {e.detail}")
            return JSONResponse(
                status_code=e.status_code,
                content={
                    "success": False,
                    "message": e.detail,
                    "error_code": "AUTHENTICATION_FAILED"
                }
            )
        except Exception as e:
            logger.error(f"Authentication error for {path}: {e}")
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={
                    "success": False,
                    "message": "Authentication service error",
                    "error_code": "AUTH_SERVICE_ERROR"
                }
            )

    def _requires_authentication(self, path: str, method: str) -> bool:
        """
        Check if path requires authentication

        Args:
            path: Request path
            method: HTTP method

        Returns:
            True if authentication is required
        """
        # Public endpoints that don't require authentication
        public_endpoints = [
            "/docs",
            "/redoc",
            "/openapi.json",
            "/health",
            "/auth/signup",
            "/auth/login",
            "/auth/magic-link",
            "/auth/otp",
            "/auth/validate-token",
            "/auth/health"
        ]

        # Check if path is explicitly public
        for public_path in public_endpoints:
            if path.startswith(public_path):
                return False

        # Check if path requires protection
        for protected_path in self.protected_paths:
            if path.startswith(protected_path):
                return True

        # Default to no authentication required
        return False

    def _extract_token(self, request: Request) -> str:
        """
        Extract JWT token from request headers

        Args:
            request: FastAPI request object

        Returns:
            JWT token string

        Raises:
            HTTPException: If token is missing or invalid format
        """
        # Try Authorization header first
        authorization = request.headers.get("Authorization")
        if authorization:
            if authorization.startswith("Bearer "):
                return authorization.replace("Bearer ", "", 1)
            else:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid authorization header format. Use 'Bearer <token>'"
                )

        # Try query parameter as fallback
        token = request.query_params.get("token")
        if token:
            return token

        # Try cookies as last resort
        token = request.cookies.get("auth_token")
        if token:
            return token

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Provide token in Authorization header, query parameter, or cookie"
        )

    def _validate_token(self, token: str) -> Dict[str, Any]:
        """
        Validate JWT token and return user data

        Args:
            token: JWT token string

        Returns:
            Dictionary containing user data from token

        Raises:
            HTTPException: If token is invalid or expired
        """
        try:
            # Use Stytch service to validate token
            user_data = stytch_service.verify_jwt_token(token)

            # Ensure required fields are present
            if not user_data.get("user_id"):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token payload: missing user_id"
                )

            return user_data

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Token validation error: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token"
            )


# Dependency functions for route protection

def get_current_user(request: Request) -> Dict[str, Any]:
    """
    Dependency to get current authenticated user from request state

    Args:
        request: FastAPI request object

    Returns:
        Dictionary containing user data

    Raises:
        HTTPException: If user is not authenticated
    """
    if not hasattr(request.state, "authenticated") or not request.state.authenticated:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )

    return request.state.user


def get_current_user_id(request: Request) -> str:
    """
    Dependency to get current authenticated user ID

    Args:
        request: FastAPI request object

    Returns:
        User ID string

    Raises:
        HTTPException: If user is not authenticated
    """
    user_data = get_current_user(request)
    return user_data.get("user_id")


def get_current_user_email(request: Request) -> str:
    """
    Dependency to get current authenticated user email

    Args:
        request: FastAPI request object

    Returns:
        User email string

    Raises:
        HTTPException: If user is not authenticated
    """
    user_data = get_current_user(request)
    return user_data.get("email")


def optional_auth(request: Request) -> Optional[Dict[str, Any]]:
    """
    Dependency for optional authentication

    Args:
        request: FastAPI request object

    Returns:
        User data if authenticated, None if not
    """
    if hasattr(request.state, "authenticated") and request.state.authenticated:
        return request.state.user
    return None


# Token validation utilities

async def validate_bearer_token(credentials: HTTPAuthorizationCredentials = security) -> Dict[str, Any]:
    """
    FastAPI security dependency for bearer token validation

    Args:
        credentials: HTTP bearer credentials

    Returns:
        Dictionary containing user data

    Raises:
        HTTPException: If token is invalid or expired
    """
    try:
        user_data = stytch_service.verify_jwt_token(credentials.credentials)

        if not user_data.get("user_id"):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload"
            )

        return user_data

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Bearer token validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )


# Route decorators

def require_auth(func):
    """
    Decorator to require authentication for a route handler

    Usage:
        @require_auth
        async def protected_endpoint(request: Request):
            user = request.state.user
            return {"user_id": user["user_id"]}
    """
    async def wrapper(request: Request, *args, **kwargs):
        # Extract token and validate
        try:
            authorization = request.headers.get("Authorization")
            if not authorization or not authorization.startswith("Bearer "):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Bearer token required"
                )

            token = authorization.replace("Bearer ", "", 1)
            user_data = stytch_service.verify_jwt_token(token)

            # Inject user data into request
            request.state.user = user_data
            request.state.authenticated = True
            request.state.user_id = user_data.get("user_id")

            return await func(request, *args, **kwargs)

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Auth decorator error: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication failed"
            )

    return wrapper


def require_role(required_role: str):
    """
    Decorator to require specific role for a route handler

    Args:
        required_role: Role string that user must have

    Usage:
        @require_role("admin")
        async def admin_endpoint(request: Request):
            return {"message": "Admin access granted"}
    """
    def decorator(func):
        async def wrapper(request: Request, *args, **kwargs):
            # Ensure user is authenticated first
            user_data = get_current_user(request)

            # Check if user has required role
            user_roles = user_data.get("roles", [])
            if required_role not in user_roles:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Role '{required_role}' required"
                )

            return await func(request, *args, **kwargs)

        return wrapper
    return decorator


# Middleware configuration helper

def configure_auth_middleware(app, protected_paths: list = None) -> None:
    """
    Configure authentication middleware for FastAPI app

    Args:
        app: FastAPI application instance
        protected_paths: List of path prefixes requiring authentication
    """
    default_protected_paths = [
        "/api/v1/protected",
        "/api/v1/user",
        "/auth/me"
    ]

    middleware = AuthMiddleware(
        app,
        protected_paths=protected_paths or default_protected_paths
    )

    app.add_middleware(AuthMiddleware, protected_paths=protected_paths or default_protected_paths)
    logger.info("Authentication middleware configured")


# Error handlers

def auth_exception_handler(request: Request, exc: HTTPException):
    """
    Custom exception handler for authentication errors

    Args:
        request: FastAPI request object
        exc: HTTP exception

    Returns:
        JSON error response
    """
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.detail,
            "error_code": "AUTHENTICATION_ERROR",
            "path": str(request.url.path)
        }
    )