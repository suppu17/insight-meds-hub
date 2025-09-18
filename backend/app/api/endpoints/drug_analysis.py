from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from typing import Dict, Optional
import json
import asyncio
from datetime import datetime

from app.models.drug import DrugRequest, DrugAnalysisResult, AnalysisProgress, DrugAnalysisType
from app.services.multi_agent_intelligence import MultiAgentDrugIntelligence

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
        # Generate unique analysis ID
        import uuid
        analysis_id = str(uuid.uuid4())

        # Initialize analysis tracking
        active_analyses[analysis_id] = {
            "drug_name": request.drug_name,
            "analysis_type": request.analysis_type,
            "status": "queued",
            "progress": 0,
            "created_at": datetime.now(),
            "current_step": "Analysis queued"
        }

        # Start background analysis
        background_tasks.add_task(
            run_background_analysis,
            analysis_id,
            request
        )

        return {
            "analysis_id": analysis_id,
            "status": "queued",
            "message": f"Drug analysis started for {request.drug_name}",
            "estimated_completion_minutes": 5
        }

    except Exception as e:
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
        # This could be a faster lookup for basic drug info
        # Using cached data or simplified API calls
        return {
            "drug_name": drug_name,
            "status": "info_retrieved",
            "message": f"Basic information for {drug_name}",
            "data": {
                "generic_name": drug_name,
                "description": "Drug information lookup completed",
                "data_sources": ["FDA", "Basic Medical Databases"]
            }
        }
    except Exception as e:
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