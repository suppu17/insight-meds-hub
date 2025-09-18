#!/usr/bin/env python3
"""
Simple test script for the Insight Meds Hub API backend
Tests basic functionality without requiring all dependencies
"""

import json
import sys
from pathlib import Path

# Add app to Python path
app_dir = Path(__file__).parent / "app"
sys.path.insert(0, str(app_dir))

def test_imports():
    """Test that all modules can be imported"""
    print("🧪 Testing module imports...")

    try:
        from app.models.drug import DrugRequest, DrugAnalysisResult
        print("✅ Drug models imported successfully")

        from app.core.config import settings
        print("✅ Configuration imported successfully")

        from app.services.multi_agent_intelligence import MultiAgentDrugIntelligence
        print("✅ Multi-agent intelligence service imported successfully")

        from app.services.ai_models import AIModelService
        print("✅ AI models service imported successfully")

        return True

    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False

def test_models():
    """Test Pydantic models"""
    print("\n📋 Testing data models...")

    try:
        from app.models.drug import DrugRequest, DrugAnalysisType

        # Test drug request model
        request = DrugRequest(
            drug_name="aspirin",
            analysis_type=DrugAnalysisType.OVERVIEW,
            include_competitors=True
        )

        print(f"✅ DrugRequest model: {request.drug_name} ({request.analysis_type})")

        # Test serialization
        json_data = request.model_dump()
        print(f"✅ Model serialization: {json_data}")

        return True

    except Exception as e:
        print(f"❌ Model test error: {e}")
        return False

def test_services():
    """Test service classes"""
    print("\n🔬 Testing service classes...")

    try:
        from app.services.multi_agent_intelligence import MultiAgentDrugIntelligence
        from app.services.ai_models import AIModelService

        # Initialize services
        intelligence = MultiAgentDrugIntelligence()
        ai_service = AIModelService()

        print("✅ MultiAgentDrugIntelligence initialized")
        print("✅ AIModelService initialized")

        # Test service attributes
        print(f"✅ Intelligence service has researcher: {hasattr(intelligence, 'researcher')}")
        print(f"✅ Intelligence service has analyst: {hasattr(intelligence, 'analyst')}")
        print(f"✅ Intelligence service has writer: {hasattr(intelligence, 'writer')}")

        # Test Bedrock client initialization
        if hasattr(ai_service, 'bedrock_client') and ai_service.bedrock_client:
            print("✅ Amazon Bedrock client initialized")
        else:
            print("⚠️  Amazon Bedrock client not initialized (AWS credentials needed)")

        return True

    except Exception as e:
        print(f"❌ Service test error: {e}")
        return False

def test_configuration():
    """Test configuration"""
    print("\n⚙️  Testing configuration...")

    try:
        from app.core.config import settings

        print(f"✅ Project name: {settings.PROJECT_NAME}")
        print(f"✅ API version: {settings.API_V1_STR}")
        print(f"✅ Database URL: {settings.DATABASE_URL}")
        print(f"✅ FDA API base: {settings.FDA_API_BASE}")

        # Check for API keys and AWS credentials (don't print actual values)
        credentials = [
            ("Bright Data API", settings.BRIGHT_DATA_API_KEY),
            ("AWS Access Key", settings.AWS_ACCESS_KEY_ID),
            ("AWS Secret Key", settings.AWS_SECRET_ACCESS_KEY),
        ]

        for name, key in credentials:
            if key and key != "your_aws_access_key_here" and key != "your_aws_secret_key_here":
                print(f"✅ {name} configured")
            else:
                print(f"⚠️  {name} not configured")

        # Check Bedrock model IDs
        bedrock_models = [
            ("Claude Sonnet", settings.BEDROCK_CLAUDE_MODEL_ID),
            ("NOVA Premier", settings.BEDROCK_NOVA_PREMIER_MODEL_ID),
            ("NOVA Micro", settings.BEDROCK_NOVA_MICRO_MODEL_ID),
        ]

        for name, model_id in bedrock_models:
            if model_id:
                print(f"✅ {name} model ID: {model_id}")
            else:
                print(f"⚠️  {name} model ID not configured")

        return True

    except Exception as e:
        print(f"❌ Configuration test error: {e}")
        return False

def test_api_endpoints():
    """Test API endpoint definitions"""
    print("\n🌐 Testing API endpoint definitions...")

    try:
        from app.api.endpoints import drug_analysis, market_research

        print("✅ Drug analysis endpoints imported")
        print("✅ Market research endpoints imported")

        # Check routers
        print(f"✅ Drug analysis router: {hasattr(drug_analysis, 'router')}")
        print(f"✅ Market research router: {hasattr(market_research, 'router')}")

        return True

    except Exception as e:
        print(f"❌ API endpoint test error: {e}")
        return False

def main():
    """Run all tests"""
    print("🧬 Insight Meds Hub Backend API - Test Suite")
    print("=" * 50)

    tests = [
        test_imports,
        test_models,
        test_services,
        test_configuration,
        test_api_endpoints
    ]

    passed = 0
    total = len(tests)

    for test in tests:
        try:
            if test():
                passed += 1
        except Exception as e:
            print(f"❌ Test failed with exception: {e}")

    print("\n" + "=" * 50)
    print(f"📊 Test Results: {passed}/{total} tests passed")

    if passed == total:
        print("🎉 All tests passed! Backend API is ready.")
        print("\n💡 Next steps:")
        print("   1. Install dependencies: pip install -r requirements.txt")
        print("   2. Configure .env file with API keys")
        print("   3. Start server: python startup.py")
        return True
    else:
        print("⚠️  Some tests failed. Check the errors above.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)