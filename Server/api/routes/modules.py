"""
api/routes/modules.py — Individual module endpoint routes (Modules 1–15).

POST /api/v1/modules/1/process
POST /api/v1/modules/2/detect
POST /api/v1/modules/3/fuse
POST /api/v1/modules/4/confidence
POST /api/v1/modules/5/ships
POST /api/v1/modules/6/ais-match
POST /api/v1/modules/7/hindcast
POST /api/v1/modules/8/attribution
POST /api/v1/modules/9/forecast
POST /api/v1/modules/10/uncertainty
POST /api/v1/modules/11/impact
POST /api/v1/modules/12/priority
POST /api/v1/modules/13/optimize
POST /api/v1/modules/14/what-if
POST /api/v1/modules/15/feedback
"""
import logging

from fastapi import APIRouter, HTTPException

from api.schemas import (
    Module1Request, Module1Response,
    Module2Request, Module2Response,
    Module3Request, Module3Response,
    Module4Request, Module4Response,
    Module5Request, Module5Response,
    Module6Request, Module6Response,
    Module7Request, Module7Response,
    Module8Request, Module8Response,
    Module9Request, Module9Response,
    Module10Request, Module10Response,
    Module11Request, Module11Response,
    Module12Request, Module12Response,
    Module13Request, Module13Response,
    Module14Request, Module14Response,
    Module15Request, Module15Response,
    Module16Request, Module16Response,
    Module17Request, Module17Response,
)
from api.pipeline_service import (
    run_module1, run_module2, run_module3, run_module4, run_module5,
    run_module6, run_module7, run_module8, run_module9, run_module10,
    run_module11, run_module12, run_module13, run_module14, run_module15,
    run_module16, run_module17,
)

router = APIRouter(prefix="/modules")
logger = logging.getLogger("ModuleRoutes")


def _handle(fn, *args, **kwargs):
    """Call a service function and convert exceptions to HTTPExceptions."""
    try:
        return fn(*args, **kwargs)
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
        logger.exception("Internal pipeline error: %s", exc)
        raise HTTPException(status_code=500, detail={"error": "PIPELINE_ERROR", "message": "An internal pipeline error occurred. Check server logs."})


# ─────────────────────────────────────────────────────────────────────────────
# MODULE 1 — Data Processing & Feature Engineering
# ─────────────────────────────────────────────────────────────────────────────
@router.post(
    "/1/process",
    response_model=Module1Response,
    summary="Module 1 — Data Processing & Feature Engineering",
    description=(
        "Loads, cleans, aligns, normalizes, and extracts multi-modal features from SAR, Optical, "
        "AIS, Oceanographic, and Geographic data sources for the specified scene. "
        "Returns scene metadata and extracted feature vector."
    ),
    tags=["Modules"],
)
def module1_process(req: Module1Request):
    data = _handle(run_module1, req.scene_id, req.config_path)
    return data


# ─────────────────────────────────────────────────────────────────────────────
# MODULE 2 — Oil Spill Segmentation (U-Net)
# ─────────────────────────────────────────────────────────────────────────────
@router.post(
    "/2/detect",
    response_model=Module2Response,
    summary="Module 2 — Oil Spill Detection (U-Net Segmentation)",
    description=(
        "Runs U-Net segmentation inference on processed SAR imagery. "
        "Returns spill detection status, probability, affected area (km²), "
        "slick count, and polygon geometries."
    ),
    tags=["Modules"],
)
def module2_detect(req: Module2Request):
    return _handle(run_module2, req.scene_id, req.config_path)


# ─────────────────────────────────────────────────────────────────────────────
# MODULE 3 — SAR + Optical Sensor Fusion
# ─────────────────────────────────────────────────────────────────────────────
@router.post(
    "/3/fuse",
    response_model=Module3Response,
    summary="Module 3 — SAR + Optical Sensor Fusion",
    description=(
        "Fuses SAR and optical sensor data using the multi-modal fusion model. "
        "Returns fused spill probability and sensor contribution breakdown (SAR / Optical / Environmental)."
    ),
    tags=["Modules"],
)
def module3_fuse(req: Module3Request):
    return _handle(run_module3, req.scene_id, req.config_path)


