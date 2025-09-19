"""
Authentication API Endpoints

FastAPI routes for Stytch authentication integration including
password auth, magic links, OTP, and session management.
"""

import logging
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, status, Depends, Header
from fastapi.responses import JSONResponse

from app.models.auth import (
    LoginRequest, SignupRequest, MagicLinkRequest, MagicLinkVerifyRequest,
    OTPRequest, OTPVerifyRequest, LogoutRequest, TokenValidationRequest,
    AuthResponse, ErrorResponse, MagicLinkResponse, OTPResponse,
    LogoutResponse, TokenValidationResponse, UserProfile
)
from app.services.stytch_service import stytch_service

# Configure logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/auth", tags=["authentication"])


def get_auth_token(authorization: str = Header(None)) -> str:
    """Extract JWT token from Authorization header"""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing"
        )

    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format"
        )

    return authorization.replace("Bearer ", "", 1)


@router.post("/signup",
            response_model=AuthResponse,
            responses={
                201: {"model": AuthResponse, "description": "User created successfully"},
                400: {"model": ErrorResponse, "description": "Invalid input or user exists"},
                500: {"model": ErrorResponse, "description": "Internal server error"}
            },
            summary="Create new user account",
            description="Register a new user with email and password using Stytch authentication")
async def signup(signup_data: SignupRequest) -> AuthResponse:
    """
    Create a new user account with email and password.

    - **email**: Valid email address (will be used for login)
    - **password**: Strong password (min 8 chars, uppercase, lowercase, number)
    - **name**: Optional full name for the user

    Returns user profile and JWT token for immediate authentication.
    """
    try:
        logger.info(f"Signup attempt for email: {signup_data.email}")

        result = await stytch_service.create_user_with_password(
            email=signup_data.email,
            password=signup_data.password,
            name=signup_data.name
        )

        if result["success"]:
            logger.info(f"Signup successful for user: {result['user']['user_id']}")
            return AuthResponse(
                success=True,
                message="Account created successfully",
                user=UserProfile(**result["user"]),
                token=result["token"],
                session_id=result.get("session_id")
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create account"
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Signup error for {signup_data.email}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Account creation failed"
        )


@router.post("/login",
            response_model=AuthResponse,
            responses={
                200: {"model": AuthResponse, "description": "Login successful"},
                401: {"model": ErrorResponse, "description": "Invalid credentials"},
                500: {"model": ErrorResponse, "description": "Internal server error"}
            },
            summary="Authenticate user with password",
            description="Login user with email and password using Stytch authentication")
async def login(login_data: LoginRequest) -> AuthResponse:
    """
    Authenticate user with email and password.

    - **email**: User's registered email address
    - **password**: User's password
    - **remember_me**: Optional flag to extend session duration

    Returns user profile and JWT token for authenticated sessions.
    """
    try:
        logger.info(f"Login attempt for email: {login_data.email}")

        result = await stytch_service.authenticate_password(
            email=login_data.email,
            password=login_data.password
        )

        if result["success"]:
            logger.info(f"Login successful for user: {result['user']['user_id']}")
            return AuthResponse(
                success=True,
                message="Login successful",
                user=UserProfile(**result["user"]),
                token=result["token"],
                session_id=result.get("session_id")
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error for {login_data.email}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed"
        )


@router.post("/magic-link/send",
            response_model=MagicLinkResponse,
            responses={
                200: {"model": MagicLinkResponse, "description": "Magic link sent"},
                400: {"model": ErrorResponse, "description": "Invalid email or send failed"},
                500: {"model": ErrorResponse, "description": "Internal server error"}
            },
            summary="Send magic link for passwordless login",
            description="Send a magic link to user's email for passwordless authentication")
async def send_magic_link(magic_link_data: MagicLinkRequest) -> MagicLinkResponse:
    """
    Send magic link to user's email for passwordless authentication.

    - **email**: User's email address

    User will receive an email with a secure link to complete authentication.
    """
    try:
        logger.info(f"Magic link request for email: {magic_link_data.email}")

        result = await stytch_service.send_magic_link(magic_link_data.email)

        if result["success"]:
            logger.info(f"Magic link sent to: {magic_link_data.email}")
            return MagicLinkResponse(
                success=True,
                message=result["message"],
                email=result["email"]
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to send magic link"
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Magic link error for {magic_link_data.email}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Magic link send failed"
        )


