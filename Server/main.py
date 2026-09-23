"""
main.py — AquaLens FastAPI Application Entry Point

AquaLens
15-Module ML/AI Pipeline API

Start with:
    uvicorn main:app --reload --host 0.0.0.0 --port 8000

Docs:
    http://localhost:8000/docs
    http://localhost:8000/redoc
"""
import sys
import os
import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Ensure project root is on the path so src.* imports resolve correctly
# when uvicorn is launched from the project root directory.
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from api.routes.health import router as health_router
from api.routes.modules import router as modules_router
from api.routes.pipeline import router as pipeline_router

# ──────────────────────────────────────────────────────────────────────────────
# Logging
# ──────────────────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
)
logger = logging.getLogger("AquaLensAPI")

# ──────────────────────────────────────────────────────────────────────────────
# FastAPI Application
# ──────────────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="AquaLens API",
    description=(
        "## AquaLens ML Pipeline API\n\n"
        "RESTful API exposing all 17 modules of the AquaLens "
        "Detection, Attribution, Response & Decision Support System.\n\n"
        "### Detection / Attribution / Forecast (Modules 1–10)\n"
        "| # | Module | Data Type |\n"
        "|---|--------|-----------|\n"
        "| 1 | Data Processing & Feature Engineering | OBSERVED |\n"
        "| 2 | Oil Spill Detection (U-Net) | OBSERVED |\n"
        "| 3 | SAR + Optical Sensor Fusion | OBSERVED |\n"
        "| 4 | Oil Confidence & Look-Alike | OBSERVED |\n"
        "| 5 | Physical Ship Detection | OBSERVED |\n"
        "| 6 | AIS Matching + Anomaly Detection | INFERRED |\n"
        "| 7 | Hindcast / Spill Origin Estimation | INFERRED |\n"
        "| 8 | Vessel Attribution | INFERRED |\n"
        "| 9 | Forward Spill Forecast | SIMULATED |\n"
        "| 10 | Uncertainty Quantification (Monte Carlo) | SIMULATED |\n\n"
        "### Response & Decision Support (Modules 11–17)\n"
        "| # | Module | Data Type |\n"
        "|---|--------|-----------|\n"
        "| 11 | Impact Prediction | SIMULATED |\n"
        "| 12 | Priority / Urgency Scoring | SIMULATED |\n"
        "| 13 | Resource Optimization | SIMULATED |\n"
        "| 14 | What-If Response Simulation | SIMULATED |\n"
        "| 15 | Prediction vs Reality Feedback | FEEDBACK |\n"
        "| 16 | Explainability / Evidence Graph | SIMULATED |\n"
        "| 17 | Action Recommendation | SIMULATED |\n\n"
        "### Pipeline Modes\n"
        "- **Default** (`include_modules_16_17=false`, `include_modules_11_15=false`): Runs M1–M10\n"
        "- **Extended** (`include_modules_16_17=true`): Runs M1–M13, M16, M17\n"
        "- **M14 and M15** are standalone endpoints only\n\n"
        "### ⚠️ Important\n"
        "All results are generated from **SYNTHETIC MOCK DATA** and are **NOT** scientifically "
        "valid measurements. The `mode: MOCK` field and OBSERVED/INFERRED/SIMULATED/FEEDBACK labels "
        "are preserved throughout all responses to clearly communicate data provenance."
    ),
    version="2.0.0",

    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# ──────────────────────────────────────────────────────────────────────────────
# CORS — configured for React frontend development
# ──────────────────────────────────────────────────────────────────────────────
CORS_ORIGINS = os.environ.get(
    "CORS_ORIGINS",
    "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ──────────────────────────────────────────────────────────────────────────────
# Global Exception Handler — never expose internal stack traces to clients
# ──────────────────────────────────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception for %s %s: %s", request.method, request.url, exc)
    return JSONResponse(
        status_code=500,
        content={"error": "INTERNAL_ERROR", "message": "An unexpected error occurred. Check server logs."},
    )

# ──────────────────────────────────────────────────────────────────────────────
# Routers
# ──────────────────────────────────────────────────────────────────────────────
API_PREFIX = "/api/v1"

app.include_router(health_router, prefix=API_PREFIX)
app.include_router(modules_router, prefix=API_PREFIX)
app.include_router(pipeline_router, prefix=API_PREFIX)

# ──────────────────────────────────────────────────────────────────────────────
# Root redirect to docs
# ──────────────────────────────────────────────────────────────────────────────
@app.get("/", include_in_schema=False)
def root():
    return JSONResponse(
        content={
            "service": "AquaLens ML API",
            "docs": "/docs",
            "redoc": "/redoc",
            "health": "/api/v1/health",
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
