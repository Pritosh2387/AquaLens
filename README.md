# AquaLens — Satellite Oil Spill Detection, Vessel Attribution & Response System

![Python](https://img.shields.io/badge/Python-3.11+-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-00a393)
![React](https://img.shields.io/badge/React-19+-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-8+-646CFF?logo=vite&logoColor=white)
![Tests](https://img.shields.io/badge/tests-243%20passed-brightgreen)
![Mode](https://img.shields.io/badge/data-MOCK%20only-orange)
![License](https://img.shields.io/badge/license-MIT-blue)

A full-stack, 17-module ML/AI pipeline prototype for satellite-based oil spill monitoring. The system processes synthetic SAR and optical satellite scenes end-to-end — from raw pixel detection through vessel attribution, spill forecasting, uncertainty quantification, response planning, explainability, and rule-based action recommendation — all exposed via a production-ready **FastAPI** REST interface and visualised through a **React + Vite** maritime command centre dashboard.

> [!WARNING]
> **SYNTHETIC DATA ONLY.** This system runs in `MOCK` mode. All scenes, vessels, AIS tracks, ocean data, and geographic assets are procedurally generated. Outputs are for **software architecture validation only** — they are not operational forecasts, scientific measurements, or legal attribution evidence.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Module Reference](#2-module-reference)
3. [Architecture & Data Flow](#3-architecture--data-flow)
4. [Project Structure](#4-project-structure)
5. [Installation](#5-installation)
6. [Running Locally](#6-running-locally)
7. [REST API](#7-rest-api)
8. [Pipeline Modes](#8-pipeline-modes)
9. [Per-Module API Reference](#9-per-module-api-reference)
10. [Decision Support: M16 & M17](#10-decision-support-m16--m17)
11. [Data Provenance System](#11-data-provenance-system)
12. [Configuration Reference](#12-configuration-reference)
13. [Testing](#13-testing)
14. [Integrating Real Data](#14-integrating-real-data)
15. [Disclaimers](#15-disclaimers)

---

## 1. System Overview

AquaLens is a prototype designed to answer the question:

> *"Given a satellite overpass of a suspected oil spill, what happened, who is likely responsible, what will happen next, and what should responders do?"*

The system chains 17 independent, testable modules across three operational phases:

| Phase | Modules | Purpose |
|---|---|---|
| **Detection & Processing** | M1-M5 | Extract spill boundaries, sensor confidence, and ship positions from satellite imagery |
| **Attribution & Forecast** | M6-M10 | Correlate AIS activity, estimate spill origins, forecast drift, quantify uncertainty |
| **Response & Decision Support** | M11-M17 | Score impact and urgency, optimize resource allocation, simulate scenarios, and recommend actions |

---

## 2. Module Reference

| # | Name | API Path | Provenance | Description |
|---:|---|---|---|---|
| 1 | Data Processing | `/modules/1/process` | `OBSERVED` | Multi-modal feature extraction from SAR and optical imagery |
| 2 | Oil Spill Detection | `/modules/2/detect` | `OBSERVED` | SAR-based segmentation using a U-Net interface; outputs probability maps and spill polygons |
| 3 | Sensor Fusion | `/modules/3/fuse` | `OBSERVED` | Weighted confidence fusion combining SAR and optical channel contributions |
| 4 | Oil Confidence | `/modules/4/confidence` | `OBSERVED` | Look-alike discrimination (wind slicks, biogenic films) and final confidence scoring |
| 5 | Ship Detection | `/modules/5/ships` | `OBSERVED` | CFAR-based physical vessel detection on SAR imagery |
| 6 | AIS Anomaly | `/modules/6/ais-match` | `INFERRED` | Matches satellite-detected ships against AIS tracks; flags dark vessels and gap patterns |
| 7 | Hindcast Origin | `/modules/7/hindcast` | `INFERRED` | Backward particle integration to estimate likely spill origin zones |
| 8 | Vessel Attribution | `/modules/8/attribution` | `INFERRED` | Evidence-based ranking of vessel candidates |
| 9 | Spill Forecast | `/modules/9/forecast` | `SIMULATED` | Forward particle drift simulation for 6, 12, 24, 48, and 72-hour horizons |
| 10 | Uncertainty | `/modules/10/uncertainty` | `SIMULATED` | Monte Carlo perturbation of wind/current fields |
| 11 | Impact Prediction | `/modules/11/impact` | `SIMULATED` | Evaluates threat severity to nearby assets |
| 12 | Priority Scoring | `/modules/12/priority` | `SIMULATED` | Computes a transparent 0-100 urgency score |
| 13 | Resource Optimization | `/modules/13/optimize` | `SIMULATED` | Greedy allocation of a mock response fleet |
| 14 | What-If Simulation | `/modules/14/what-if` | `SIMULATED` | **Standalone.** Compares 4 response scenarios |
| 15 | Prediction Feedback | `/modules/15/feedback` | `FEEDBACK` | **Standalone.** Computes IoU, centroid error, and recalibration factor |
| 16 | Evidence Graph | `/modules/16/evidence` | `SIMULATED` | Assembles a directed evidence graph with natural-language explanations |
| 17 | Action Recommendation | `/modules/17/recommend` | `SIMULATED` | Transparent rule-based decision support across 6 action categories |

> [!IMPORTANT]
> Modules 8, 11-14, 16, and 17 are **decision-support prototypes** using configurable heuristic weights. Vessel attribution language is circumstantial and non-legal. All recommendations require human review before any operational action.

---

## 3. Architecture & Data Flow

```
SAR + Optical Imagery
        |
        v
+---------------------------------------------------+
|  PHASE 1: DETECTION & PROCESSING                  |
|                                                   |
|  M1 Data Processing ---> M2 Spill Detection       |
|         |                      |                  |
|         +-----------> M3 Sensor Fusion            |
|                             |                     |
|                        M4 Oil Confidence          |
|                                                   |
|  M1 -----------------> M5 Ship Detection          |
+---------------------------------------------------+
        |
        v
+---------------------------------------------------+
|  PHASE 2: ATTRIBUTION & FORECAST                  |
|                                                   |
|  M5 ---> M6 AIS Anomaly                           |
|  M2 ---> M7 Hindcast Origin                       |
|  M6 + M7 ---> M8 Vessel Attribution [INFERRED]    |
|                                                   |
|  M2 ---> M9 Forward Forecast       [SIMULATED]    |
|  M9 ---> M10 Uncertainty / MC      [SIMULATED]    |
+---------------------------------------------------+
        |
        v
+---------------------------------------------------+
|  PHASE 3: RESPONSE & DECISION SUPPORT             |
|                                                   |
|  M10 ---> M11 Impact Prediction    [SIMULATED]    |
|  M11 ---> M12 Priority Scoring     [SIMULATED]    |
|  M11 ---> M13 Resource Optimizer   [SIMULATED]    |
|                                                   |
|  M13 --> M14 What-If Sim   [STANDALONE/SIMULATED] |
|  M9  --> M15 Pred Feedback [STANDALONE/FEEDBACK]  |
|                                                   |
|  M2-M13 --> M16 Evidence Graph      [SIMULATED]   |
|  M16    --> M17 Action Recommender  [SIMULATED]   |
+---------------------------------------------------+
```

**Key design decisions:**
- M14 (What-If) and M15 (Prediction Feedback) are **intentionally standalone** — operators call these independently with custom scenario parameters, not as part of the main sequential pipeline.
- M16 and M17 are **synthesizers** — they consume all upstream outputs but do not re-run any module.
- Every module is independently callable via its own REST endpoint.

---

## 4. Project Structure

```
SIH-26/                             # Monorepo root
├── .gitignore                      # Root gitignore (Python + Node + data)
├── .gitattributes                  # Line-ending normalization (LF/CRLF)
├── README.md
├── start_localhost.ps1             # Launch both servers (PowerShell)
├── start_localhost.bat             # Launch both servers (CMD/Windows)
│
├── backend/                        # FastAPI Python backend
│   ├── .gitignore
│   ├── main.py                     # FastAPI app bootstrap, CORS, router mounting
│   ├── requirements.txt
│   │
│   ├── api/
│   │   ├── routes/
│   │   │   ├── health.py           # GET /api/v1/health
│   │   │   ├── modules.py          # POST /api/v1/modules/{1-17}/...
│   │   │   └── pipeline.py         # POST /api/v1/pipeline/run
│   │   ├── pipeline_service.py     # Service layer: run_module1() through run_module17()
│   │   ├── schemas.py              # Pydantic request/response models
│   │   └── serializers.py          # numpy -> JSON type coercion
│   │
│   ├── configs/
│   │   └── config.yaml             # All thresholds, paths, fleet defaults, MC settings
│   │
│   ├── src/
│   │   ├── data_processing/        # M1 - feature extraction pipeline
│   │   ├── oil_spill_detection/    # M2 - U-Net inference engine
│   │   ├── fusion/                 # M3 - SAR/optical fusion engine
│   │   ├── confidence/             # M4 - confidence and look-alike discriminator
│   │   ├── ship_detection/         # M5 - CFAR ship detector
│   │   ├── ais/                    # M6 - AIS matcher and anomaly engine
│   │   ├── hindcast/               # M7 - backward particle integrator
│   │   ├── attribution/            # M8 - vessel ranking engine
│   │   ├── forecast/               # M9 - forward plume simulator
│   │   ├── uncertainty/            # M10 - Monte Carlo uncertainty engine
│   │   ├── impact/                 # M11 - asset impact scorer
│   │   ├── priority/               # M12 - priority/urgency engine
│   │   ├── resource_optimization/  # M13 - fleet allocator + mock fleet registry
│   │   ├── whatif/                 # M14 - what-if scenario simulator
│   │   ├── feedback/               # M15 - IoU and centroid error comparator
│   │   ├── explainability/         # M16 - evidence graph engine
│   │   ├── action_recommendation/  # M17 - rule-based action recommender
│   │   ├── mock_data/              # Synthetic scene, AIS, ocean, and asset generators
│   │   └── utils/                  # Logging, config loading, seeding, visualization
│   │
│   ├── scripts/
│   │   ├── run_demo.py             # End-to-end CLI demo (--extended for M16/M17)
│   │   ├── generate_mock_data.py   # Pre-generate all synthetic data
│   │   ├── train_segmentation.py   # U-Net training script
│   │   ├── run_inference.py        # Single-scene inference
│   │   └── evaluate.py             # Model evaluation metrics
│   │
│   ├── tests/
│   │   ├── test_api.py             # 118 tests: M1-M15, pipeline, health, schema validation
│   │   └── test_modules_16_17.py   # 125 tests: M16, M17, extended pipeline, edge cases
│   │
│   └── data/
│       ├── mock/                   # Auto-generated synthetic input scenes (gitignored)
│       ├── raw/                    # Raw input data (gitignored)
│       └── processed/              # Processed data cache (gitignored)
│
└── frontend/                       # React + Vite maritime dashboard
    ├── .gitignore
    ├── .env.example                # Template — copy to .env and set VITE_API_BASE_URL
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    ├── index.html
    │
    ├── public/
    │   └── assets/                 # Static map overlays and satellite imagery
    │
    └── src/
        ├── api/                    # Axios API clients for all 17 modules
        ├── app/                    # App root, providers, and router
        ├── components/
        │   ├── charts/             # Recharts visualisations
        │   ├── evidence/           # Evidence graph components
        │   ├── layout/             # Sidebar, TopCommandBar, DashboardLayout
        │   ├── maps/               # Leaflet maritime map components
        │   ├── maritime/           # 3D globe, forecast timeline, vessel modal
        │   └── ui/                 # Reusable UI primitives
        ├── config/                 # Navigation and app constants
        ├── hooks/                  # React Query hooks for every module
        ├── pages/                  # One page per module (Detection, Attribution, etc.)
        ├── schemas/                # Zod validation schemas
        ├── stores/                 # Zustand global state
        ├── types/                  # TypeScript API and domain types
        └── utils/                  # Formatters, provenance helpers, class names
```

---

## 5. Installation

### Requirements

| Tool | Version |
|---|---|
| Python | 3.11+ |
| Node.js | 18+ |
| npm | 9+ |

### Backend Setup

```bash
# 1. Clone the repository
git clone https://github.com/Pritosh2387/Aqualens.git
cd Aqualens

# 2. (Recommended) Create a virtual environment
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# 3. Install Python dependencies
cd Server
pip install -r requirements.txt

# 4. (Optional) Pre-generate mock data
#    The API auto-generates missing data on first request if you skip this.
python scripts/generate_mock_data.py
```

All paths in `backend/configs/config.yaml` are relative to the `backend/` directory. Always run backend commands from `backend/`.

### Frontend Setup

```bash
# From the repo root:
cd Client

# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env if your backend runs on a different port/host

# 3. Start dev server
npm run dev
```

---

## 6. Running Locally

### Quick Start — Both Servers at Once

**PowerShell (recommended on Windows):**
```powershell
.\start_localhost.ps1
```

**Command Prompt:**
```cmd
start_localhost.bat
```

This launches both servers in separate terminal windows.

### Manual Start

**Backend (FastAPI):**
```bash
cd Server
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

**Frontend (React + Vite):**
```bash
cd Client
npm run dev
```

### Service URLs

| Service | URL |
|---|---|
| Frontend Dashboard | http://localhost:5173 |
| Backend Swagger UI | http://localhost:8000/docs |
| Backend ReDoc | http://localhost:8000/redoc |
| Health Check | http://localhost:8000/api/v1/health |

### CLI Demo (Backend Only)

The demo script runs the pipeline directly without a web server.

**Standard Demo — Modules 1-10:**
```bash
cd Server
python scripts/run_demo.py SCENE_001
```

**Extended Demo — All 17 Modules:**
```bash
cd Server
python scripts/run_demo.py SCENE_001 --extended
```

Sample extended output:
```
--- EXTENDED DEMO MODE ENABLED ---
[Module 11] Predicting Impact...       -> HIGH (severity=0.14, impact=0.69)
[Module 12] Scoring Priority...        -> 66.9 / 100  (HIGH_PRIORITY)
[Module 13] Optimizing Resources...    -> 3 assets allocated, coverage=1.00
[Module 16] Assembling Evidence Graph  -> 12 nodes, 11 edges, 5 explanations
[Module 17] Generating Recommendation  -> DEPLOY_RESOURCES

PIPELINE COMPLETE - 17-MODULE EXTENDED DEMO SUMMARY
  [M16] EXPLAINABILITY / EVIDENCE GRAPH
    Evidence Nodes   : 12
    Evidence Edges   : 11
    Provenance Stats : {OBSERVED: 4, INFERRED: 3, SIMULATED: 5}
  [M17] ACTION RECOMMENDATION
    Recommended      : DEPLOY_RESOURCES
    Priority         : HIGH_PRIORITY
    Urgency Score    : 66.88
    Confidence       : 0.7463
========================================================================
```

**Other CLI Scripts:**
```bash
cd Server
python scripts/train_segmentation.py   # Train the U-Net model
python scripts/run_inference.py SCENE_001
python scripts/evaluate.py
python -m pytest tests/ -v             # Full 243-test suite
```

---

## 7. REST API

Start the backend server, then navigate to `http://localhost:8000/docs` for the interactive Swagger UI.

### Standard Request Body (Scene-Based Modules M1-M13, M16-M17)

```json
{
  "scene_id": "SCENE_001",
  "config_path": "configs/config.yaml"
}
```

### Full Endpoint List

| Method | Path | Module | Description |
|---|---|---|---|
| `GET` | `/api/v1/health` | - | Service health; lists all 17 module statuses and API version |
| `POST` | `/api/v1/pipeline/run` | M1-M17 | Orchestrated pipeline (see Pipeline Modes) |
| `POST` | `/api/v1/modules/1/process` | M1 | Data processing and feature extraction |
| `POST` | `/api/v1/modules/2/detect` | M2 | Oil spill segmentation |
| `POST` | `/api/v1/modules/3/fuse` | M3 | SAR + optical sensor fusion |
| `POST` | `/api/v1/modules/4/confidence` | M4 | Oil confidence and look-alike assessment |
| `POST` | `/api/v1/modules/5/ships` | M5 | Physical ship detection |
| `POST` | `/api/v1/modules/6/ais-match` | M6 | AIS matching and anomaly analysis |
| `POST` | `/api/v1/modules/7/hindcast` | M7 | Spill-origin hindcast |
| `POST` | `/api/v1/modules/8/attribution` | M8 | Vessel candidate ranking |
| `POST` | `/api/v1/modules/9/forecast` | M9 | Forward drift forecast (6-72 h) |
| `POST` | `/api/v1/modules/10/uncertainty` | M10 | Monte Carlo uncertainty quantification |
| `POST` | `/api/v1/modules/11/impact` | M11 | Impact prediction and severity |
| `POST` | `/api/v1/modules/12/priority` | M12 | Priority / urgency scoring |
| `POST` | `/api/v1/modules/13/optimize` | M13 | Response fleet allocation |
| `POST` | `/api/v1/modules/14/what-if` | M14 | What-if scenario comparison *(standalone)* |
| `POST` | `/api/v1/modules/15/feedback` | M15 | Forecast vs. observation feedback *(standalone)* |
| `POST` | `/api/v1/modules/16/evidence` | M16 | Explainability / evidence graph |
| `POST` | `/api/v1/modules/17/recommend` | M17 | Action recommendation |

---

## 8. Pipeline Modes

The `/api/v1/pipeline/run` endpoint supports three execution modes.

### Mode 1 — Default (M1-M10)

```bash
curl -X POST http://localhost:8000/api/v1/pipeline/run \
  -H "Content-Type: application/json" \
  -d '{"scene_id": "SCENE_001", "config_path": "configs/config.yaml"}'
```

### Mode 2 — Extended Response (M1-M13)

Adds Impact, Priority, and Resource Optimization to the pipeline response.

```json
{
  "scene_id": "SCENE_001",
  "config_path": "configs/config.yaml",
  "include_modules_11_15": true
}
```

### Mode 3 — Full Decision Support (M1-M13, M16-M17)

Also runs the Evidence Graph and Action Recommendation.

```json
{
  "scene_id": "SCENE_001",
  "config_path": "configs/config.yaml",
  "include_modules_16_17": true
}
```

> M14 (What-If) and M15 (Prediction Feedback) are never included in the pipeline run. They are intentionally **standalone-only** endpoints.

---

## 9. Per-Module API Reference

### Module 13 — Resource Optimization (with fleet override)

```json
{
  "scene_id": "SCENE_001",
  "config_path": "configs/config.yaml",
  "resource_override": [
    {
      "type": "skimmer",
      "count": 2,
      "speed_knots": 8.0,
      "capacity_tons": 50.0,
      "range_km": 300.0,
      "home_lat": 12.0,
      "home_lon": 72.0
    }
  ]
}
```

### Module 14 — What-If Simulation (standalone)

```json
{
  "scene_id": "SCENE_001",
  "config_path": "configs/config.yaml",
  "scenario": "OPTIMIZED",
  "delay_hours": 0,
  "additional_resources": 0,
  "alternative_allocation": [
    { "resource_type": "skimmer", "target_asset": "COAST_ASSET_1" }
  ]
}
```

Available scenarios: `OPTIMIZED`, `DELAYED`, `NO_ACTION`, `ADDITIONAL_RESOURCES`, `ALTERNATIVE`.

### Module 15 — Prediction Feedback (standalone, no scene_id)

Directly compare two GeoJSON polygons. Coordinates must be `[longitude, latitude]` (GeoJSON order):

```json
{
  "predicted_polygon": {
    "type": "Polygon",
    "coordinates": [[[72.0,12.0],[72.3,12.0],[72.3,12.3],[72.0,12.3],[72.0,12.0]]]
  },
  "observed_polygon": {
    "type": "Polygon",
    "coordinates": [[[72.05,12.05],[72.35,12.05],[72.35,12.35],[72.05,12.35],[72.05,12.05]]]
  }
}
```

Response includes: `iou_score`, `centroid_error_km`, `area_error_km2`, `recalibration_factor`, `recalibration_label`.

---

## 10. Decision Support: M16 & M17

### Module 16 — Evidence Graph / Explainability

Assembles a **directed evidence graph** linking M2-M15 outputs into a transparent chain of evidence. Each node records:

- `source_module` — e.g., `M2`, `M8`, `M12`
- `provenance` — `OBSERVED`, `INFERRED`, `SIMULATED`, or `FEEDBACK`
- `status` — `positive`, `negative`, `verified`, `uncertain`, `simulated`, or `feedback`
- `confidence` — confidence value where applicable

Natural-language explanations generated for:

| Decision | Source Modules |
|---|---|
| `spill_credibility` | M2, M3, M4 |
| `vessel_attribution` | M6, M7, M8 |
| `priority_score` | M11, M12 |
| `resource_allocation` | M12, M13 |
| `whatif_recommendation` | M14 |
| `forecast_confidence` | M9, M10, M15 |

### Module 17 — Action Recommendation

**Action categories and trigger conditions:**

| Action | Condition |
|---|---|
| `MONITOR` | Low spill probability or confidence; no immediate threat |
| `VERIFY` | Detection probability below verification threshold; request additional imagery |
| `INVESTIGATE` | Moderate priority score; data quality warrants further investigation |
| `DEPLOY_RESOURCES` | High priority with actionable confidence; resources available |
| `URGENT_RESPONSE` | Critical priority score with high detection confidence |
| `ESCALATE` | Critical priority combined with high uncertainty or strong attribution signals |

Full response structure:

```json
{
  "recommendation": {
    "action": "DEPLOY_RESOURCES",
    "priority": "HIGH_PRIORITY",
    "urgency_score": 66.88,
    "confidence": 0.7463
  },
  "reasoning": ["Priority score 66.9 exceeds HIGH threshold of 60.0"],
  "recommended_actions": [
    {"step": "Deploy skimmer fleet to predicted 24h spill boundary", "priority": "HIGH"}
  ],
  "vessel_investigation": {
    "recommended": true,
    "vessel": "MV_TANKER_ALPHA",
    "reason": "Highest-ranked attribution candidate (circumstantial evidence only)"
  },
  "evidence_summary": "12-node evidence graph (4 OBSERVED, 3 INFERRED, 5 SIMULATED)",
  "data_type": "SIMULATED",
  "disclaimer": "Decision-support only. Not an autonomous operational command."
}
```

---

## 11. Data Provenance System

Every module output carries a provenance label. Labels are never downgraded (SIMULATED data is never relabelled as OBSERVED).

| Label | Meaning |
|---|---|
| `MOCK` | The input scene and all underlying data are synthetically generated |
| `OBSERVED` | Value derived directly from synthetic sensor data (SAR pixels, AIS messages) |
| `INFERRED` | Analytical estimate derived from one or more OBSERVED upstream outputs |
| `SIMULATED` | Output of a particle simulation, Monte Carlo run, or planning heuristic |
| `FEEDBACK` | Accuracy metric comparing a past SIMULATED forecast against a supplied observation |

The evidence graph (M16) uses these labels per-node to make the provenance chain fully auditable.

---

## 12. Configuration Reference

All system behaviour is controlled by `backend/configs/config.yaml`. Key sections:

```yaml
# Simulation settings (M7, M9)
simulation:
  num_particles: 500
  hindcast_hours: 6
  forecast_horizons: [6, 12, 24, 48, 72]

# Monte Carlo (M10)
uncertainty:
  num_simulations: 100

# Impact heuristics (M11) - prototype values only, not scientifically validated
impact:
  asset_sensitivity:
    marine_protected_area: 0.95
    fishery_zone: 0.75
    coastline: 0.80

# Priority weights (M12) - configurable
priority_scoring:
  weights:
    confidence: 0.30
    impact: 0.35
    uncertainty: 0.20
    area: 0.15

# Fleet defaults (M13)
resource_optimization:
  fleet:
    - { type: skimmer, count: 3, speed_knots: 6, capacity_tons: 100 }
    - { type: patrol_vessel, count: 4, speed_knots: 15, range_km: 500 }
    - { type: aircraft, count: 2, speed_knots: 120, range_km: 800 }

# Action recommendation thresholds (M17)
action_recommendation:
  thresholds:
    confidence_low: 0.40
    confidence_verification: 0.70
    priority_critical: 80.0
    priority_high: 60.0
    priority_medium: 40.0
```

---

## 13. Testing

The repository includes **243 fully automated tests** covering all 17 modules.

```bash
cd backend

# Run the full test suite
python -m pytest tests/ -v

# Run only API tests (M1-M15 + pipeline + schemas)
python -m pytest tests/test_api.py -v

# Run only M16/M17 tests
python -m pytest tests/test_modules_16_17.py -v

# Test collection summary only
python -m pytest --collect-only -q
```

**Test coverage breakdown:**
- `tests/test_api.py` — 118 tests: Modules 1-15, pipeline flags, health endpoint, Pydantic schema validation for `ResourceOverride`, `AlternativeAllocation`, `GeoJSONPolygon`
- `tests/test_modules_16_17.py` — 125 tests: Module 16, Module 17, extended pipeline, graceful None-handling for M14/M15, JSON serializability, provenance label integrity, all 6 action categories

---

## 14. Integrating Real Data

The mock generators in `backend/src/mock_data/` must be replaced with real operational data sources for production use:

| Component | Replace With |
|---|---|
| SAR scenes | Calibrated Sentinel-1 GRD/SLC products (ESA SNAP preprocessed) |
| Optical scenes | Sentinel-2 L2A or cloud-filtered multispectral imagery |
| AIS tracks | Live or replayed AIS streams (MarineTraffic, ExactEarth, EMSA CleanSeaNet) |
| Ocean currents | Copernicus Marine (CMEMS) or HYCOM model outputs |
| Wind fields | ERA5 reanalysis or operational NWP forecasts |
| Geographic assets | Verified coastline, MPA, fishery zone, and port shapefiles |
| Vessel registry | Official vessel registration database (IMO records) |

All thresholds in `backend/configs/config.yaml` require calibration by domain experts using real incident data before any operational deployment.

---

## 15. Disclaimers

- **No scientific validity.** All outputs are generated from synthetic data. No module has been validated against real satellite observations.
- **No legal attribution.** Vessel rankings (M8) and investigation recommendations (M17) are based on circumstantial evidence patterns. They do not constitute legal evidence, establish causation, or support enforcement action.
- **Human oversight required.** All action recommendations (M17) are decision-support outputs intended to assist trained human operators. They are not autonomous commands.
- **Heuristic weights.** Impact sensitivity values (M11), priority scoring weights (M12), and action thresholds (M17) are configurable prototype defaults. They are not scientifically validated constants.
- **MOCK mode.** The field `"mode": "MOCK"` is present in every API response to clearly communicate that outputs are synthetic.