@router.post("/magic-link/verify",
            response_model=AuthResponse,
            responses={
                200: {"model": AuthResponse, "description": "Magic link verified"},
                401: {"model": ErrorResponse, "description": "Invalid or expired magic link"},
                500: {"model": ErrorResponse, "description": "Internal server error"}
            },
            summary="Verify magic link token",
            description="Complete authentication using magic link token from email")
async def verify_magic_link(verify_data: MagicLinkVerifyRequest) -> AuthResponse:
    """
    Verify magic link token and authenticate user.

    - **token**: Magic link token from email URL

    Returns user profile and JWT token upon successful verification.
    """
    try:
        logger.info("Magic link verification attempt")

        result = await stytch_service.authenticate_magic_link(verify_data.token)

        if result["success"]:
            logger.info(f"Magic link verified for user: {result['user']['user_id']}")
            return AuthResponse(
                success=True,
                message="Magic link authentication successful",
                user=UserProfile(**result["user"]),
                token=result["token"],
                session_id=result.get("session_id")
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired magic link"
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Magic link verification error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Magic link verification failed"
        )


@router.post("/otp/send",
            response_model=OTPResponse,
            responses={
                200: {"model": OTPResponse, "description": "OTP sent successfully"},
                400: {"model": ErrorResponse, "description": "Invalid email or send failed"},
                500: {"model": ErrorResponse, "description": "Internal server error"}
            },
            summary="Send OTP code to email",
            description="Send a one-time password to user's email for authentication")
async def send_otp(otp_data: OTPRequest) -> OTPResponse:
    """
    Send OTP code to user's email for authentication.

    - **email**: User's email address

    Returns method_id needed for OTP verification.
    """
    try:
        logger.info(f"OTP request for email: {otp_data.email}")

        result = await stytch_service.send_otp(otp_data.email)

        if result["success"]:
            logger.info(f"OTP sent to: {otp_data.email}")
            return OTPResponse(
                success=True,
                message=result["message"],
                email=result["email"],
                method_id=result["method_id"]
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to send OTP"
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"OTP send error for {otp_data.email}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="OTP send failed"
        )


@router.post("/otp/verify",
            response_model=AuthResponse,
            responses={
                200: {"model": AuthResponse, "description": "OTP verified successfully"},
                401: {"model": ErrorResponse, "description": "Invalid OTP code"},
                500: {"model": ErrorResponse, "description": "Internal server error"}
            },
            summary="Verify OTP code",
            description="Verify OTP code and complete authentication")
async def verify_otp(verify_data: OTPVerifyRequest) -> AuthResponse:
    """
    Verify OTP code and authenticate user.

    - **method_id**: Method ID from send OTP response
    - **code**: OTP code from email

    Returns user profile and JWT token upon successful verification.
    """
    try:
        logger.info(f"OTP verification attempt for method: {verify_data.method_id}")

        result = await stytch_service.verify_otp(
            method_id=verify_data.method_id,
            code=verify_data.code
        )

        if result["success"]:
            logger.info(f"OTP verified for user: {result['user']['user_id']}")
            return AuthResponse(
                success=True,
                message="OTP verification successful",
                user=UserProfile(**result["user"]),
                token=result["token"],
                session_id=result.get("session_id")
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid OTP code"
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"OTP verification error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="OTP verification failed"
        )


@router.post("/logout",
            response_model=LogoutResponse,
            responses={
                200: {"model": LogoutResponse, "description": "Logout successful"},
                500: {"model": ErrorResponse, "description": "Internal server error"}
            },
            summary="Logout user and revoke session",
            description="Revoke user session and invalidate authentication")
