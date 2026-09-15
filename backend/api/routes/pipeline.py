"""
api/routes/pipeline.py — Full pipeline endpoint (M1-M10, optionally M11-M13, M16-M17).

POST /api/v1/pipeline/run
"""
import logging

from fastapi import APIRouter, HTTPException

from api.schemas import PipelineRequest, PipelineResponse, PipelineRequestExtended
from api.pipeline_service import run_full_pipeline, run_full_pipeline_extended

router = APIRouter(prefix="/pipeline")
logger = logging.getLogger("PipelineRoute")


@router.post(
    "/run",
    summary="Full Pipeline — End-to-End Execution (M1-M10, optionally M11-M13 and M16-M17; M14-M15 standalone)",
    description=(
        "Runs the complete oil spill monitoring, attribution, and forecast pipeline.\n\n"
        "**Pipeline Modes:**\n"
        "- **Default:** `include_modules_11_15=false`, `include_modules_16_17=false` → Runs M1-M10\n"
        "- **Extended:** `include_modules_11_15=true` → Runs M1-M13\n"
        "- **Full Decision Support:** `include_modules_16_17=true` → Runs M1-M13 + M16-M17\n\n"
        "M14 and M15 remain standalone endpoints.\n\n"
        "WARNING: All results are generated from SYNTHETIC MOCK DATA and are NOT "
        "scientifically valid measurements. OBSERVED / INFERRED / SIMULATED labels "
        "are preserved in the response."
    ),
    tags=["Pipeline"],
)
def pipeline_run(req: PipelineRequestExtended):
    try:
        result = run_full_pipeline_extended(
            req.scene_id,
            req.config_path,
            include_modules_11_15=req.include_modules_11_15,
            include_modules_16_17=req.include_modules_16_17,
        )
        return result
    except FileNotFoundError as exc:
        logger.error("File not found: %s", exc)
        raise HTTPException(status_code=404, detail={"error": "FILE_NOT_FOUND", "message": str(exc)})
    except KeyError as exc:
        logger.error("Scene or data key missing: %s", exc)
        raise HTTPException(status_code=422, detail={"error": "SCENE_NOT_FOUND", "message": f"Scene or key not found: {exc}"})
    except ValueError as exc:
        logger.error("Invalid parameter: %s", exc)
        raise HTTPException(status_code=422, detail={"error": "INVALID_PARAMETER", "message": str(exc)})
    except Exception as exc:
        logger.exception("Full pipeline error: %s", exc)
        raise HTTPException(status_code=500, detail={"error": "PIPELINE_ERROR", "message": "An internal pipeline error occurred. Check server logs."})
