import json
import redis
from typing import Any, Optional, Dict, List
from datetime import datetime, timedelta
import asyncio
import logging
from functools import wraps
import pickle
import hashlib
import ssl
import requests

from app.core.config import settings

logger = logging.getLogger(__name__)

class RedisService:
    """
    Redis caching service for MedInsight app with connection pooling,
    retry logic, and proper key naming conventions.
    """

    def __init__(self):
        self.redis_client = None
        self.connection_pool = None
        self._initialize_connection()

    def _initialize_connection(self):
        """Initialize Redis connection with Redis Cloud support."""
        try:
            # Determine connection parameters based on available configuration
            connection_config = self._get_redis_connection_config()

            # Create connection pool with optimized settings
            pool_kwargs = {
                "host": connection_config["host"],
                "port": connection_config["port"],
                "password": connection_config["password"],
                "db": settings.REDIS_DB,
                "decode_responses": settings.REDIS_DECODE_RESPONSES,
                "max_connections": settings.REDIS_MAX_CONNECTIONS,
                "retry_on_timeout": True,
                "socket_connect_timeout": settings.REDIS_CONNECTION_TIMEOUT,
                "socket_timeout": settings.REDIS_SOCKET_TIMEOUT,
                "health_check_interval": 30
            }

            # Add SSL configuration for Redis Cloud
            if connection_config.get("ssl"):
                pool_kwargs.update({
                    "ssl": True,
                    "ssl_cert_reqs": ssl.CERT_REQUIRED,
                    "ssl_check_hostname": True
                })

            self.connection_pool = redis.ConnectionPool(**pool_kwargs)
            self.redis_client = redis.Redis(connection_pool=self.connection_pool)

            # Test connection with retry logic
            self._test_connection()

            connection_type = "Redis Cloud" if connection_config.get("ssl") else "Local Redis"
            logger.info(f"{connection_type} connection established successfully to {connection_config['host']}:{connection_config['port']}")

        except redis.ConnectionError as e:
            logger.error(f"Failed to connect to Redis: {e}")
            self.redis_client = None
        except Exception as e:
            logger.error(f"Unexpected error connecting to Redis: {e}")
            self.redis_client = None

    def _get_redis_connection_config(self) -> Dict[str, Any]:
        """Get Redis connection configuration, prioritizing Redis Cloud if API key is available."""

        # If Redis API key is provided, configure for Redis Cloud
        if settings.REDIS_API_KEY and settings.REDIS_API_KEY != "your-redis-cloud-api-key":
            logger.info("Redis Cloud API key detected, attempting Redis Cloud connection")

            # For Redis Cloud, the API key often serves as the password
            # The host and port would typically be provided by Redis Cloud dashboard
            # For now, we'll use the API key as password with default cloud settings
            return {
                "host": settings.REDIS_CLOUD_HOST or self._get_redis_cloud_endpoint(),
                "port": settings.REDIS_CLOUD_PORT or 6379,  # Default Redis port
                "password": settings.REDIS_API_KEY,
                "ssl": settings.REDIS_CLOUD_SSL
            }

        # Fallback to local Redis configuration
        logger.info("Using local Redis configuration")
        return {
            "host": settings.REDIS_HOST,
            "port": settings.REDIS_PORT,
            "password": settings.REDIS_PASSWORD,
            "ssl": False
        }

    def _get_redis_cloud_endpoint(self) -> str:
        """Attempt to determine Redis Cloud endpoint. Fallback to localhost if not available."""
        # In a production setup, this would query Redis Cloud API with the API key
        # For now, return localhost as fallback (user should set REDIS_CLOUD_HOST in env)
        return settings.REDIS_HOST

    def _test_connection(self, max_attempts: int = 3) -> None:
        """Test Redis connection with retry logic."""
        for attempt in range(max_attempts):
            try:
                response = self.redis_client.ping()
                if response:
                    return
            except Exception as e:
                if attempt == max_attempts - 1:
                    raise redis.ConnectionError(f"Failed to connect after {max_attempts} attempts: {e}")
                logger.warning(f"Redis ping failed (attempt {attempt + 1}): {e}")
                import time
                time.sleep(2 ** attempt)  # Exponential backoff

    def _get_key(self, category: str, identifier: str, sub_key: str = None) -> str:
        """
        Generate standardized cache keys following naming convention:
        medinsight:[category]:[identifier]:[sub_key]
        """
        key_parts = ["medinsight", category, identifier]
        if sub_key:
            key_parts.append(sub_key)
        return ":".join(key_parts)

    def _retry_operation(self, operation, max_retries: int = 3, delay: float = 1.0):
        """Retry Redis operations with exponential backoff."""
        for attempt in range(max_retries):
            try:
                return operation()
            except redis.ConnectionError as e:
                if attempt == max_retries - 1:
                    logger.error(f"Redis operation failed after {max_retries} attempts: {e}")
                    raise
                logger.warning(f"Redis operation failed (attempt {attempt + 1}), retrying in {delay}s: {e}")
                asyncio.sleep(delay)
                delay *= 2  # Exponential backoff
                self._initialize_connection()  # Reinitialize connection

    def set_cache(self, category: str, identifier: str, data: Any, ttl: int, sub_key: str = None) -> bool:
        """
        Set cache data with automatic serialization and TTL.

        Args:
            category: Cache category (user, symptom, ai_summary, drug_analysis)
            identifier: Unique identifier (user_id, session_id, etc.)
            data: Data to cache (will be JSON serialized)
            ttl: Time to live in seconds
            sub_key: Optional sub-category
        """
        if not self.redis_client:
            logger.warning("Redis client not available, skipping cache set")
            return False

        try:
            def _set_operation():
                key = self._get_key(category, identifier, sub_key)
                serialized_data = json.dumps(data, default=str)
                return self.redis_client.setex(key, ttl, serialized_data)

            result = self._retry_operation(_set_operation)
            logger.debug(f"Cache set successful: {self._get_key(category, identifier, sub_key)}")
            return result

        except Exception as e:
            logger.error(f"Failed to set cache: {e}")
            return False

    def get_cache(self, category: str, identifier: str, sub_key: str = None) -> Optional[Any]:
        """
        Get cache data with automatic deserialization.

        Args:
            category: Cache category
            identifier: Unique identifier
            sub_key: Optional sub-category
        """
        if not self.redis_client:
            logger.warning("Redis client not available, skipping cache get")
            return None

        try:
            def _get_operation():
                key = self._get_key(category, identifier, sub_key)
                return self.redis_client.get(key)

            cached_data = self._retry_operation(_get_operation)

            if cached_data:
                try:
                    return json.loads(cached_data)
                except json.JSONDecodeError:
                    # Fallback to raw string if not JSON
                    return cached_data

            return None

        except Exception as e:
            logger.error(f"Failed to get cache: {e}")
            return None

    def delete_cache(self, category: str, identifier: str, sub_key: str = None) -> bool:
        """Delete cache entry."""
        if not self.redis_client:
            return False

        try:
            def _delete_operation():
                key = self._get_key(category, identifier, sub_key)
                return self.redis_client.delete(key)

            result = self._retry_operation(_delete_operation)
            return bool(result)

        except Exception as e:
            logger.error(f"Failed to delete cache: {e}")
            return False

    def increment_counter(self, category: str, identifier: str, sub_key: str = None, amount: int = 1) -> int:
        """Increment a counter in Redis."""
        if not self.redis_client:
            return 0

        try:
            def _incr_operation():
                key = self._get_key(category, identifier, sub_key)
                return self.redis_client.incr(key, amount)

            return self._retry_operation(_incr_operation)

        except Exception as e:
            logger.error(f"Failed to increment counter: {e}")
            return 0

    def get_keys_by_pattern(self, pattern: str) -> List[str]:
        """Get all keys matching a pattern."""
        if not self.redis_client:
            return []

        try:
            def _keys_operation():
                return self.redis_client.keys(pattern)

            return self._retry_operation(_keys_operation)

        except Exception as e:
            logger.error(f"Failed to get keys by pattern: {e}")
            return []

    # Specific caching methods for MedInsight app

    def cache_user_session(self, user_id: str, session_data: Dict[str, Any]) -> bool:
        """Cache user session data."""
        return self.set_cache(
            category="user",
            identifier=user_id,
            sub_key="session",
            data=session_data,
            ttl=settings.CACHE_TTL_USER_SESSION
        )

    def get_user_session(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user session data."""
        return self.get_cache("user", user_id, "session")

    def cache_symptom_input(self, session_id: str, symptoms: Dict[str, Any]) -> bool:
        """Cache user symptom inputs."""
        return self.set_cache(
            category="symptom",
            identifier=session_id,
            sub_key="inputs",
            data=symptoms,
            ttl=settings.CACHE_TTL_SYMPTOM_INPUT
        )

    def get_symptom_input(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get cached symptom inputs."""
        return self.get_cache("symptom", session_id, "inputs")

    def cache_ai_summary(self, analysis_id: str, summary: Dict[str, Any]) -> bool:
        """Cache AI-generated summaries."""
        return self.set_cache(
            category="ai_summary",
            identifier=analysis_id,
            data=summary,
            ttl=settings.CACHE_TTL_AI_SUMMARY
        )

    def get_ai_summary(self, analysis_id: str) -> Optional[Dict[str, Any]]:
        """Get cached AI summary."""
        return self.get_cache("ai_summary", analysis_id)

    def cache_drug_analysis(self, drug_name: str, analysis: Dict[str, Any]) -> bool:
        """Cache drug analysis results."""
        # Normalize drug name for consistent caching
        normalized_drug_name = drug_name.lower().replace(" ", "_")
        return self.set_cache(
            category="drug_analysis",
            identifier=normalized_drug_name,
            data=analysis,
            ttl=settings.CACHE_TTL_DRUG_ANALYSIS
        )

    def get_drug_analysis(self, drug_name: str) -> Optional[Dict[str, Any]]:
        """Get cached drug analysis."""
        normalized_drug_name = drug_name.lower().replace(" ", "_")
        return self.get_cache("drug_analysis", normalized_drug_name)

    def cache_user_preferences(self, user_id: str, preferences: Dict[str, Any]) -> bool:
        """Cache user preferences."""
        return self.set_cache(
            category="user",
            identifier=user_id,
            sub_key="preferences",
            data=preferences,
            ttl=settings.CACHE_TTL_USER_SESSION * 24  # 24 hours
        )

    def get_user_preferences(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user preferences."""
        return self.get_cache("user", user_id, "preferences")

    # Enhanced Medical OCR Caching Methods

    def cache_ocr_result(self, image_hash: str, ocr_result: Dict[str, Any]) -> bool:
        """Cache OCR processing results by image hash to avoid reprocessing."""
        return self.set_cache(
            category="ocr_result",
            identifier=image_hash,
            data=ocr_result,
            ttl=settings.CACHE_TTL_OCR_RESULTS
        )

    def get_ocr_result(self, image_hash: str) -> Optional[Dict[str, Any]]:
        """Get cached OCR result."""
        return self.get_cache("ocr_result", image_hash)

    def cache_fda_validation(self, medication_name: str, validation_result: Dict[str, Any]) -> bool:
        """Cache FDA medication validation results."""
        normalized_name = medication_name.lower().replace(" ", "_")
        return self.set_cache(
            category="fda_validation",
            identifier=normalized_name,
            data=validation_result,
            ttl=settings.CACHE_TTL_FDA_VALIDATION
        )

    def get_fda_validation(self, medication_name: str) -> Optional[Dict[str, Any]]:
        """Get cached FDA validation result."""
        normalized_name = medication_name.lower().replace(" ", "_")
        return self.get_cache("fda_validation", normalized_name)

    def cache_medication_info(self, medication_name: str, medication_data: Dict[str, Any]) -> bool:
        """Cache comprehensive medication information."""
        normalized_name = medication_name.lower().replace(" ", "_")
        return self.set_cache(
            category="medication_info",
            identifier=normalized_name,
            data=medication_data,
            ttl=settings.CACHE_TTL_MEDICATION_INFO
        )

    def get_medication_info(self, medication_name: str) -> Optional[Dict[str, Any]]:
        """Get cached medication information."""
        normalized_name = medication_name.lower().replace(" ", "_")
        return self.get_cache("medication_info", normalized_name)

    def cache_session_state(self, session_id: str, state_data: Dict[str, Any]) -> bool:
        """Cache frontend session state for persistence across page refreshes."""
        return self.set_cache(
            category="session_state",
            identifier=session_id,
            data=state_data,
            ttl=settings.CACHE_TTL_SESSION_STATE
        )

    def get_session_state(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get cached session state."""
        return self.get_cache("session_state", session_id)

    def cache_analysis_progress(self, analysis_id: str, progress_data: Dict[str, Any]) -> bool:
        """Cache real-time analysis progress for live updates."""
        return self.set_cache(
            category="analysis_progress",
            identifier=analysis_id,
            data=progress_data,
            ttl=settings.CACHE_TTL_ANALYSIS_PROGRESS
        )

    def get_analysis_progress(self, analysis_id: str) -> Optional[Dict[str, Any]]:
        """Get analysis progress."""
        return self.get_cache("analysis_progress", analysis_id)

    def generate_image_hash(self, image_data: bytes) -> str:
        """Generate hash for image data to use as cache key."""
        return hashlib.sha256(image_data).hexdigest()[:16]  # Use first 16 chars for shorter key

    def warm_medication_cache(self, common_medications: List[str]) -> None:
        """Warm cache with common medications to improve response times."""
        if not self.redis_client:
            return

        for medication in common_medications:
            # Check if already cached
            cached = self.get_medication_info(medication)
            if not cached:
                # This would be filled in by actual medication lookup logic
                logger.info(f"Medication cache warming needed for: {medication}")

    def get_cache_statistics(self) -> Dict[str, Any]:
        """Get comprehensive cache usage statistics."""
        if not self.redis_client:
            return {"error": "Redis not available"}

        try:
            # Get all keys with pattern analysis
            patterns = [
                "medinsight:ocr_result:*",
                "medinsight:fda_validation:*",
                "medinsight:medication_info:*",
                "medinsight:session_state:*",
                "medinsight:analysis_progress:*",
                "medinsight:health_analysis:*",
                "medinsight:drug_analysis:*"
            ]

            stats = {}
            for pattern in patterns:
                category = pattern.split(":")[1]
                keys = self.get_keys_by_pattern(pattern)
                stats[category] = {
                    "count": len(keys),
                    "sample_keys": keys[:5] if keys else []
                }

            return {
                "cache_categories": stats,
                "total_keys": sum(cat["count"] for cat in stats.values()),
                "memory_usage": self.redis_client.info().get("used_memory_human", "unknown")
            }

        except Exception as e:
            return {"error": f"Failed to get cache stats: {e}"}

    def get_health_status(self) -> Dict[str, Any]:
        """Get comprehensive Redis health status."""
        if not self.redis_client:
            return {"status": "disconnected", "error": "Redis client not initialized"}

        try:
            info = self.redis_client.info()
            cache_stats = self.get_cache_statistics()

            return {
                "status": "connected",
                "version": info.get("redis_version"),
                "connected_clients": info.get("connected_clients"),
                "used_memory": info.get("used_memory_human"),
                "keyspace": info.get("keyspace", {}),
                "cache_statistics": cache_stats,
                "connection_pool_stats": {
                    "created_connections": getattr(self.connection_pool, "created_connections", 0),
                    "available_connections": getattr(self.connection_pool, "available_connections", 0)
                }
            }
        except Exception as e:
            return {"status": "error", "error": str(e)}

# Global Redis service instance
redis_service = RedisService()

def cached(category: str, ttl: int, key_func=None):
    """
    Decorator for caching function results.

    Args:
        category: Cache category
        ttl: Time to live in seconds
        key_func: Function to generate cache key from function args
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            if key_func:
                cache_key = key_func(*args, **kwargs)
            else:
                # Generate key from function name and args
                cache_key = f"{func.__name__}_{hash(str(args) + str(kwargs))}"

            # Try to get from cache first
            cached_result = redis_service.get_cache(category, cache_key)
            if cached_result is not None:
                logger.debug(f"Cache hit for {category}:{cache_key}")
                return cached_result

            # Execute function and cache result
            result = await func(*args, **kwargs)
            redis_service.set_cache(category, cache_key, result, ttl)
            logger.debug(f"Cache miss for {category}:{cache_key}, result cached")

            return result
        return wrapper
    return decorator