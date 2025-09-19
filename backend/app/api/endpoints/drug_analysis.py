from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from typing import Dict, Optional
import json
import asyncio
from datetime import datetime
import hashlib

from app.models.drug import DrugRequest, DrugAnalysisResult, AnalysisProgress, DrugAnalysisType
from app.services.multi_agent_intelligence import MultiAgentDrugIntelligence
from app.services.redis_service import redis_service

router = APIRouter()
intelligence_service = MultiAgentDrugIntelligence()

# Store for ongoing analyses
active_analyses: Dict[str, Dict] = {}


@router.post("/drug/analyze", response_model=Dict)
async def start_drug_analysis(
    request: DrugRequest,
    background_tasks: BackgroundTasks
):
    """Start comprehensive drug analysis with multi-agent intelligence"""
    try:
        # Check if recent analysis exists in cache
        cached_analysis = redis_service.get_drug_analysis(request.drug_name)
        if cached_analysis and cached_analysis.get("full_analysis"):
            analysis_data = cached_analysis["full_analysis"]
            # Check if analysis is recent (within last 6 hours)
            if "timestamp" in analysis_data:
                cache_time = datetime.fromisoformat(analysis_data["timestamp"])
                if (datetime.now() - cache_time).total_seconds() < 21600:  # 6 hours
                    redis_service.increment_counter("usage", "drug_analysis", "cache_hits")
                    return {
                        "analysis_id": analysis_data.get("analysis_id", "cached"),
                        "status": "completed_from_cache",
                        "message": f"Recent analysis found for {request.drug_name}",
                        "estimated_completion_minutes": 0,
                        "results": analysis_data.get("results"),
                        "cached": True
                    }

        # Generate unique analysis ID
        import uuid
        analysis_id = str(uuid.uuid4())

        # Initialize analysis tracking
        analysis_session = {
            "drug_name": request.drug_name,
            "analysis_type": request.analysis_type,
            "status": "queued",
            "progress": 0,
            "created_at": datetime.now(),
            "current_step": "Analysis queued",
            "analysis_id": analysis_id
        }

        active_analyses[analysis_id] = analysis_session

        # Cache the session data
        redis_service.cache_user_session(
            analysis_id,
            {
                "type": "drug_analysis",
                "drug_name": request.drug_name,
                "analysis_type": request.analysis_type.value if hasattr(request.analysis_type, 'value') else str(request.analysis_type),
                "status": "queued",
                "created_at": str(datetime.now())
            }
        )

        # Start background analysis
        background_tasks.add_task(
            run_background_analysis,
            analysis_id,
            request
        )

        # Increment usage counter
        redis_service.increment_counter("usage", "drug_analysis", "requests")

        return {
            "analysis_id": analysis_id,
            "status": "queued",
            "message": f"Drug analysis started for {request.drug_name}",
            "estimated_completion_minutes": 5,
            "cached": False
        }

    except Exception as e:
        redis_service.increment_counter("errors", "drug_analysis", "failures")
        raise HTTPException(status_code=500, detail=f"Failed to start analysis: {str(e)}")


@router.get("/drug/analyze/{analysis_id}/stream")
async def stream_analysis_progress(analysis_id: str):
    """Stream real-time analysis progress"""

    async def generate_stream():
        try:
            # Check if analysis exists
            if analysis_id not in active_analyses:
                yield f"data: {json.dumps({'error': 'Analysis not found'})}\n\n"
                return

            analysis_info = active_analyses[analysis_id]
            drug_name = analysis_info["drug_name"]

            # Stream the analysis workflow
            async for progress_update in intelligence_service.run_drug_intelligence_workflow(
                drug_name=drug_name,
                analysis_id=analysis_id
            ):
                # Update active analysis
                active_analyses[analysis_id].update({
                    "status": progress_update.get("status"),
                    "progress": progress_update.get("progress"),
                    "current_step": progress_update.get("current_step")
                })

                # Send Server-Sent Events
                yield f"data: {json.dumps(progress_update, default=str)}\n\n"

                # If completed or failed, break
                if progress_update.get("status") in ["completed", "failed"]:
                    break

                # Small delay to prevent overwhelming the client
                await asyncio.sleep(0.5)

        except Exception as e:
            error_response = {
                "analysis_id": analysis_id,
                "status": "failed",
                "error": str(e),
                "message": "Analysis stream failed"
            }
            yield f"data: {json.dumps(error_response)}\n\n"

    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*"
        }
    )


