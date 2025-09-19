"""
Authentication Models

Pydantic models for authentication requests and responses used
with the Stytch authentication service integration.
"""

from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, EmailStr, Field, validator
import re


class LoginRequest(BaseModel):
    """Login request model for password authentication"""
    email: EmailStr = Field(..., description="User's email address")
    password: str = Field(..., min_length=8, description="User's password")
    remember_me: bool = Field(default=False, description="Remember user session")

    class Config:
        schema_extra = {
            "example": {
                "email": "user@example.com",
                "password": "securePassword123",
                "remember_me": True
            }
        }


class SignupRequest(BaseModel):
    """Signup request model for new user registration"""
    email: EmailStr = Field(..., description="User's email address")
    password: str = Field(..., min_length=8, description="User's password")
    name: Optional[str] = Field(None, min_length=1, max_length=100, description="User's full name")

    @validator('password')
    def validate_password(cls, v):
        """Validate password strength"""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one number')
        return v

    @validator('name')
    def validate_name(cls, v):
        """Validate name format"""
        if v and not v.strip():
            raise ValueError('Name cannot be empty or just whitespace')
        return v.strip() if v else None

    class Config:
        schema_extra = {
            "example": {
                "email": "newuser@example.com",
                "password": "SecurePass123",
                "name": "John Doe"
            }
        }


class MagicLinkRequest(BaseModel):
    """Magic link request model"""
    email: EmailStr = Field(..., description="User's email address")

    class Config:
        schema_extra = {
            "example": {
                "email": "user@example.com"
            }
        }


class MagicLinkVerifyRequest(BaseModel):
    """Magic link verification request model"""
    token: str = Field(..., min_length=1, description="Magic link token from email")

    class Config:
        schema_extra = {
            "example": {
                "token": "DOYoip3rvIMMW5lgItikFK-Ak1CfMsgjuiCyI7uuU94="
            }
        }


class OTPRequest(BaseModel):
    """OTP request model"""
    email: EmailStr = Field(..., description="User's email address")

    class Config:
        schema_extra = {
            "example": {
                "email": "user@example.com"
            }
        }


class OTPVerifyRequest(BaseModel):
    """OTP verification request model"""
    method_id: str = Field(..., min_length=1, description="Method ID from OTP send response")
    code: str = Field(..., min_length=4, max_length=10, description="OTP code")

    @validator('code')
    def validate_otp_code(cls, v):
        """Validate OTP code format"""
        if not v.isdigit():
            raise ValueError('OTP code must contain only digits')
        return v

    class Config:
        schema_extra = {
            "example": {
                "method_id": "otp-test-81bf03a8-86e1-4d95-bd44-bb3495681ba8",
                "code": "123456"
            }
        }


class UserProfile(BaseModel):
    """User profile model"""
    user_id: str = Field(..., description="Stytch user ID")
    email: str = Field(..., description="User's email address")
    name: Optional[str] = Field(None, description="User's full name")
    status: str = Field(..., description="User account status")
    created_at: datetime = Field(..., description="Account creation timestamp")
    email_verified: bool = Field(default=False, description="Email verification status")
    phone_verified: bool = Field(default=False, description="Phone verification status")

    class Config:
        schema_extra = {
            "example": {
                "user_id": "user-test-16d9ba61-97a1-4ba4-9720-b03761dc50c6",
                "email": "user@example.com",
                "name": "John Doe",
                "status": "active",
                "created_at": "2024-01-01T00:00:00Z",
                "email_verified": True,
                "phone_verified": False
            }
        }