# ─────────────────────────────────────────────────────────────────────────────
# MODULE 4 — Oil Confidence & Look-Alike Engine
# ─────────────────────────────────────────────────────────────────────────────
@router.post(
    "/4/confidence",
    response_model=Module4Response,
    summary="Module 4 — Oil Confidence & Look-Alike Discrimination",
    description=(
        "Evaluates oil spill detection confidence and discriminates true spills from dark look-alikes "
        "(natural sheens, sea foam, rain cells). Returns oil probability, confidence score, "
        "look-alike probability, and verification state."
    ),
    tags=["Modules"],
)
def module4_confidence(req: Module4Request):
    return _handle(run_module4, req.scene_id, req.config_path)


# ─────────────────────────────────────────────────────────────────────────────
# MODULE 5 — Physical Ship Detection
# ─────────────────────────────────────────────────────────────────────────────
@router.post(
    "/5/ships",
    response_model=Module5Response,
    summary="Module 5 — Physical Ship Detection",
    description=(
        "M5 detects physically observable vessels directly from satellite imagery and does NOT cross-reference AIS; AIS correlation is handled by Module 6."
    ),
    tags=["Modules"],
)
def module5_ships(req: Module5Request):
    return _handle(run_module5, req.scene_id, req.config_path)


# ─────────────────────────────────────────────────────────────────────────────
# MODULE 6 — AIS Matching + Anomaly Detection  [INFERRED]
# ─────────────────────────────────────────────────────────────────────────────
@router.post(
    "/6/ais-match",
    response_model=Module6Response,
    summary="Module 6 — AIS Matching & Anomaly Detection [INFERRED]",
    description=(
        "Matches satellite-detected vessels against AIS tracks using spatial-temporal proximity. "
        "Detects AIS transmission gaps, trajectory anomalies, and unmatched (dark) vessels. "
        "All results are labelled INFERRED — not directly observed."
    ),
    tags=["Modules"],
)
def module6_ais_match(req: Module6Request):
    return _handle(run_module6, req.scene_id, req.config_path)


# ─────────────────────────────────────────────────────────────────────────────
# MODULE 7 — Hindcast / Spill Origin Estimation  [INFERRED]
# ─────────────────────────────────────────────────────────────────────────────
@router.post(
    "/7/hindcast",
    response_model=Module7Response,
    summary="Module 7 — Hindcast / Spill Origin Estimation [INFERRED]",
    description=(
        "Runs backward-in-time particle integration to estimate where and when an oil spill originated. "
        "Returns origin centroid, top probability zones, and estimated release time window. "
        "Results are labelled INFERRED — not directly observed."
    ),
    tags=["Modules"],
)
def module7_hindcast(req: Module7Request):
    return _handle(run_module7, req.scene_id, req.config_path)


# ─────────────────────────────────────────────────────────────────────────────
# MODULE 8 — Vessel Attribution  [INFERRED]
# ─────────────────────────────────────────────────────────────────────────────
@router.post(
    "/8/attribution",
    response_model=Module8Response,
    summary="Module 8 — Vessel Attribution Engine [INFERRED]",
    description=(
        "Ranks candidate vessels most plausibly associated with the estimated spill origin "
        "using spatial distance, trajectory, AIS gap, and physical match evidence. "
        "Rankings are decision-support metrics only — not legal attribution. "
        "Results are labelled INFERRED."
    ),
    tags=["Modules"],
)
def module8_attribution(req: Module8Request):
    return _handle(run_module8, req.scene_id, req.config_path)


# ─────────────────────────────────────────────────────────────────────────────
# MODULE 9 — Forward Spill Forecast  [SIMULATED]
# ─────────────────────────────────────────────────────────────────────────────
@router.post(
    "/9/forecast",
    response_model=Module9Response,
    summary="Module 9 — Forward Spill Forecast [SIMULATED]",
    description=(
        "Runs physics-based particle advection forward simulation across 6h, 12h, 24h, 48h, and 72h horizons. "
        "Returns forecast polygon geometries and center coordinates for each horizon. "
        "Results are labelled SIMULATED — not real world predictions."
    ),
    tags=["Modules"],
)
def module9_forecast(req: Module9Request):
    return _handle(run_module9, req.scene_id, req.config_path)


