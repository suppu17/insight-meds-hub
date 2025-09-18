#!/usr/bin/env python3
"""
Startup script for Insight Meds Hub Backend API

This script sets up and runs the FastAPI backend service with drug analysis
and market intelligence capabilities powered by Bright Data.
"""

import sys
import os
import subprocess
import uvicorn
from pathlib import Path

# Add the app directory to Python path
app_dir = Path(__file__).parent / "app"
sys.path.insert(0, str(app_dir))

def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3, 8):
        print("❌ Error: Python 3.8 or higher is required")
        sys.exit(1)
    print(f"✅ Python {sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}")

def install_requirements():
    """Install required packages"""
    requirements_file = Path(__file__).parent / "requirements.txt"

    if not requirements_file.exists():
        print("❌ Error: requirements.txt not found")
        sys.exit(1)

    print("📦 Installing dependencies...")
    try:
        subprocess.check_call([
            sys.executable, "-m", "pip", "install", "-r", str(requirements_file)
        ], stdout=subprocess.DEVNULL)
        print("✅ Dependencies installed successfully")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error installing dependencies: {e}")
        print("💡 Try: pip install -r requirements.txt")
        sys.exit(1)

def check_environment():
    """Check environment configuration"""
    env_example = Path(__file__).parent / ".env.example"
    env_file = Path(__file__).parent / ".env"

    if not env_file.exists() and env_example.exists():
        print("⚠️  Warning: .env file not found")
        print("💡 Copy .env.example to .env and configure your API keys:")
        print(f"   cp {env_example} {env_file}")
        print("   Edit .env file with your API keys")
        print()

    # Check for critical environment variables
    missing_vars = []
    important_vars = [
        "BRIGHT_DATA_API_KEY",
        "OPENAI_API_KEY",
        "GOOGLE_API_KEY"
    ]

    for var in important_vars:
        if not os.getenv(var):
            missing_vars.append(var)

    if missing_vars:
        print("⚠️  Warning: Missing environment variables:")
        for var in missing_vars:
            print(f"   - {var}")
        print("💡 Configure these in your .env file for full functionality")
        print()

def start_server():
    """Start the FastAPI server"""
    print("🚀 Starting Insight Meds Hub Backend API...")
    print("📊 Features enabled:")
    print("   ✅ Multi-agent drug analysis")
    print("   ✅ Bright Data market intelligence")
    print("   ✅ Real-time streaming progress")
    print("   ✅ Clinical trials research")
    print("   ✅ Competitive analysis")
    print("   ✅ Pricing intelligence")
    print()
    print("🌐 API will be available at:")
    print("   - Main API: http://localhost:8000")
    print("   - Documentation: http://localhost:8000/docs")
    print("   - Health Check: http://localhost:8000/health")
    print()
    print("Press Ctrl+C to stop the server")
    print("=" * 50)

    try:
        uvicorn.run(
            "app.main:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            reload_dirs=["app"],
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\n👋 Server stopped")
    except Exception as e:
        print(f"\n❌ Error starting server: {e}")
        sys.exit(1)

def main():
    """Main startup function"""
    print("🧬 Insight Meds Hub Backend API")
    print("=" * 50)

    # Run startup checks
    check_python_version()
    install_requirements()
    check_environment()

    # Start the server
    start_server()

if __name__ == "__main__":
    main()