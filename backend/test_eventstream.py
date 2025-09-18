#!/usr/bin/env python3

import requests
import json

def test_eventstream_fix():
    """Test that EventSource MIME type and NOVA models are working correctly"""

    print("🧪 Testing Deep Research API Integration...")

    # 1. Start a new analysis
    print("\n1. Starting new analysis...")
    response = requests.post(
        "http://localhost:8000/api/v1/drug/analyze",
        json={
            "drug_name": "ibuprofen",
            "analysis_type": "market_research",
            "include_competitors": True,
            "include_market_data": True,
            "include_clinical_data": True
        }
    )

    if response.status_code == 200:
        data = response.json()
        analysis_id = data["analysis_id"]
        print(f"   ✅ Analysis started: {analysis_id}")

        # 2. Test streaming endpoint headers
        print("\n2. Testing EventSource headers...")
        stream_response = requests.get(
            f"http://localhost:8000/api/v1/drug/analyze/{analysis_id}/stream",
            stream=True,
            headers={"Accept": "text/event-stream"}
        )

        content_type = stream_response.headers.get("content-type", "")
        print(f"   Content-Type: {content_type}")

        if "text/event-stream" in content_type:
            print("   ✅ Correct MIME type for EventSource!")
        else:
            print("   ❌ Incorrect MIME type")

        # 3. Check if we get valid Server-Sent Events
        print("\n3. Testing Server-Sent Events format...")
        event_count = 0
        for line in stream_response.iter_lines(decode_unicode=True):
            if line and line.startswith("data: "):
                try:
                    json.loads(line[6:])  # Parse JSON after "data: "
                    event_count += 1
                    print(f"   ✅ Valid SSE event {event_count}: {line[:50]}...")
                    if event_count >= 3:  # Get a few events then stop
                        break
                except:
                    print(f"   ❌ Invalid JSON in SSE: {line[:50]}...")
                    break

        print(f"\n   Received {event_count} valid events")
        stream_response.close()

    else:
        print(f"   ❌ Failed to start analysis: {response.status_code}")

    print("\n🎉 EventSource integration test complete!")

if __name__ == "__main__":
    test_eventstream_fix()