# ─────────────────────────────────────────────────────────────────────────────
# MODULE 10 — Uncertainty / Monte Carlo  [SIMULATED]
# ─────────────────────────────────────────────────────────────────────────────
@router.post(
    "/10/uncertainty",
    response_model=Module10Response,
    summary="Module 10 — Uncertainty Quantification (Monte Carlo) [SIMULATED]",
    description=(
        "Runs N=100 Monte Carlo perturbation simulations to quantify forecast uncertainty "
        "and compute impact probabilities and ETA distributions for geographic assets "
        "(ports, protected areas, fisheries, beaches). "
        "Results are labelled SIMULATED — not real world predictions."
    ),
    tags=["Modules"],
)
def module10_uncertainty(req: Module10Request):
    return _handle(run_module10, req.scene_id, req.config_path)


# ─────────────────────────────────────────────────────────────────────────────
# MODULE 11 — Impact Prediction  [SIMULATED]
# ─────────────────────────────────────────────────────────────────────────────
@router.post(
    "/11/impact",
    response_model=Module11Response,
    summary="Module 11 — Impact Prediction [SIMULATED]",
    description=(
        "Extends Module 10 Monte Carlo asset impact_probability with spill severity scoring, "
        "geographic sensitivity classification (prototype heuristics), time-urgency factor, "
        "and per-asset weighted impact scores. Returns scene-level impact summary. "
        "NOTE: All sensitivity weights are PROTOTYPE HEURISTICS, not scientifically validated constants. "
        "Results are labelled SIMULATED."
    ),
    tags=["Modules"],
)
def module11_impact(req: Module11Request):
    return _handle(run_module11, req.scene_id, req.config_path)


# ─────────────────────────────────────────────────────────────────────────────
# MODULE 12 — Priority / Urgency Scoring  [SIMULATED]
# ─────────────────────────────────────────────────────────────────────────────
@router.post(
    "/12/priority",
    response_model=Module12Response,
    summary="Module 12 — Priority / Urgency Scoring [SIMULATED]",
    description=(
        "Computes a transparent 0–100 priority score for emergency response dispatch "
        "with per-factor explainability. Factors: Impact, TimeToImpact, OilSeverity, "
        "DetectionConfidence, EnvironmentalSensitivity, DataQuality. "
        "Weights are configurable via configs/config.yaml. "
        "Results are labelled SIMULATED."
    ),
    tags=["Modules"],
)
def module12_priority(req: Module12Request):
    return _handle(run_module12, req.scene_id, req.config_path)


# ─────────────────────────────────────────────────────────────────────────────
# MODULE 13 — Resource Optimization  [SIMULATED]
# ─────────────────────────────────────────────────────────────────────────────
@router.post(
    "/13/optimize",
    response_model=Module13Response,
    summary="Module 13 — Resource Optimization [SIMULATED]",
    description=(
        "Allocates mock response resources (skimmers, booms, vessels, drones, aircraft) "
        "to impact targets using a transparent greedy priority-weighted algorithm. "
        "Objective: maximize coverage of high-impact assets within resource constraints. "
        "All fleet data is synthetic mock data. Results are labelled SIMULATED."
    ),
    tags=["Modules"],
)
def module13_optimize(req: Module13Request):
    # Convert Optional[List[ResourceOverride]] → Optional[List[dict]] for the optimizer
    resource_override = (
        [r.model_dump(exclude_none=True) for r in req.resource_override]
        if req.resource_override is not None
        else None
    )
    return _handle(run_module13, req.scene_id, req.config_path, resource_override)