class AuthResponse(BaseModel):
    """Standard authentication response model"""
    success: bool = Field(..., description="Whether the authentication was successful")
    message: Optional[str] = Field(None, description="Response message")
    user: Optional[UserProfile] = Field(None, description="User profile data")
    token: Optional[str] = Field(None, description="JWT authentication token")
    session_id: Optional[str] = Field(None, description="Stytch session ID")
    expires_at: Optional[datetime] = Field(None, description="Token expiration time")

    class Config:
        schema_extra = {
            "example": {
                "success": True,
                "message": "Authentication successful",
                "user": {
                    "user_id": "user-test-16d9ba61-97a1-4ba4-9720-b03761dc50c6",
                    "email": "user@example.com",
                    "name": "John Doe",
                    "status": "active",
                    "created_at": "2024-01-01T00:00:00Z",
                    "email_verified": True,
                    "phone_verified": False
                },
                "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "session_id": "session-test-fe6c3f7a-36b2-4a04-8c13-19d8974bfe39",
                "expires_at": "2024-01-02T00:00:00Z"
            }
        }


class ErrorResponse(BaseModel):
    """Error response model"""
    success: bool = Field(default=False, description="Always false for error responses")
    message: str = Field(..., description="Error message")
    error_code: Optional[str] = Field(None, description="Specific error code")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional error details")

    class Config:
        schema_extra = {
            "example": {
                "success": False,
                "message": "Invalid email or password",
                "error_code": "INVALID_CREDENTIALS",
                "details": {
                    "field": "password",
                    "reason": "Password does not match"
                }
            }
        }


class MagicLinkResponse(BaseModel):
    """Magic link response model"""
    success: bool = Field(..., description="Whether the magic link was sent successfully")
    message: str = Field(..., description="Response message")
    email: str = Field(..., description="Email address where magic link was sent")

    class Config:
        schema_extra = {
            "example": {
                "success": True,
                "message": "Magic link sent successfully",
                "email": "user@example.com"
            }
        }


class OTPResponse(BaseModel):
    """OTP response model"""
    success: bool = Field(..., description="Whether the OTP was sent successfully")
    message: str = Field(..., description="Response message")
    email: str = Field(..., description="Email address where OTP was sent")
    method_id: str = Field(..., description="Method ID for OTP verification")

    class Config:
        schema_extra = {
            "example": {
                "success": True,
                "message": "OTP sent successfully",
                "email": "user@example.com",
                "method_id": "otp-test-81bf03a8-86e1-4d95-bd44-bb3495681ba8"
            }
        }


class LogoutRequest(BaseModel):
    """Logout request model"""
    session_id: Optional[str] = Field(None, description="Stytch session ID to revoke")

    class Config:
        schema_extra = {
            "example": {
                "session_id": "session-test-fe6c3f7a-36b2-4a04-8c13-19d8974bfe39"
            }
        }


class LogoutResponse(BaseModel):
    """Logout response model"""
    success: bool = Field(..., description="Whether logout was successful")
    message: str = Field(..., description="Response message")

    class Config:
        schema_extra = {
            "example": {
                "success": True,
                "message": "Logout successful"
            }
        }


class TokenValidationRequest(BaseModel):
    """Token validation request model"""
    token: str = Field(..., min_length=1, description="JWT token to validate")

    class Config:
        schema_extra = {
            "example": {
                "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            }
        }


class TokenValidationResponse(BaseModel):
    """Token validation response model"""
    valid: bool = Field(..., description="Whether the token is valid")
    user_id: Optional[str] = Field(None, description="User ID from valid token")
    email: Optional[str] = Field(None, description="Email from valid token")
    expires_at: Optional[datetime] = Field(None, description="Token expiration time")
    error: Optional[str] = Field(None, description="Error message if invalid")

    class Config:
        schema_extra = {
            "example": {
                "valid": True,
                "user_id": "user-test-16d9ba61-97a1-4ba4-9720-b03761dc50c6",
                "email": "user@example.com",
                "expires_at": "2024-01-02T00:00:00Z",
                "error": None
            }
        }


class RefreshTokenRequest(BaseModel):
    """Refresh token request model"""
    refresh_token: Optional[str] = Field(None, description="Refresh token (if implemented)")

    class Config:
        schema_extra = {
            "example": {
                "refresh_token": "refresh_token_here"
            }
        }