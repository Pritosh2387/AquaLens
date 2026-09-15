"""
api/routes/health.py — Health check endpoint.

GET /api/v1/health
"""
from fastapi import APIRouter
from api.schemas import HealthResponse

router = APIRouter()

_MODULES = {
    "module_1_data_processing": "available",
    "module_2_oil_spill_detection": "available",
    "module_3_sar_optical_fusion": "available",
    "module_4_oil_confidence": "available",
    "module_5_ship_detection": "available",
    "module_6_ais_anomaly": "available",
    "module_7_hindcast": "available",
    "module_8_attribution": "available",
    "module_9_forecast": "available",
    "module_10_uncertainty": "available",
    "module_11_impact_prediction": "available",
    "module_12_priority_scoring": "available",
    "module_13_resource_optimization": "available",
    "module_14_whatif_simulation": "available",
    "module_15_prediction_feedback": "available",
    "module_16_explainability_evidence": "available",
    "module_17_action_recommendation": "available",
}


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="API Health Check",
    description=(
        "Returns the operational status of the AquaLens API "
        "and reports availability of all 17 ML pipeline modules."
    ),
    tags=["Health"],
)
def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        service="AquaLens ML API",
        mode="MOCK",
        version="2.0.0",
        modules=_MODULES,
    )