# ─────────────────────────────────────────────────────────────────────────────
# MODULE 14 — What-If Response Simulation  [SIMULATED]
# ─────────────────────────────────────────────────────────────────────────────
@router.post(
    "/14/what-if",
    response_model=Module14Response,
    summary="Module 14 — What-If Response Simulation [SIMULATED]",
    description=(
        "Compares four response scenarios (Optimised, Delayed, No Action, Additional Resources) "
        "plus an optional user-supplied Alternative scenario. "
        "Reuses Module 13 ResourceOptimizer in-process with modified parameters. "
        "Returns coverage_fraction, impact_reduction, and cost_index per scenario. "
        "Results are labelled SIMULATED."
    ),
    tags=["Modules"],
)
def module14_whatif(req: Module14Request):
    # Convert Optional[List[AlternativeAllocation]] → Optional[List[dict]] for the simulator
    alternative_allocation = (
        [a.model_dump() for a in req.alternative_allocation]
        if req.alternative_allocation is not None
        else None
    )
    return _handle(
        run_module14,
        req.scene_id,
        req.config_path,
        req.delay_hours,
        req.additional_resource_type,
        req.additional_resource_count,
        alternative_allocation,
    )


# ─────────────────────────────────────────────────────────────────────────────
# MODULE 15 — Prediction vs Reality Feedback  [FEEDBACK]
# ─────────────────────────────────────────────────────────────────────────────
@router.post(
    "/15/feedback",
    response_model=Module15Response,
    summary="Module 15 — Prediction vs Reality Feedback [FEEDBACK]",
    description=(
        "Compares a previous Module 9 forecast polygon against a new Module 2 observed polygon. "
        "Computes IoU (Intersection over Union), geodesic centroid error, area error, "
        "and an advisory recalibration factor. "
        "NOTE: Takes raw GeoJSON polygons directly in the request body — not a scene_id. "
        "The recalibration_factor is DISPLAY-ONLY and does NOT modify any model weights. "
        "Results are labelled FEEDBACK."
    ),
    tags=["Modules"],
)
def module15_feedback(req: Module15Request):
    # Convert GeoJSONPolygon Pydantic models to plain dicts for comparator
    return _handle(
        run_module15,
        req.predicted_polygon.model_dump(),
        req.observed_polygon.model_dump(),
        req.predicted_horizon_hours,
        req.prediction_made_timestamp,
        req.observation_timestamp,
        req.spill_origin,
    )


# ─────────────────────────────────────────────────────────────────────────────
# MODULE 16 — Explainability / Evidence Graph  [SIMULATED]
# ─────────────────────────────────────────────────────────────────────────────
@router.post(
    "/16/evidence",
    response_model=Module16Response,
    summary="Module 16 — Explainability / Evidence Graph [SIMULATED]",
    description=(
        "Assembles a structured evidence graph connecting the outputs of Modules 2–15 "
        "into a transparent chain of evidence. Answers 'Why did the system reach this conclusion?' "
        "for key decisions: spill credibility, vessel attribution, priority score, "
        "resource allocation, what-if recommendation, and forecast confidence. "
        "Evidence nodes preserve their original provenance labels "
        "(OBSERVED / INFERRED / SIMULATED / FEEDBACK). "
        "Vessel attribution language is circumstantial and non-legal. "
        "Results are labelled SIMULATED."
    ),
    tags=["Modules"],
)
def module16_evidence(req: Module16Request):
    return _handle(run_module16, req.scene_id, req.config_path)


# ─────────────────────────────────────────────────────────────────────────────
# MODULE 17 — Action Recommendation / Decision Support  [SIMULATED]
# ─────────────────────────────────────────────────────────────────────────────
@router.post(
    "/17/recommend",
    response_model=Module17Response,
    summary="Module 17 — Action Recommendation / Decision Support [SIMULATED]",
    description=(
        "Transforms outputs of Modules 10–16 into a transparent, rule-based action recommendation. "
        "Considers priority score, impact level, detection confidence, forecast uncertainty, "
        "resource availability, what-if scenario comparison, and evidence strength. "
        "Action categories: MONITOR, VERIFY, INVESTIGATE, DEPLOY_RESOURCES, URGENT_RESPONSE, ESCALATE. "
        "All recommendations are decision-support outputs only — NOT autonomous operational commands. "
        "Vessel investigation language is circumstantial and does not constitute legal attribution. "
        "Results are labelled SIMULATED."
    ),
    tags=["Modules"],
)
def module17_recommend(req: Module17Request):
    return _handle(run_module17, req.scene_id, req.config_path)
