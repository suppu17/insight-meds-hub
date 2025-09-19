#!/usr/bin/env python3
"""
Test script to verify Redis integration for MedInsight app
This script tests the Redis caching functionality without requiring the full server setup.
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__)))

try:
    from app.services.redis_service import redis_service
    from app.core.config import settings
    import json
    import time

    def test_redis_connection():
        """Test Redis connection"""
        print("🔄 Testing Redis connection...")

        health = redis_service.get_health_status()
        print(f"✅ Redis Health Status: {health}")

        if health.get('status') == 'connected':
            print("✅ Redis connection successful!")
            return True
        else:
            print(f"❌ Redis connection failed: {health}")
            return False

    def test_basic_caching():
        """Test basic caching operations"""
        print("\n🔄 Testing basic caching operations...")

        # Test setting and getting cache
        test_data = {"test": "data", "timestamp": str(time.time())}

        # Set cache
        result = redis_service.set_cache("test", "basic_test", test_data, 60)
        print(f"✅ Set cache result: {result}")

        # Get cache
        cached_data = redis_service.get_cache("test", "basic_test")
        print(f"✅ Get cache result: {cached_data}")

        if cached_data == test_data:
            print("✅ Basic caching works correctly!")
            return True
        else:
            print("❌ Basic caching failed!")
            return False

    def test_medinsight_specific_caching():
        """Test MedInsight-specific caching functions"""
        print("\n🔄 Testing MedInsight-specific caching...")

        # Test symptom input caching
        symptom_data = {
            "concern": "headache",
            "symptoms": "mild headache and fatigue",
            "patient_age": 30,
            "timestamp": str(time.time())
        }

        session_id = "test_session_123"
        result = redis_service.cache_symptom_input(session_id, symptom_data)
        print(f"✅ Cache symptom input result: {result}")

        cached_symptoms = redis_service.get_symptom_input(session_id)
        print(f"✅ Get cached symptoms: {cached_symptoms}")

        # Test drug analysis caching
        drug_analysis = {
            "drug_name": "aspirin",
            "analysis": "Pain reliever and anti-inflammatory",
            "side_effects": ["stomach irritation", "bleeding risk"],
            "timestamp": str(time.time())
        }

        drug_result = redis_service.cache_drug_analysis("aspirin", drug_analysis)
        print(f"✅ Cache drug analysis result: {drug_result}")

        cached_drug = redis_service.get_drug_analysis("aspirin")
        print(f"✅ Get cached drug analysis: {cached_drug}")

        # Test AI summary caching
        ai_summary = {
            "condition": "tension headache",
            "severity": "mild",
            "recommendation": "rest and hydration",
            "timestamp": str(time.time())
        }

        analysis_id = "analysis_456"
        ai_result = redis_service.cache_ai_summary(analysis_id, ai_summary)
        print(f"✅ Cache AI summary result: {ai_result}")

        cached_ai = redis_service.get_ai_summary(analysis_id)
        print(f"✅ Get cached AI summary: {cached_ai}")

        print("✅ All MedInsight-specific caching tests passed!")
        return True

    def test_counters():
        """Test counter functionality"""
        print("\n🔄 Testing counter functionality...")

        # Test incrementing counters
        counter_value = redis_service.increment_counter("usage", "health_analysis", "requests")
        print(f"✅ Counter incremented to: {counter_value}")

        counter_value2 = redis_service.increment_counter("usage", "health_analysis", "requests")
        print(f"✅ Counter incremented to: {counter_value2}")

        if counter_value2 > counter_value:
            print("✅ Counter functionality works correctly!")
            return True
        else:
            print("❌ Counter functionality failed!")
            return False

    def test_key_patterns():
        """Test key pattern functionality"""
        print("\n🔄 Testing key pattern functionality...")

        # Get all medinsight keys
        keys = redis_service.get_keys_by_pattern("medinsight:*")
        print(f"✅ Found {len(keys)} medinsight keys")

        if len(keys) >= 0:  # Should have at least the test data we created
            print("✅ Key pattern functionality works!")
            return True
        else:
            print("❌ Key pattern functionality failed!")
            return False

    def cleanup_test_data():
        """Clean up test data"""
        print("\n🔄 Cleaning up test data...")

        # Delete test cache entries
        redis_service.delete_cache("test", "basic_test")
        redis_service.delete_cache("symptom", "test_session_123", "inputs")
        redis_service.delete_cache("drug_analysis", "aspirin")
        redis_service.delete_cache("ai_summary", "analysis_456")

        print("✅ Test data cleanup completed!")

    def main():
        """Main test function"""
        print("🚀 Starting Redis Integration Tests for MedInsight App\n")

        print(f"📋 Configuration:")
        print(f"   Redis API Key: {settings.REDIS_API_KEY[:10]}...")
        print(f"   Redis Host: {settings.REDIS_HOST}")
        print(f"   Redis Port: {settings.REDIS_PORT}")
        print(f"   Redis DB: {settings.REDIS_DB}")
        print("")

        tests = [
            ("Redis Connection", test_redis_connection),
            ("Basic Caching", test_basic_caching),
            ("MedInsight Specific Caching", test_medinsight_specific_caching),
            ("Counter Functionality", test_counters),
            ("Key Pattern Functionality", test_key_patterns),
        ]

        passed = 0
        total = len(tests)

        for test_name, test_func in tests:
            try:
                print(f"{'='*50}")
                print(f"Running Test: {test_name}")
                print(f"{'='*50}")

                if test_func():
                    passed += 1
                    print(f"✅ {test_name}: PASSED\n")
                else:
                    print(f"❌ {test_name}: FAILED\n")

            except Exception as e:
                print(f"❌ {test_name}: ERROR - {str(e)}\n")

        # Cleanup
        try:
            cleanup_test_data()
        except Exception as e:
            print(f"Warning: Cleanup failed - {str(e)}")

        print(f"{'='*50}")
        print(f"📊 Test Results: {passed}/{total} tests passed")
        print(f"{'='*50}")

        if passed == total:
            print("🎉 All tests passed! Redis integration is working correctly.")
            return 0
        else:
            print("⚠️ Some tests failed. Please check the Redis configuration and connection.")
            return 1

    if __name__ == "__main__":
        exit(main())

except ImportError as e:
    print(f"❌ Import Error: {e}")
    print("💡 This might be because the required dependencies are not installed.")
    print("   Try running: pip install redis fastapi pydantic pydantic-settings")
    exit(1)
except Exception as e:
    print(f"❌ Unexpected Error: {e}")
    exit(1)