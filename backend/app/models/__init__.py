"""
Data Models Module

Pydantic models for API requests, responses, and data validation.
"""

from .auth import (
    LoginRequest,
    SignupRequest,
    MagicLinkRequest,
    MagicLinkVerifyRequest,
    OTPRequest,
    OTPVerifyRequest,
    LogoutRequest,
    TokenValidationRequest,
    RefreshTokenRequest,
    UserProfile,
    AuthResponse,
    ErrorResponse,
    MagicLinkResponse,
    OTPResponse,
    LogoutResponse,
    TokenValidationResponse
)

__all__ = [
    "LoginRequest",
    "SignupRequest",
    "MagicLinkRequest",
    "MagicLinkVerifyRequest",
    "OTPRequest",
    "OTPVerifyRequest",
    "LogoutRequest",
    "TokenValidationRequest",
    "RefreshTokenRequest",
    "UserProfile",
    "AuthResponse",
    "ErrorResponse",
    "MagicLinkResponse",
    "OTPResponse",
    "LogoutResponse",
    "TokenValidationResponse"
]