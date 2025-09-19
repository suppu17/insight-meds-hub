#!/usr/bin/env python3
"""
Redis Cloud Connection Test Script
Tests the Redis Cloud connection with the provided API key and configuration.
"""

import os
import sys
import json
import time
from datetime import datetime
from typing import Dict, Any

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.services.redis_service import redis_service
from app.core.config import settings

def print_header(title: str):
    """Print a formatted header."""
    print(f"\n{'='*60}")
    print(f" {title}")
    print(f"{'='*60}")

def print_section(title: str):
    """Print a formatted section header."""
    print(f"\n{'-'*40}")
    print(f" {title}")
    print(f"{'-'*40}")

def test_redis_configuration():
    """Test Redis configuration settings."""
    print_section("Redis Configuration")
    
    config_info = {
        "REDIS_API_KEY": "***" + (settings.REDIS_API_KEY[-8:] if settings.REDIS_API_KEY else "None"),
        "REDIS_HOST": settings.REDIS_HOST,
        "REDIS_PORT": settings.REDIS_PORT,
        "REDIS_SSL": settings.REDIS_SSL,
        "REDIS_URL": settings.REDIS_URL[:20] + "..." if settings.REDIS_URL else "None",
        "REDIS_DB": settings.REDIS_DB,
        "REDIS_MAX_CONNECTIONS": settings.REDIS_MAX_CONNECTIONS,
    }
    
    for key, value in config_info.items():
        print(f"  {key}: {value}")
    
    return True

def test_redis_connection():
    """Test basic Redis connection."""
    print_section("Redis Connection Test")
    
    try:
        if not redis_service.redis_client:
            print("  ❌ Redis client not initialized")
            return False
        
        # Test ping
        response = redis_service.redis_client.ping()
        if response:
            print("  ✅ Redis PING successful")
        else:
            print("  ❌ Redis PING failed")
            return False
        
        # Test info
        info = redis_service.redis_client.info()
        print(f"  ✅ Redis version: {info.get('redis_version', 'unknown')}")
        print(f"  ✅ Connected clients: {info.get('connected_clients', 'unknown')}")
        print(f"  ✅ Used memory: {info.get('used_memory_human', 'unknown')}")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Redis connection failed: {e}")
        return False

def test_redis_operations():
    """Test basic Redis operations."""
    print_section("Redis Operations Test")
    
    try:
        # Test SET/GET
        test_key = f"test:connection:{int(time.time())}"
        test_value = {"message": "Hello Redis Cloud!", "timestamp": datetime.now().isoformat()}
        
        # Test cache set
        success = redis_service.set_cache("test", "connection", test_value, 60)
        if success:
            print("  ✅ Cache SET operation successful")
        else:
            print("  ❌ Cache SET operation failed")
            return False
        
        # Test cache get
        retrieved_value = redis_service.get_cache("test", "connection")
        if retrieved_value and retrieved_value.get("message") == test_value["message"]:
            print("  ✅ Cache GET operation successful")
            print(f"  📦 Retrieved: {retrieved_value['message']}")
        else:
            print("  ❌ Cache GET operation failed")
            return False
        
        # Test cache delete
        deleted = redis_service.delete_cache("test", "connection")
        if deleted:
            print("  ✅ Cache DELETE operation successful")
        else:
            print("  ❌ Cache DELETE operation failed")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Redis operations failed: {e}")
        return False

