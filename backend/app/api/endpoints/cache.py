"""
Cache API endpoints for session management and analysis result caching
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any, Optional
import logging
from datetime import datetime

from app.services.redis_service import redis_service

logger = logging.getLogger(__name__)

router = APIRouter()

# Request/Response Models
class SessionCacheRequest(BaseModel):
    session_data: Dict[str, Any]
    ttl: int = 1800  # 30 minutes default

class AnalysisProgressRequest(BaseModel):
    progress_data: Dict[str, Any]
    ttl: int = 300  # 5 minutes default

class AnalysisResultRequest(BaseModel):
    result_data: Dict[str, Any]
    ttl: int = 7200  # 2 hours default

class CacheResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None

@router.post("/session/{session_id}", response_model=CacheResponse)
async def cache_session_data(session_id: str, request: SessionCacheRequest):
    """Cache user session data with Redis backend"""
    try:
        success = redis_service.cache_session_state(session_id, request.session_data)

        if success:
            logger.info(f"✅ Session data cached successfully: {session_id}")
            return CacheResponse(
                success=True,
                message=f"Session {session_id} cached successfully"
            )
        else:
            raise HTTPException(status_code=500, detail="Failed to cache session data")

    except Exception as e:
        logger.error(f"❌ Failed to cache session data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/session/{session_id}", response_model=CacheResponse)
async def get_session_data(session_id: str):
    """Retrieve cached session data"""
    try:
        session_data = redis_service.get_session_state(session_id)

        if session_data:
            logger.info(f"📦 Session data retrieved: {session_id}")
            return CacheResponse(
                success=True,
                message="Session data retrieved successfully",
                data={"session_data": session_data}
            )
        else:
            # Not an error - session might not exist or expired
            return CacheResponse(
                success=False,
                message="Session not found or expired",
                data=None
            )

    except Exception as e:
        logger.error(f"❌ Failed to retrieve session data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/session/{session_id}", response_model=CacheResponse)
async def clear_session_data(session_id: str):
    """Clear cached session data"""
    try:
        success = redis_service.delete_cache("session_state", session_id)

        logger.info(f"🗑️ Session data cleared: {session_id}")
        return CacheResponse(
            success=True,
            message=f"Session {session_id} cleared successfully"
        )

    except Exception as e:
        logger.error(f"❌ Failed to clear session data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analysis-progress/{analysis_id}", response_model=CacheResponse)
async def cache_analysis_progress(analysis_id: str, request: AnalysisProgressRequest):
    """Cache real-time analysis progress for live updates"""
    try:
        success = redis_service.cache_analysis_progress(analysis_id, request.progress_data)

        if success:
            logger.info(f"📊 Analysis progress cached: {analysis_id}")
            return CacheResponse(
                success=True,
                message=f"Analysis progress {analysis_id} cached successfully"
            )
        else:
            raise HTTPException(status_code=500, detail="Failed to cache analysis progress")

    except Exception as e:
        logger.error(f"❌ Failed to cache analysis progress: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analysis-progress/{analysis_id}", response_model=CacheResponse)
async def get_analysis_progress(analysis_id: str):
    """Retrieve cached analysis progress"""
    try:
        progress_data = redis_service.get_analysis_progress(analysis_id)

        if progress_data:
            logger.info(f"📈 Analysis progress retrieved: {analysis_id}")
            return CacheResponse(
                success=True,
                message="Analysis progress retrieved successfully",
                data={"progress_data": progress_data}
            )
        else:
            return CacheResponse(
                success=False,
                message="Analysis progress not found or expired",
                data=None
            )

    except Exception as e:
        logger.error(f"❌ Failed to retrieve analysis progress: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analysis-result/{drug_name}", response_model=CacheResponse)
async def cache_analysis_result(drug_name: str, request: AnalysisResultRequest):
    """Cache comprehensive analysis results to avoid recomputation"""
    try:
        # Normalize drug name for consistent caching
        normalized_name = drug_name.lower().replace(" ", "_")

        success = redis_service.set_cache(
            "analysis_results",
            normalized_name,
            request.result_data,
            ttl=request.ttl
        )

        if success:
            logger.info(f"💾 Analysis result cached: {drug_name}")
            return CacheResponse(
                success=True,
                message=f"Analysis result for {drug_name} cached successfully"
            )
        else:
            raise HTTPException(status_code=500, detail="Failed to cache analysis result")

    except Exception as e:
        logger.error(f"❌ Failed to cache analysis result: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analysis-result/{drug_name}", response_model=CacheResponse)
async def get_cached_analysis_result(drug_name: str):
    """Retrieve cached analysis result"""
    try:
        normalized_name = drug_name.lower().replace(" ", "_")
        result_data = redis_service.get_cache("analysis_results", normalized_name)

        if result_data:
            logger.info(f"📦 Analysis result cache hit: {drug_name}")
            redis_service.increment_counter("performance", "analysis_cache", "hits")
            return CacheResponse(
                success=True,
                message="Cached analysis result retrieved successfully",
                data={"result_data": result_data}
            )
        else:
            redis_service.increment_counter("performance", "analysis_cache", "misses")
            return CacheResponse(
                success=False,
                message="Analysis result not found in cache",
                data=None
            )

    except Exception as e:
        logger.error(f"❌ Failed to retrieve cached analysis result: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health", response_model=Dict[str, Any])
async def get_cache_health():
    """Get comprehensive cache health status and statistics"""
    try:
        health_status = redis_service.get_health_status()
        cache_stats = redis_service.get_cache_statistics()

        return {
            "cache_health": health_status,
            "statistics": cache_stats,
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"❌ Failed to get cache health: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats", response_model=Dict[str, Any])
async def get_cache_statistics():
    """Get detailed cache usage statistics"""
    try:
        stats = redis_service.get_cache_statistics()

        # Add performance metrics
        performance_stats = {
            "ocr_cache_hits": redis_service.get_cache("performance", "ocr_cache_hits") or 0,
            "ocr_cache_misses": redis_service.get_cache("performance", "ocr_cache_misses") or 0,
            "analysis_cache_hits": redis_service.get_cache("performance", "analysis_cache_hits") or 0,
            "analysis_cache_misses": redis_service.get_cache("performance", "analysis_cache_misses") or 0
        }

        return {
            "cache_statistics": stats,
            "performance_metrics": performance_stats,
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"❌ Failed to get cache statistics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/warm-cache", response_model=CacheResponse)
async def warm_cache():
    """Warm cache with commonly accessed data"""
    try:
        # Warm medication cache
        redis_service.warm_medication_cache([
            "funicillin", "amoxicillin", "lisinopril", "metformin",
            "aspirin", "ibuprofen", "acetaminophen", "atorvastatin"
        ])

        logger.info("🔥 Cache warming completed")
        return CacheResponse(
            success=True,
            message="Cache warming completed successfully"
        )

    except Exception as e:
        logger.error(f"❌ Failed to warm cache: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/clear-all", response_model=CacheResponse)
async def clear_all_cache():
    """Clear all cached data (use with caution)"""
    try:
        patterns_to_clear = [
            "medinsight:session_state:*",
            "medinsight:analysis_progress:*",
            "medinsight:analysis_results:*",
            "medinsight:ocr_result:*"
        ]

        cleared_count = 0
        for pattern in patterns_to_clear:
            keys = redis_service.get_keys_by_pattern(pattern)
            for key in keys:
                category, identifier = key.split(":", 2)[1:3]
                redis_service.delete_cache(category, identifier)
                cleared_count += 1

        logger.info(f"🧹 Cache cleared: {cleared_count} keys removed")
        return CacheResponse(
            success=True,
            message=f"Cache cleared successfully - {cleared_count} keys removed"
        )

    except Exception as e:
        logger.error(f"❌ Failed to clear cache: {e}")
        raise HTTPException(status_code=500, detail=str(e))