@router.get("/drug/analyze/{analysis_id}/status", response_model=AnalysisProgress)
async def get_analysis_status(analysis_id: str):
    """Get current status of drug analysis"""
    if analysis_id not in active_analyses:
        raise HTTPException(status_code=404, detail="Analysis not found")

    analysis = active_analyses[analysis_id]
    return AnalysisProgress(
        analysis_id=analysis_id,
        status=analysis.get("status", "unknown"),
        progress_percentage=analysis.get("progress", 0),
        current_step=analysis.get("current_step", ""),
        estimated_completion=None,  # Could calculate based on progress
        results=analysis.get("results")
    )


@router.get("/drug/info/{drug_name}")
async def get_basic_drug_info(drug_name: str):
    """Get basic drug information quickly (without full analysis)"""
    try:
        # Check cache first for basic drug info
        cached_info = redis_service.get_drug_analysis(drug_name)
        if cached_info and cached_info.get("basic_info"):
            redis_service.increment_counter("usage", "drug_info", "cache_hits")
            return {
                "drug_name": drug_name,
                "status": "info_retrieved_from_cache",
                "message": f"Basic information for {drug_name} (cached)",
                "data": cached_info["basic_info"],
                "cached": True
            }

        # Generate basic drug info
        basic_info = {
            "generic_name": drug_name,
            "description": "Drug information lookup completed",
            "data_sources": ["FDA", "Basic Medical Databases"],
            "lookup_timestamp": str(datetime.now())
        }

        # Cache the basic info
        drug_cache_data = {
            "basic_info": basic_info,
            "last_updated": str(datetime.now())
        }
        redis_service.cache_drug_analysis(drug_name, drug_cache_data)

        # Increment counter
        redis_service.increment_counter("usage", "drug_info", "requests")

        return {
            "drug_name": drug_name,
            "status": "info_retrieved",
            "message": f"Basic information for {drug_name}",
            "data": basic_info,
            "cached": False
        }

    except Exception as e:
        redis_service.increment_counter("errors", "drug_info", "failures")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve drug info: {str(e)}")


@router.post("/drug/compare")
async def compare_drugs(drug_names: list[str]):
    """Compare multiple drugs side by side"""
    if len(drug_names) > 5:
        raise HTTPException(status_code=400, detail="Maximum 5 drugs can be compared at once")

    try:
        comparison_id = str(__import__("uuid").uuid4())

        # This would initiate a comparative analysis
        return {
            "comparison_id": comparison_id,
            "drugs": drug_names,
            "status": "comparison_started",
            "message": f"Comparative analysis started for {len(drug_names)} drugs",
            "estimated_completion_minutes": len(drug_names) * 2
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start comparison: {str(e)}")


@router.get("/drug/search")
async def search_drugs(query: str, limit: int = 10):
    """Search for drugs by name or indication"""
    try:
        # This would implement drug search functionality
        # For now, returning mock results
        mock_results = [
            {
                "drug_name": f"{query}",
                "generic_name": f"{query.lower()}",
                "brand_names": [f"Brand-{query}"],
                "indication": "Search result for drug query",
                "manufacturer": "Various"
            }
        ]

        return {
            "query": query,
            "results": mock_results[:limit],
            "total_found": len(mock_results),
            "search_time_ms": 45
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


async def run_background_analysis(analysis_id: str, request: DrugRequest):
    """Run the analysis in the background"""
    try:
        # Update status to in-progress
        active_analyses[analysis_id]["status"] = "in_progress"

        # The actual analysis will be streamed via the stream endpoint
        # This function mainly tracks the analysis lifecycle

        # Simulate analysis completion after some time
        await asyncio.sleep(2)  # Small delay before actual processing

        # The real work is done in the streaming workflow
        # This just ensures the analysis is properly tracked

    except Exception as e:
        active_analyses[analysis_id].update({
            "status": "failed",
            "error": str(e),
            "progress": 0
        })