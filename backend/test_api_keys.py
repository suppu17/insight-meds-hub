#!/usr/bin/env python3
"""
Test script to verify all API keys and configurations are properly loaded.
"""

import os
import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.core.config import settings
from app.services.redis_service import redis_service

def test_environment_variables():
    """Test that all environment variables are loaded correctly."""
    print("🔧 Testing Environment Variables...")
    print(f"Environment: {settings.ENVIRONMENT}")
    
    # AWS Configuration
    print(f"\n📡 AWS Configuration:")
    print(f"  AWS_ACCESS_KEY_ID: {'✅ Set' if settings.AWS_ACCESS_KEY_ID else '❌ Missing'}")
    print(f"  AWS_SECRET_ACCESS_KEY: {'✅ Set' if settings.AWS_SECRET_ACCESS_KEY else '❌ Missing'}")
    print(f"  AWS_REGION: {settings.AWS_REGION}")
    print(f"  AWS_BEARER_TOKEN_BEDROCK: {'✅ Set' if settings.AWS_BEARER_TOKEN_BEDROCK else '❌ Missing'}")
    print(f"  AWS_S3_BUCKET_NAME: {settings.AWS_S3_BUCKET_NAME or '❌ Missing'}")
    
    # Redis Configuration
    print(f"\n🔴 Redis Configuration:")
    print(f"  REDIS_HOST: {settings.REDIS_HOST}")
    print(f"  REDIS_PORT: {settings.REDIS_PORT}")
    print(f"  REDIS_PASSWORD: {'✅ Set' if settings.REDIS_PASSWORD else '❌ Not Set'}")
    print(f"  REDIS_API_KEY: {'✅ Set' if settings.REDIS_API_KEY else '❌ Not Set'}")
    print(f"  REDIS_DB: {settings.REDIS_DB}")
    print(f"  REDIS_SSL: {settings.REDIS_SSL}")
    
    # fal.ai Configuration
    print(f"\n🎨 fal.ai Configuration:")
    print(f"  FAL_API_KEY: {'✅ Set' if settings.FAL_API_KEY else '❌ Missing'}")
    print(f"  FAL_API_BASE: {settings.FAL_API_BASE}")
    
    # Bright Data Configuration
    print(f"\n🌐 Bright Data Configuration:")
    print(f"  BRIGHT_DATA_API_KEY: {'✅ Set' if settings.BRIGHT_DATA_API_KEY else '❌ Missing'}")
    print(f"  BRIGHT_DATA_ENDPOINT: {settings.BRIGHT_DATA_ENDPOINT}")
    
    # Bedrock Models
    print(f"\n🤖 Bedrock Models:")
    print(f"  CLAUDE_MODEL_ID: {settings.BEDROCK_CLAUDE_MODEL_ID}")
    print(f"  NOVA_PREMIER_MODEL_ID: {settings.BEDROCK_NOVA_PREMIER_MODEL_ID}")
    print(f"  NOVA_MICRO_MODEL_ID: {settings.BEDROCK_NOVA_MICRO_MODEL_ID}")
    print(f"  NOVA_LITE_MODEL_ID: {settings.BEDROCK_NOVA_LITE_MODEL_ID}")
    
    # Security
    print(f"\n🔐 Security:")
    print(f"  SECRET_KEY: {'✅ Set' if settings.SECRET_KEY else '❌ Missing'}")

def test_redis_connection():
    """Test Redis connection."""
    print(f"\n🔴 Testing Redis Connection...")
    
    try:
        health_status = redis_service.get_health_status()
        print(f"  Status: {health_status.get('status', 'unknown')}")
        
        if health_status.get('status') == 'connected':
            print(f"  ✅ Redis Version: {health_status.get('version', 'unknown')}")
            print(f"  ✅ Connected Clients: {health_status.get('connected_clients', 'unknown')}")
            print(f"  ✅ Used Memory: {health_status.get('used_memory', 'unknown')}")
            
            # Test basic operations
            test_key = "test:api_keys_validation"
            test_data = {"timestamp": "2024-01-01", "test": True}
            
            if redis_service.set_cache("test", "api_validation", test_data, 60):
                print(f"  ✅ Cache SET operation successful")
                
                retrieved_data = redis_service.get_cache("test", "api_validation")
                if retrieved_data == test_data:
                    print(f"  ✅ Cache GET operation successful")
                    redis_service.delete_cache("test", "api_validation")
                    print(f"  ✅ Cache DELETE operation successful")
                else:
                    print(f"  ❌ Cache GET operation failed")
            else:
                print(f"  ❌ Cache SET operation failed")
                
        else:
            print(f"  ❌ Redis connection failed: {health_status.get('error', 'unknown error')}")
            
    except Exception as e:
        print(f"  ❌ Redis test failed: {str(e)}")

def test_api_keys_summary():
    """Provide a summary of API key status."""
    print(f"\n📋 API Keys Summary:")
    
    required_keys = [
        ("AWS_ACCESS_KEY_ID", settings.AWS_ACCESS_KEY_ID),
        ("AWS_SECRET_ACCESS_KEY", settings.AWS_SECRET_ACCESS_KEY),
        ("FAL_API_KEY", settings.FAL_API_KEY),
        ("BRIGHT_DATA_API_KEY", settings.BRIGHT_DATA_API_KEY),
        ("SECRET_KEY", settings.SECRET_KEY),
    ]
    
    optional_keys = [
        ("REDIS_PASSWORD", settings.REDIS_PASSWORD),
        ("AWS_S3_BUCKET_NAME", settings.AWS_S3_BUCKET_NAME),
        ("AWS_BEARER_TOKEN_BEDROCK", settings.AWS_BEARER_TOKEN_BEDROCK),
    ]
    
    print(f"\n  Required Keys:")
    missing_required = 0
    for key_name, key_value in required_keys:
        status = "✅ Set" if key_value else "❌ Missing"
        if not key_value:
            missing_required += 1
        print(f"    {key_name}: {status}")
    
    print(f"\n  Optional Keys:")
    for key_name, key_value in optional_keys:
        status = "✅ Set" if key_value else "⚠️ Not Set"
        print(f"    {key_name}: {status}")
    
    if missing_required == 0:
        print(f"\n✅ All required API keys are configured!")
    else:
        print(f"\n❌ {missing_required} required API key(s) missing!")
    
    return missing_required == 0

if __name__ == "__main__":
    print("🚀 MedInsight Hub - API Keys & Configuration Test")
    print("=" * 50)
    
    test_environment_variables()
    test_redis_connection()
    
    if test_api_keys_summary():
        print(f"\n🎉 Configuration test completed successfully!")
        sys.exit(0)
    else:
        print(f"\n⚠️ Configuration test completed with warnings!")
        sys.exit(1)
