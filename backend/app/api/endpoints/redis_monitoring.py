from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
import json
from datetime import datetime

from app.services.redis_service import redis_service

router = APIRouter()

@router.get("/redis/health")
async def get_redis_health():
    """Get Redis connection and health status"""
    try:
        health_status = redis_service.get_health_status()
        return {
            "timestamp": str(datetime.now()),
            "redis": health_status
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get Redis health: {str(e)}")

@router.get("/redis/stats")
async def get_cache_statistics():
    """Get caching statistics and usage metrics"""
    try:
        stats = {}

        # Get usage counters
        usage_patterns = [
            ("usage", "health_analysis", "requests"),
            ("usage", "health_analysis", "hits"),
            ("usage", "drug_analysis", "requests"),
            ("usage", "drug_analysis", "cache_hits"),
            ("usage", "drug_info", "requests"),
            ("usage", "drug_info", "cache_hits"),
            ("errors", "health_analysis", "failures"),
            ("errors", "drug_analysis", "failures"),
            ("errors", "drug_info", "failures"),
        ]

        for category, identifier, sub_key in usage_patterns:
            key = f"medinsight:{category}:{identifier}:{sub_key}"
            count = redis_service.redis_client.get(key) if redis_service.redis_client else 0
            stats[f"{category}_{identifier}_{sub_key}"] = int(count) if count else 0

        # Calculate cache hit rates
        health_requests = stats.get("usage_health_analysis_requests", 0)
        health_hits = stats.get("usage_health_analysis_hits", 0)
        health_hit_rate = (health_hits / health_requests * 100) if health_requests > 0 else 0

        drug_requests = stats.get("usage_drug_analysis_requests", 0)
        drug_hits = stats.get("usage_drug_analysis_cache_hits", 0)
        drug_hit_rate = (drug_hits / drug_requests * 100) if drug_requests > 0 else 0

        drug_info_requests = stats.get("usage_drug_info_requests", 0)
        drug_info_hits = stats.get("usage_drug_info_cache_hits", 0)
        drug_info_hit_rate = (drug_info_hits / drug_info_requests * 100) if drug_info_requests > 0 else 0

        return {
            "timestamp": str(datetime.now()),
            "raw_stats": stats,
            "cache_performance": {
                "health_analysis": {
                    "requests": health_requests,
                    "cache_hits": health_hits,
                    "cache_hit_rate": round(health_hit_rate, 2)
                },
                "drug_analysis": {
                    "requests": drug_requests,
                    "cache_hits": drug_hits,
                    "cache_hit_rate": round(drug_hit_rate, 2)
                },
                "drug_info": {
                    "requests": drug_info_requests,
                    "cache_hits": drug_info_hits,
                    "cache_hit_rate": round(drug_info_hit_rate, 2)
                }
            },
            "error_rates": {
                "health_analysis_failures": stats.get("errors_health_analysis_failures", 0),
                "drug_analysis_failures": stats.get("errors_drug_analysis_failures", 0),
                "drug_info_failures": stats.get("errors_drug_info_failures", 0)
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get cache statistics: {str(e)}")

@router.get("/redis/keys/{pattern}")
async def get_cached_keys(pattern: str = "*"):
    """Get all cached keys matching a pattern"""
    try:
        if not redis_service.redis_client:
            return {"error": "Redis not available", "keys": []}

        # Use medinsight prefix for safety
        search_pattern = f"medinsight:{pattern}"
        keys = redis_service.get_keys_by_pattern(search_pattern)

        return {
            "timestamp": str(datetime.now()),
            "pattern": search_pattern,
            "key_count": len(keys),
            "keys": keys[:100]  # Limit to first 100 for performance
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get cached keys: {str(e)}")

@router.delete("/redis/cache/{category}/{identifier}")
async def clear_cache_entry(category: str, identifier: str, sub_key: str = None):
    """Clear a specific cache entry"""
    try:
        result = redis_service.delete_cache(category, identifier, sub_key)
        return {
            "timestamp": str(datetime.now()),
            "deleted": result,
            "key": f"medinsight:{category}:{identifier}" + (f":{sub_key}" if sub_key else "")
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear cache entry: {str(e)}")

@router.post("/redis/cache/clear-pattern")
async def clear_cache_by_pattern(pattern: str):
    """Clear cache entries matching a pattern (use with caution)"""
    try:
        if not redis_service.redis_client:
            return {"error": "Redis not available", "deleted": 0}

        search_pattern = f"medinsight:{pattern}"
        keys = redis_service.get_keys_by_pattern(search_pattern)

        deleted_count = 0
        for key in keys:
            if redis_service.redis_client.delete(key):
                deleted_count += 1

        return {
            "timestamp": str(datetime.now()),
            "pattern": search_pattern,
            "keys_found": len(keys),
            "keys_deleted": deleted_count
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear cache by pattern: {str(e)}")

@router.get("/redis/session/{session_id}")
async def get_session_data(session_id: str):
    """Get cached session data"""
    try:
        session_data = redis_service.get_user_session(session_id)
        symptom_data = redis_service.get_symptom_input(session_id)
        ai_summary = redis_service.get_ai_summary(session_id)

        return {
            "timestamp": str(datetime.now()),
            "session_id": session_id,
            "session_data": session_data,
            "symptom_data": symptom_data,
            "ai_summary": ai_summary
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get session data: {str(e)}")

@router.get("/redis/performance")
async def get_performance_metrics():
    """Get detailed Redis performance metrics"""
    try:
        if not redis_service.redis_client:
            return {"error": "Redis not available"}

        info = redis_service.redis_client.info()

        performance_metrics = {
            "timestamp": str(datetime.now()),
            "memory": {
                "used_memory": info.get("used_memory"),
                "used_memory_human": info.get("used_memory_human"),
                "used_memory_rss": info.get("used_memory_rss"),
                "used_memory_peak": info.get("used_memory_peak"),
                "used_memory_peak_human": info.get("used_memory_peak_human"),
                "mem_fragmentation_ratio": info.get("mem_fragmentation_ratio")
            },
            "connections": {
                "connected_clients": info.get("connected_clients"),
                "client_recent_max_input_buffer": info.get("client_recent_max_input_buffer"),
                "client_recent_max_output_buffer": info.get("client_recent_max_output_buffer")
            },
            "operations": {
                "total_commands_processed": info.get("total_commands_processed"),
                "instantaneous_ops_per_sec": info.get("instantaneous_ops_per_sec"),
                "total_net_input_bytes": info.get("total_net_input_bytes"),
                "total_net_output_bytes": info.get("total_net_output_bytes")
            },
            "keyspace": info.get("keyspace", {}),
            "server": {
                "redis_version": info.get("redis_version"),
                "uptime_in_seconds": info.get("uptime_in_seconds"),
                "uptime_in_days": info.get("uptime_in_days")
            }
        }

        return performance_metrics

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get performance metrics: {str(e)}")