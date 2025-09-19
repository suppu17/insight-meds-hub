"""
Stytch Authentication Service

This module provides a comprehensive Stytch integration for the MedInsight app,
supporting multiple authentication methods including email/password, magic links,
OTP, and session management.
"""

import os
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta

import stytch
from stytch.models import OTPs, MagicLinks, Sessions, Passwords, Users
from pydantic import BaseModel, EmailStr
import jwt
from fastapi import HTTPException, status

# Configure logging
logger = logging.getLogger(__name__)

class StytchConfig(BaseModel):
    """Stytch configuration model"""
    project_id: str
    secret: str
    environment: str = "test"  # test or live
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    jwt_expiration_hours: int = 24

class StytchUser(BaseModel):
    """Stytch user model for internal use"""
    user_id: str
    email: EmailStr
    name: Optional[str] = None
    status: str
    created_at: datetime
    email_verified: bool = False
    phone_verified: bool = False

class StytchSession(BaseModel):
    """Stytch session model"""
    session_id: str
    user_id: str
    expires_at: datetime
    last_accessed_at: datetime
    session_duration_minutes: int

class StytchService:
    """
    Stytch Authentication Service

    Provides methods for user authentication, session management,
    and integration with Stytch's authentication platform.
    """

    def __init__(self):
        """Initialize Stytch service with configuration"""
        self.config = self._load_config()
        self.client = self._create_client()

    def _load_config(self) -> StytchConfig:
        """Load configuration from environment variables"""
        try:
            return StytchConfig(
                project_id=os.getenv("STYTCH_PROJECT_ID", ""),
                secret=os.getenv("STYTCH_SECRET", ""),
                environment=os.getenv("STYTCH_ENVIRONMENT", "test"),
                jwt_secret_key=os.getenv("JWT_SECRET_KEY", "fallback-secret-key"),
                jwt_algorithm=os.getenv("JWT_ALGORITHM", "HS256"),
                jwt_expiration_hours=int(os.getenv("JWT_EXPIRATION_HOURS", "24"))
            )
        except Exception as e:
            logger.error(f"Failed to load Stytch configuration: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Authentication service configuration error"
            )

    def _create_client(self) -> stytch.Client:
        """Create and configure Stytch client"""
        try:
            return stytch.Client(
                project_id=self.config.project_id,
                secret=self.config.secret,
                environment=self.config.environment
            )
        except Exception as e:
            logger.error(f"Failed to create Stytch client: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Authentication service initialization error"
            )

    def _create_jwt_token(self, user_data: Dict[str, Any]) -> str:
        """Create JWT token for session management"""
        try:
            payload = {
                "user_id": user_data.get("user_id"),
                "email": user_data.get("email"),
                "exp": datetime.utcnow() + timedelta(hours=self.config.jwt_expiration_hours),
                "iat": datetime.utcnow(),
                "iss": "medinsight-app"
            }

            return jwt.encode(
                payload,
                self.config.jwt_secret_key,
                algorithm=self.config.jwt_algorithm
            )
        except Exception as e:
            logger.error(f"Failed to create JWT token: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Token generation failed"
            )

    def _decode_jwt_token(self, token: str) -> Dict[str, Any]:
        """Decode and verify JWT token"""
        try:
            payload = jwt.decode(
                token,
                self.config.jwt_secret_key,
                algorithms=[self.config.jwt_algorithm]
            )
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired"
            )
        except jwt.InvalidTokenError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )

    async def create_user_with_password(
        self,
        email: str,
        password: str,
        name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a new user with email and password

        Args:
            email: User's email address
            password: User's password
            name: Optional user's full name

        Returns:
            Dict containing user data and JWT token
        """
        try:
            # Create user with Stytch
            response = self.client.passwords.create(
                email=email,
                password=password,
                name=name or email.split("@")[0]
            )

            if response.status_code != 201:
                logger.error(f"Stytch user creation failed: {response.status_code}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to create user account"
                )

            # Extract user data
            user_data = {
                "user_id": response.user_id,
                "email": email,
                "name": name,
                "status": "pending_verification"
            }

            # Generate JWT token
            jwt_token = self._create_jwt_token(user_data)

            return {
                "success": True,
                "user": user_data,
                "token": jwt_token,
                "session_id": response.session_id if hasattr(response, 'session_id') else None
            }

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"User creation error: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create user account"
            )

    async def authenticate_password(
        self,
        email: str,
        password: str
    ) -> Dict[str, Any]:
        """
        Authenticate user with email and password

        Args:
            email: User's email address
            password: User's password

        Returns:
            Dict containing user data and JWT token
        """
        try:
            # Authenticate with Stytch
            response = self.client.passwords.authenticate(
                email=email,
                password=password
            )

            if response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid email or password"
                )

            # Extract user data
            user_data = {
                "user_id": response.user_id,
                "email": response.user.emails[0].email if response.user.emails else email,
                "name": response.user.name or None,
                "status": "active"
            }

            # Generate JWT token
            jwt_token = self._create_jwt_token(user_data)

            return {
                "success": True,
                "user": user_data,
                "token": jwt_token,
                "session_id": response.session_id
            }

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Authentication error: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication failed"
            )

    async def send_magic_link(self, email: str) -> Dict[str, Any]:
        """
        Send magic link for passwordless authentication

        Args:
            email: User's email address

        Returns:
            Dict containing success status and email details
        """
        try:
            response = self.client.magic_links.email.login_or_create(
                email=email,
                login_magic_link_url="http://localhost:3000/auth/magic-link",
                signup_magic_link_url="http://localhost:3000/auth/magic-link"
            )

            if response.status_code not in [200, 201]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to send magic link"
                )

            return {
                "success": True,
                "email": email,
                "message": "Magic link sent successfully"
            }

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Magic link error: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to send magic link"
            )

    async def authenticate_magic_link(self, token: str) -> Dict[str, Any]:
        """
        Authenticate user via magic link token

        Args:
            token: Magic link token from URL

        Returns:
            Dict containing user data and JWT token
        """
        try:
            response = self.client.magic_links.authenticate(
                magic_links_token=token
            )

            if response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid or expired magic link"
                )

            # Extract user data
            user_data = {
                "user_id": response.user_id,
                "email": response.user.emails[0].email if response.user.emails else "",
                "name": response.user.name or None,
                "status": "active"
            }

            # Generate JWT token
            jwt_token = self._create_jwt_token(user_data)

            return {
                "success": True,
                "user": user_data,
                "token": jwt_token,
                "session_id": response.session_id
            }

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Magic link authentication error: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Magic link authentication failed"
            )

    async def send_otp(self, email: str) -> Dict[str, Any]:
        """
        Send OTP to user's email

        Args:
            email: User's email address

        Returns:
            Dict containing success status and method ID
        """
        try:
            response = self.client.otps.email.login_or_create(
                email=email
            )

            if response.status_code not in [200, 201]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to send OTP"
                )

            return {
                "success": True,
                "email": email,
                "method_id": response.method_id,
                "message": "OTP sent successfully"
            }

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"OTP sending error: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to send OTP"
            )

    async def verify_otp(self, method_id: str, code: str) -> Dict[str, Any]:
        """
        Verify OTP code

        Args:
            method_id: Method ID from send_otp response
            code: OTP code entered by user

        Returns:
            Dict containing user data and JWT token
        """
        try:
            response = self.client.otps.authenticate(
                method_id=method_id,
                code=code
            )

            if response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid OTP code"
                )

            # Extract user data
            user_data = {
                "user_id": response.user_id,
                "email": response.user.emails[0].email if response.user.emails else "",
                "name": response.user.name or None,
                "status": "active"
            }

            # Generate JWT token
            jwt_token = self._create_jwt_token(user_data)

            return {
                "success": True,
                "user": user_data,
                "token": jwt_token,
                "session_id": response.session_id
            }

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"OTP verification error: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="OTP verification failed"
            )

    async def get_user_profile(self, user_id: str) -> Dict[str, Any]:
        """
        Get user profile information

        Args:
            user_id: Stytch user ID

        Returns:
            Dict containing user profile data
        """
        try:
            response = self.client.users.get(user_id=user_id)

            if response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found"
                )

            user_data = {
                "user_id": response.user.user_id,
                "email": response.user.emails[0].email if response.user.emails else "",
                "name": response.user.name or None,
                "status": response.user.status,
                "created_at": response.user.created_at,
                "email_verified": len([e for e in response.user.emails if e.verified]) > 0
            }

            return {
                "success": True,
                "user": user_data
            }

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Profile fetch error: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to fetch user profile"
            )

    async def revoke_session(self, session_id: str) -> Dict[str, Any]:
        """
        Revoke a user session

        Args:
            session_id: Stytch session ID to revoke

        Returns:
            Dict containing success status
        """
        try:
            response = self.client.sessions.revoke(session_id=session_id)

            return {
                "success": True,
                "message": "Session revoked successfully"
            }

        except Exception as e:
            logger.error(f"Session revocation error: {e}")
            # Don't raise exception for logout failures
            return {
                "success": True,
                "message": "Logout completed"
            }

    def verify_jwt_token(self, token: str) -> Dict[str, Any]:
        """
        Verify JWT token and return user data

        Args:
            token: JWT token to verify

        Returns:
            Dict containing decoded user data
        """
        return self._decode_jwt_token(token)

# Singleton instance
stytch_service = StytchService()