def test_medical_caching():
    """Test medical-specific caching functionality."""
    print_section("Medical Caching Test")
    
    try:
        # Test session caching
        session_data = {
            "user_id": "test_user_123",
            "session_start": datetime.now().isoformat(),
            "preferences": {"theme": "dark", "language": "en"}
        }
        
        success = redis_service.cache_session_state("test_session_123", session_data)
        if success:
            print("  ✅ Session caching successful")
        else:
            print("  ❌ Session caching failed")
            return False
        
        # Test drug analysis caching
        drug_analysis = {
            "drug_name": "Aspirin",
            "analysis_type": "overview",
            "results": {"safety_profile": "Generally safe", "interactions": []},
            "timestamp": datetime.now().isoformat()
        }
        
        success = redis_service.cache_drug_analysis("aspirin", drug_analysis)
        if success:
            print("  ✅ Drug analysis caching successful")
        else:
            print("  ❌ Drug analysis caching failed")
            return False
        
        # Test retrieval
        cached_analysis = redis_service.get_drug_analysis("aspirin")
        if cached_analysis and cached_analysis.get("drug_name") == "Aspirin":
            print("  ✅ Drug analysis retrieval successful")
        else:
            print("  ❌ Drug analysis retrieval failed")
            return False
        
        return True
        
    except Exception as e:
        print(f"  ❌ Medical caching failed: {e}")
        return False

def test_cache_statistics():
    """Test cache statistics and health monitoring."""
    print_section("Cache Statistics Test")
    
    try:
        # Get health status
        health = redis_service.get_health_status()
        if health.get("status") == "connected":
            print("  ✅ Redis health status: Connected")
            print(f"  📊 Redis version: {health.get('version', 'unknown')}")
            print(f"  📊 Connected clients: {health.get('connected_clients', 'unknown')}")
            print(f"  📊 Used memory: {health.get('used_memory', 'unknown')}")
        else:
            print(f"  ❌ Redis health status: {health.get('status', 'unknown')}")
            if health.get("error"):
                print(f"  ❌ Error: {health['error']}")
            return False
        
        # Get cache statistics
        stats = redis_service.get_cache_statistics()
        if stats and not stats.get("error"):
            print("  ✅ Cache statistics retrieved successfully")
            print(f"  📊 Total keys: {stats.get('total_keys', 0)}")
            
            categories = stats.get('cache_categories', {})
            for category, info in categories.items():
                print(f"  📊 {category}: {info.get('count', 0)} keys")
        else:
            print(f"  ❌ Cache statistics failed: {stats.get('error', 'unknown')}")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Cache statistics failed: {e}")
        return False

def cleanup_test_data():
    """Clean up test data."""
    print_section("Cleanup Test Data")
    
    try:
        # Clean up test keys
        test_patterns = [
            "medinsight:test:*",
            "medinsight:session_state:test_session_123",
            "medinsight:drug_analysis:aspirin"
        ]
        
        cleaned_count = 0
        for pattern in test_patterns:
            if "*" in pattern:
                keys = redis_service.get_keys_by_pattern(pattern)
                for key in keys:
                    try:
                        parts = key.split(":")
                        if len(parts) >= 3:
                            category = parts[1]
                            identifier = parts[2]
                            redis_service.delete_cache(category, identifier)
                            cleaned_count += 1
                    except Exception:
                        pass
            else:
                # Direct key deletion
                parts = pattern.split(":")
                if len(parts) >= 3:
                    category = parts[1]
                    identifier = parts[2]
                    if redis_service.delete_cache(category, identifier):
                        cleaned_count += 1
        
        print(f"  🧹 Cleaned up {cleaned_count} test keys")
        return True
        
    except Exception as e:
        print(f"  ❌ Cleanup failed: {e}")
        return False

def main():
    """Main test function."""
    print_header("Redis Cloud Connection Test")
    print(f"Timestamp: {datetime.now().isoformat()}")
    
    tests = [
        ("Configuration", test_redis_configuration),
        ("Connection", test_redis_connection),
        ("Basic Operations", test_redis_operations),
        ("Medical Caching", test_medical_caching),
        ("Statistics", test_cache_statistics),
        ("Cleanup", cleanup_test_data)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"  ❌ {test_name} test crashed: {e}")
            results.append((test_name, False))
    
    # Summary
    print_header("Test Results Summary")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {status} {test_name}")
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed! Redis Cloud is working correctly.")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Check configuration and connection.")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