async def logout(logout_data: LogoutRequest = None) -> LogoutResponse:
    """
    Logout user and revoke active session.

    - **session_id**: Optional Stytch session ID to revoke

    Always returns success for security reasons.
    """
    try:
        session_id = logout_data.session_id if logout_data else None
        logger.info(f"Logout request for session: {session_id}")

        if session_id:
            result = await stytch_service.revoke_session(session_id)
            logger.info(f"Session {session_id} revoked")
        else:
            logger.info("Logout without session ID")

        return LogoutResponse(
            success=True,
            message="Logout successful"
        )

    except Exception as e:
        logger.error(f"Logout error: {e}")
        # Always return success for logout for security reasons
        return LogoutResponse(
            success=True,
            message="Logout completed"
        )


@router.get("/me",
           response_model=UserProfile,
           responses={
               200: {"model": UserProfile, "description": "User profile retrieved"},
               401: {"model": ErrorResponse, "description": "Invalid or expired token"},
               404: {"model": ErrorResponse, "description": "User not found"},
               500: {"model": ErrorResponse, "description": "Internal server error"}
           },
           summary="Get current user profile",
           description="Get authenticated user's profile information")
async def get_current_user(token: str = Depends(get_auth_token)) -> UserProfile:
    """
    Get current authenticated user's profile.

    Requires valid JWT token in Authorization header:
    Authorization: Bearer <your_jwt_token>

    Returns user profile information.
    """
    try:
        # Verify JWT token and extract user data
        token_data = stytch_service.verify_jwt_token(token)
        user_id = token_data.get("user_id")

        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload"
            )

        logger.info(f"Profile request for user: {user_id}")

        # Get user profile from Stytch
        result = await stytch_service.get_user_profile(user_id)

        if result["success"]:
            logger.info(f"Profile retrieved for user: {user_id}")
            return UserProfile(**result["user"])
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Profile retrieval error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve profile"
        )


@router.post("/validate-token",
            response_model=TokenValidationResponse,
            responses={
                200: {"model": TokenValidationResponse, "description": "Token validation result"},
                500: {"model": ErrorResponse, "description": "Internal server error"}
            },
            summary="Validate JWT token",
            description="Validate JWT token and return user information if valid")
async def validate_token(token_data: TokenValidationRequest) -> TokenValidationResponse:
    """
    Validate JWT token and return user information.

    - **token**: JWT token to validate

    Returns validation result with user data if token is valid.
    """
    try:
        logger.info("Token validation request")

        # Verify JWT token
        payload = stytch_service.verify_jwt_token(token_data.token)

        logger.info(f"Token validated for user: {payload.get('user_id')}")
        return TokenValidationResponse(
            valid=True,
            user_id=payload.get("user_id"),
            email=payload.get("email"),
            expires_at=payload.get("exp"),
            error=None
        )

    except HTTPException as e:
        logger.warning(f"Token validation failed: {e.detail}")
        return TokenValidationResponse(
            valid=False,
            user_id=None,
            email=None,
            expires_at=None,
            error=e.detail
        )
    except Exception as e:
        logger.error(f"Token validation error: {e}")
        return TokenValidationResponse(
            valid=False,
            user_id=None,
            email=None,
            expires_at=None,
            error="Token validation failed"
        )


# Health check endpoint
@router.get("/health",
           summary="Authentication service health check",
           description="Check if authentication service is running properly")
async def auth_health_check() -> Dict[str, Any]:
    """
    Health check for authentication service.

    Returns service status and configuration info.
    """
    try:
        # Basic health check - verify service is initialized
        config_status = "configured" if stytch_service.config.project_id else "not_configured"

        return {
            "status": "healthy",
            "service": "stytch_authentication",
            "config_status": config_status,
            "endpoints": {
                "signup": "/auth/signup",
                "login": "/auth/login",
                "magic_link": "/auth/magic-link/*",
                "otp": "/auth/otp/*",
                "logout": "/auth/logout",
                "profile": "/auth/me",
                "validate": "/auth/validate-token"
            }
        }

    except Exception as e:
        logger.error(f"Auth health check failed: {e}")
        return {
            "status": "unhealthy",
            "service": "stytch_authentication",
            "error": str(e)
        }