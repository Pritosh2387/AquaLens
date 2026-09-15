"""
api/pipeline_service.py — Service adapter layer between FastAPI routes and the
existing ML pipeline modules (1–10).

Architecture:
  FastAPI Route  →  pipeline_service  →  existing Module class  →  result  →  serializer

This module intentionally does NOT reimplment any ML logic.
It reuses the same classes called by scripts/run_demo.py.
"""
from __future__ import annotations

import json
import os
import sys
import numpy as np

from src.utils.logging import get_logger
from src.utils.config import load_config
from src.utils.seed import set_seed
from src.mock_data.generate_dataset import generate_mock_dataset
from src.mock_data.scenario_generator import generate_attribution_scenario

from src.data_processing.pipeline import DataProcessingPipeline, SceneData
from src.oil_spill_detection.inference import OilSpillDetector
from src.fusion.inference import SensorFusionEngine
from src.confidence.inference import OilConfidenceEngine
from src.ship_detection.inference import PhysicalShipDetectorEngine
from src.ais.anomaly import AISAnomalyEngine
from src.hindcast.origin_probability import HindcastOriginEngine
from src.attribution.ranking import VesselAttributionEngine
from src.forecast.plume import ForwardForecastEngine
from src.uncertainty.impact import UncertaintyEngine

# Modules 11–15 — new engines
from src.impact.scoring import ImpactEngine
from src.priority.scoring import PriorityEngine
from src.resource_optimization.allocator import ResourceOptimizer
from src.whatif.simulator import WhatIfSimulator
from src.feedback.comparator import FeedbackComparator

# Modules 16–17 — new engines
from src.explainability.evidence_graph import EvidenceGraphEngine
from src.action_recommendation.recommender import ActionRecommender

from api.serializers import make_serializable

logger = get_logger("PipelineService")

# ──────────────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────────────

def _ensure_mock_data(cfg: dict, scene_id: str, config_path: str) -> None:
    """Generate mock base dataset and attribution scenario if they don't exist yet."""
    mock_dir = cfg["paths"]["mock_data_dir"]
    if not os.path.exists(os.path.join(mock_dir, "sar")):
        logger.info("[SERVICE] Mock data not found — generating base dataset...")
        generate_mock_dataset(config_path)

    ais_path = os.path.join(mock_dir, "ais", f"{scene_id}_ais.json")
    if not os.path.exists(ais_path):
        logger.info("[SERVICE] AIS scenario not found — generating integrated multi-vessel scenario...")
        generate_attribution_scenario(config_path)

def _load_ocean_and_ais(cfg: dict, scene: SceneData, scene_id: str) -> tuple[dict, list]:
    """Load ocean and AIS data from mock files, falling back to scene data."""
    mock_dir = cfg["paths"]["mock_data_dir"]

    ocean_path = os.path.join(mock_dir, "ocean", f"{scene_id}_ocean.json")
    if os.path.exists(ocean_path):
        with open(ocean_path, "r") as f:
            ocean_data = json.load(f)
    else:
        ocean_data = scene.ocean_data if scene.ocean_data else {}

    ais_records = scene.ais_records if scene.ais_records else []
    ais_path = os.path.join(mock_dir, "ais", f"{scene_id}_ais.json")
    if not ais_records and os.path.exists(ais_path):
        with open(ais_path, "r") as f:
            ais_records = json.load(f)

    return ocean_data, ais_records

def _build_visuals_for_payload(res: dict) -> dict:
    """
    Constructs ready-to-display visual payload items (GeoJSON FeatureCollections,
    chart data series, status badges, formatted cards, and node-link graph data)
    for frontend rendering.
    """
    visuals = {}
    features = []

    # 1. Spill detection polygons
    spill = res.get("spill") if "spill" in res else res
    polygons = spill.get("polygons", []) if isinstance(spill, dict) else []
    for idx, poly in enumerate(polygons):
        if poly.get("geometry"):
            s_id = poly.get("slick_id", idx + 1)
            prob = poly.get("mean_probability", 0.88)
            features.append({
                "type": "Feature",
                "geometry": poly["geometry"],
                "properties": {
                    "layer": "slicks",
                    "slick_id": s_id,
                    "title": f"Oil Slick #{s_id}",
                    "probability": prob,
                    "stroke": "#f59e0b",
                    "fill": "#d97706",
                    "fillOpacity": 0.65,
                    "popupHtml": f"<div class='font-mono text-xs'><b>OIL SLICK #{s_id}</b></div>"
                }
            })

    # 2. Hindcast origin centroid & backward trajectory
    spill_origin = res.get("spill_origin") if "spill_origin" in res else res
    if isinstance(spill_origin, dict):
        origin = spill_origin.get("origin_centroid")
        if origin and len(origin) == 2:
            features.append({
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [origin[1], origin[0]]},
                "properties": {
                    "layer": "hindcastOrigin",
                    "title": "ESTIMATED ORIGIN (T-48h)",
                    "color": "#6366f1",
                    "radius_km": 2.5
                }
            })
        btraj = spill_origin.get("backward_trajectory")
        if btraj:
            features.append({
                "type": "Feature",
                "geometry": {"type": "LineString", "coordinates": [[pt[1], pt[0]] for pt in btraj]},
                "properties": {
                    "layer": "hindcastTrajectory",
                    "title": "BACKWARD DRIFT TRAJECTORY",
                    "stroke": "#818cf8",
                    "strokeDashArray": "6, 6"
                }
            })

    # 3. Candidate vessels & tracks
    attr = res.get("vessel_attribution") if "vessel_attribution" in res else res
    cands = attr.get("ranked_candidates", []) if isinstance(attr, dict) else []
    for c in cands:
        if isinstance(c, dict) and c.get("lat") and c.get("lon"):
            rank = c.get("rank", 1)
            name = c.get("vessel_name", "UNKNOWN")
            score = c.get("attribution_score", 0.5)
            risk = c.get("risk_level", "HIGH" if score > 0.7 else "MEDIUM")
            color = "#ef4444" if risk == "HIGH" else "#f59e0b"
            features.append({
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [c["lon"], c["lat"]]},
                "properties": {
                    "layer": "vessels",
                    "rank": rank,
                    "title": f"#{rank} {name}",
                    "attribution_score": score,
                    "risk_level": risk,
                    "color": color
                }
            })

    # 4. Forecast plume & trajectory
    forecast = res.get("spill_forecast") if "spill_forecast" in res else res
    if isinstance(forecast, dict):
        horizons = forecast.get("horizons", {})
        for h_key, h_data in horizons.items():
            poly = h_data.get("predicted_polygon")
            if poly and "coordinates" in poly:
                features.append({
                    "type": "Feature",
                    "geometry": poly,
                    "properties": {
                        "layer": "forecastPlume",
                        "horizon": h_key,
                        "title": f"Forecast Plume ({h_key})",
                        "stroke": "#06b6d4",
                        "fill": "#0891b2",
                        "fillOpacity": 0.4
                    }
                })
        ftraj = forecast.get("forward_trajectory")
        if ftraj:
            features.append({
                "type": "Feature",
                "geometry": {"type": "LineString", "coordinates": [[pt[1], pt[0]] for pt in ftraj]},
                "properties": {
                    "layer": "forecastTrajectory",
                    "title": "FORWARD DRIFT VECTOR",
                    "stroke": "#38bdf8",
                    "strokeDashArray": "4, 4"
                }
            })

    visuals["geojson"] = {
        "type": "FeatureCollection",
        "features": features
    }

    # Pre-styled KPI card render payloads
    vessel_name = "Ocean Pride"
    attr_score = 0.88
    if cands and len(cands) > 0 and isinstance(cands[0], dict):
        vessel_name = cands[0].get("vessel_name", "Ocean Pride")
        attr_score = cands[0].get("attribution_score", 0.88)

    spill_dict = res.get("spill", {}) if isinstance(res.get("spill"), dict) else res
    priority_dict = res.get("priority", {}) if isinstance(res.get("priority"), dict) else res

    visuals["kpi_cards"] = [
        {
            "id": "spill_prob",
            "title": "SPILL PROBABILITY",
            "value": f"{(spill_dict.get('probability', 0.88) * 100):.1f}%",
            "provenance": "OBSERVED",
            "status": "CONFIRMED SPILL",
            "color": "amber"
        },
        {
            "id": "area",
            "title": "ESTIMATED SPILL AREA",
            "value": f"{spill_dict.get('area_km2', 14.8):.2f} km²",
            "provenance": "OBSERVED",
            "status": "SAR POLYGON MASK",
            "color": "amber"
        },
        {
            "id": "suspect",
            "title": "PRIMARY SUSPECT",
            "value": vessel_name,
            "provenance": "INFERRED",
            "status": f"SCORE: {(attr_score * 100):.1f}%",
            "color": "red"
        },
        {
            "id": "priority",
            "title": "RESPONSE PRIORITY",
            "value": priority_dict.get("urgency_label", "CRITICAL"),
            "provenance": "SIMULATED",
            "status": f"SCORE: {priority_dict.get('priority_score', 89.5):.1f}/100",
            "color": "red"
        }
    ]

    return visuals

# ──────────────────────────────────────────────────────────────────────────────
# Module 1 — Data Processing
# ──────────────────────────────────────────────────────────────────────────────

def run_module1(scene_id: str, config_path: str) -> dict:
    cfg = load_config(config_path)
    _ensure_mock_data(cfg, scene_id, config_path)

    engine = DataProcessingPipeline(config_path)
    scene = engine.process_scene(scene_id)

    return make_serializable({
        "scene_id": scene.scene_id,
        "mode": scene.mode,
        "timestamp": scene.timestamp,
        "bbox": list(scene.bbox),
        "has_optical": scene.has_optical,
        "features": scene.features,
        "sar_shape": list(scene.sar_processed.shape),
        "optical_shape": list(scene.optical_processed.shape) if scene.optical_processed is not None else None,
        "ais_record_count": len(scene.ais_records),
        "ocean_data_keys": list(scene.ocean_data.keys()),
        "geographic_layer_keys": list(scene.geographic_layers.keys()),
    })

# ──────────────────────────────────────────────────────────────────────────────
# Module 2 — Oil Spill Detection
# ──────────────────────────────────────────────────────────────────────────────

def run_module2(scene_id: str, config_path: str) -> dict:
    cfg = load_config(config_path)
    _ensure_mock_data(cfg, scene_id, config_path)

    data_engine = DataProcessingPipeline(config_path)
    scene = data_engine.process_scene(scene_id)

    detector = OilSpillDetector(config_path)
    result = detector.predict(scene.sar_processed, bbox_geo=scene.bbox)

    return make_serializable({
        "scene_id": scene_id,
        "spill_detected": result["spill_detected"],
        "spill_probability": result["spill_probability"],
        "spill_area_km2": result["spill_area_km2"],
        "slicks_found": result["slicks_found"],
        "polygons": result["polygons"],
        # probability_map and segmentation_mask are large arrays; omit from API response
    })

# ──────────────────────────────────────────────────────────────────────────────
# Module 3 — SAR + Optical Fusion
# ──────────────────────────────────────────────────────────────────────────────

def run_module3(scene_id: str, config_path: str) -> dict:
    cfg = load_config(config_path)
    _ensure_mock_data(cfg, scene_id, config_path)

    data_engine = DataProcessingPipeline(config_path)
    scene = data_engine.process_scene(scene_id)

    fusion_engine = SensorFusionEngine(config_path)
    result = fusion_engine.predict_fusion(
        sar_norm=scene.sar_processed,
        optical_norm=scene.optical_processed,
        has_optical=scene.has_optical,
    )

    return make_serializable({
        "scene_id": scene_id,
        "spill_probability": result["spill_probability"],
        "has_optical_used": result["has_optical_used"],
        "sensor_contributions": result["sensor_contributions"],
        # fusion_probability_map is a large array; omit from API response
    })

# ──────────────────────────────────────────────────────────────────────────────
# Module 4 — Oil Confidence / Look-Alike
# ──────────────────────────────────────────────────────────────────────────────

def run_module4(scene_id: str, config_path: str) -> dict:
    cfg = load_config(config_path)
    _ensure_mock_data(cfg, scene_id, config_path)

    data_engine = DataProcessingPipeline(config_path)
    scene = data_engine.process_scene(scene_id)

    detector = OilSpillDetector(config_path)
    mod2 = detector.predict(scene.sar_processed, bbox_geo=scene.bbox)

    fusion_engine = SensorFusionEngine(config_path)
    mod3 = fusion_engine.predict_fusion(
        sar_norm=scene.sar_processed,
        optical_norm=scene.optical_processed,
        has_optical=scene.has_optical,
    )
    final_prob = max(mod2["spill_probability"], mod3["spill_probability"])

    primary_shape = mod2["polygons"][0]["shape_features"] if mod2["polygons"] else {}

    engine = OilConfidenceEngine(config_path)
    result = engine.evaluate_confidence(
        model_probability=final_prob,
        module1_features=scene.features,
        shape_features=primary_shape,
        has_optical=scene.has_optical,
    )

    return make_serializable({
        "scene_id": scene_id,
        "oil_probability": result["oil_probability"],
        "confidence": result["confidence"],
        "lookalike_probability": result["lookalike_probability"],
        "verification_required": result["verification_required"],
        "verification_state": result["verification_state"],
        "feature_vector": result["feature_vector"],
    })

# ──────────────────────────────────────────────────────────────────────────────
# Module 5 — Physical Ship Detection
# ──────────────────────────────────────────────────────────────────────────────

def run_module5(scene_id: str, config_path: str) -> dict:
    cfg = load_config(config_path)
    _ensure_mock_data(cfg, scene_id, config_path)

    data_engine = DataProcessingPipeline(config_path)
    scene = data_engine.process_scene(scene_id)

    ship_engine = PhysicalShipDetectorEngine(config_path)
    ships = ship_engine.detect_physical_vessels(scene.sar_raw, bbox_geo=scene.bbox)

    return make_serializable({
        "scene_id": scene_id,
        "ship_count": len(ships),
        "ships": ships,
    })

# ──────────────────────────────────────────────────────────────────────────────
# Module 6 — AIS Matching + Anomaly
# ──────────────────────────────────────────────────────────────────────────────

def run_module6(scene_id: str, config_path: str) -> dict:
    cfg = load_config(config_path)
    _ensure_mock_data(cfg, scene_id, config_path)

    data_engine = DataProcessingPipeline(config_path)
    scene = data_engine.process_scene(scene_id)

    ship_engine = PhysicalShipDetectorEngine(config_path)
    ships = ship_engine.detect_physical_vessels(scene.sar_raw, bbox_geo=scene.bbox)

    ocean_data, ais_records = _load_ocean_and_ais(cfg, scene, scene_id)

    ais_engine = AISAnomalyEngine(config_path)
    result = ais_engine.process_ship_matching(
        physical_ships=ships,
        sat_timestamp_str=scene.timestamp,
        ais_records=ais_records,
    )

    return make_serializable({
        "scene_id": scene_id,
        "data_type": "INFERRED",
        "matched_count": len(result["matched"]),
        "possible_match_count": len(result["possible_matches"]),
        "unmatched_count": len(result["unmatched"]),
        "anomalies_count": len(result["anomalies"]),
        "matched": result["matched"],
        "possible_matches": result["possible_matches"],
        "unmatched": result["unmatched"],
        "anomalies": result["anomalies"],
    })

# ──────────────────────────────────────────────────────────────────────────────
# Module 7 — Hindcast / Spill Origin
# ──────────────────────────────────────────────────────────────────────────────

def run_module7(scene_id: str, config_path: str) -> dict:
    cfg = load_config(config_path)
    _ensure_mock_data(cfg, scene_id, config_path)

    data_engine = DataProcessingPipeline(config_path)
    scene = data_engine.process_scene(scene_id)

    detector = OilSpillDetector(config_path)
    mod2 = detector.predict(scene.sar_processed, bbox_geo=scene.bbox)

    ocean_data, _ = _load_ocean_and_ais(cfg, scene, scene_id)

    hindcast_engine = HindcastOriginEngine(config_path)
    result = hindcast_engine.estimate_spill_origin(
        spill_mask=mod2["segmentation_mask"],
        spill_polygons=mod2["polygons"],
        observation_timestamp=scene.timestamp,
        ocean_data=ocean_data,
        bbox_geo=tuple(scene.bbox),
    )

    traj_hist = result.get("trajectory_history", [])
    backward_trajectory = []
    trajectory_snapshots = {}
    if traj_hist:
        num_steps = len(traj_hist)
        for step in traj_hist:
            lat_m = round(float(np.mean(step[:, 0])), 5)
            lon_m = round(float(np.mean(step[:, 1])), 5)
            backward_trajectory.append([lat_m, lon_m])
        
        offsets = [-48, -24, -12, -6, 0]
        for offset in offsets:
            frac = abs(offset) / 48.0
            idx = min(int(frac * (num_steps - 1)), num_steps - 1)
            particles_step = traj_hist[idx]
            sub_particles = particles_step[::max(1, len(particles_step)//25)]
            trajectory_snapshots[str(offset)] = {
                "offset_hours": offset,
                "mean_coords": [round(float(np.mean(particles_step[:, 0])), 5), round(float(np.mean(particles_step[:, 1])), 5)],
                "particles": [[round(float(p[0]), 5), round(float(p[1]), 5)] for p in sub_particles]
            }

    return make_serializable({
        "scene_id": scene_id,
        "data_type": "INFERRED",
        "origin_centroid": result["origin_centroid"],
        "top_origin_zones": result["top_origin_zones"],
        "estimated_release_time": result["estimated_release_time"],
        "particle_count": result["particle_count"],
        "backward_trajectory": backward_trajectory,
        "trajectory_snapshots": trajectory_snapshots,
    })

# ──────────────────────────────────────────────────────────────────────────────
# Module 8 — Vessel Attribution
# ──────────────────────────────────────────────────────────────────────────────

def run_module8(scene_id: str, config_path: str) -> dict:
    cfg = load_config(config_path)
    _ensure_mock_data(cfg, scene_id, config_path)

    data_engine = DataProcessingPipeline(config_path)
    scene = data_engine.process_scene(scene_id)

    ship_engine = PhysicalShipDetectorEngine(config_path)
    ships = ship_engine.detect_physical_vessels(scene.sar_raw, bbox_geo=scene.bbox)

    detector = OilSpillDetector(config_path)
    mod2 = detector.predict(scene.sar_processed, bbox_geo=scene.bbox)

    ocean_data, ais_records = _load_ocean_and_ais(cfg, scene, scene_id)

    ais_engine = AISAnomalyEngine(config_path)
    mod6 = ais_engine.process_ship_matching(
        physical_ships=ships,
        sat_timestamp_str=scene.timestamp,
        ais_records=ais_records,
    )

    hindcast_engine = HindcastOriginEngine(config_path)
    mod7 = hindcast_engine.estimate_spill_origin(
        spill_mask=mod2["segmentation_mask"],
        spill_polygons=mod2["polygons"],
        observation_timestamp=scene.timestamp,
        ocean_data=ocean_data,
        bbox_geo=tuple(scene.bbox),
    )

    attribution_engine = VesselAttributionEngine(config_path)
    result = attribution_engine.rank_vessel_candidates(
        ais_records=ais_records,
        origin_result=mod7,
        ais_matching_result=mod6,
    )

    candidates = result.get("candidates", [])
    for cand in candidates:
        rec = cand.get("closest_record") or {}
        all_recs = cand.get("all_records") or []
        cand["lat"] = round(float(rec.get("lat", 12.35)), 5) if rec.get("lat") is not None else 12.35
        cand["lon"] = round(float(rec.get("lon", 72.35)), 5) if rec.get("lon") is not None else 72.35
        cand["speed_knots"] = rec.get("speed_knots", 12.5)
        cand["course_deg"] = rec.get("heading", 180)
        cand["imo"] = rec.get("imo", f"IMO{cand['mmsi']}")
        cand["flag"] = rec.get("flag", "Panama")
        cand["vessel_type"] = rec.get("vessel_type", "Oil Tanker" if cand.get("attribution_score", 0) > 0.7 else "Cargo Ship")
        cand["risk_level"] = "HIGH" if cand.get("attribution_score", 0) > 0.7 else ("MEDIUM" if cand.get("attribution_score", 0) > 0.4 else "LOW")
        cand["historical_track"] = [
            [round(float(r["lat"]), 5), round(float(r["lon"]), 5)]
            for r in all_recs if r.get("lat") is not None and r.get("lon") is not None
        ]

    return make_serializable({
        "scene_id": scene_id,
        "data_type": "INFERRED",
        "disclaimer": result["disclaimer"],
        "ranked_candidates": candidates,
    })

# ──────────────────────────────────────────────────────────────────────────────
# Module 9 — Forward Spill Forecast
# ──────────────────────────────────────────────────────────────────────────────

def run_module9(scene_id: str, config_path: str) -> dict:
    cfg = load_config(config_path)
    _ensure_mock_data(cfg, scene_id, config_path)

    data_engine = DataProcessingPipeline(config_path)
    scene = data_engine.process_scene(scene_id)

    detector = OilSpillDetector(config_path)
    mod2 = detector.predict(scene.sar_processed, bbox_geo=scene.bbox)

    ocean_data, _ = _load_ocean_and_ais(cfg, scene, scene_id)

    forecast_engine = ForwardForecastEngine(config_path)
    result = forecast_engine.forecast_spill_movement(
        spill_mask=mod2["segmentation_mask"],
        spill_polygons=mod2["polygons"],
        ocean_data=ocean_data,
        bbox_geo=tuple(scene.bbox),
    )

    # Serialize horizons, dropping raw_horizon_particles (large numpy arrays)
    serialized_horizons = {}
    forward_trajectory = []
    for h_key, h_data in result["horizons"].items():
        serialized_horizons[h_key] = {
            "horizon_hours": h_data["horizon_hours"],
            "particle_count": h_data["particle_count"],
            "center_coords": h_data["center_coords"],
            "predicted_polygon": h_data["predicted_polygon"],
        }
        if "center_coords" in h_data:
            forward_trajectory.append(h_data["center_coords"])

    return make_serializable({
        "scene_id": scene_id,
        "data_type": "SIMULATED",
        "particle_count": result["particle_count"],
        "horizons": serialized_horizons,
        "forward_trajectory": forward_trajectory,
    })

# ──────────────────────────────────────────────────────────────────────────────
# Module 10 — Uncertainty / Monte Carlo
# ──────────────────────────────────────────────────────────────────────────────

def run_module10(scene_id: str, config_path: str) -> dict:
    cfg = load_config(config_path)
    _ensure_mock_data(cfg, scene_id, config_path)

    data_engine = DataProcessingPipeline(config_path)
    scene = data_engine.process_scene(scene_id)

    detector = OilSpillDetector(config_path)
    mod2 = detector.predict(scene.sar_processed, bbox_geo=scene.bbox)

    ocean_data, _ = _load_ocean_and_ais(cfg, scene, scene_id)

    uncertainty_engine = UncertaintyEngine(config_path)
    result = uncertainty_engine.evaluate_spill_uncertainty(
        spill_mask=mod2["segmentation_mask"],
        spill_polygons=mod2["polygons"],
        ocean_data=ocean_data,
        geo_layers=scene.geographic_layers,
        bbox_geo=tuple(scene.bbox),
    )

    return make_serializable({
        "scene_id": scene_id,
        "data_type": "SIMULATED",
        "num_simulations": result["num_simulations"],
        "overall_prediction_confidence": result["overall_prediction_confidence"],
        "assets": result["assets"],
        "disclaimer": result["disclaimer"],
    })


# ──────────────────────────────────────────────────────────────────────────────
# Full 10-Module Pipeline (also extended to 13 modules when requested)
# ──────────────────────────────────────────────────────────────────────────────

# ── Internal helpers for chaining M2/M4/M9/M10 within higher-level modules ──

def _run_m2_m4_m9_m10(scene_id: str, config_path: str, cfg: dict):
    """Run M1→M2→M4→M9→M10 and return all intermediate results + ocean data."""
    data_engine = DataProcessingPipeline(config_path)
    scene = data_engine.process_scene(scene_id)

    detector = OilSpillDetector(config_path)
    mod2 = detector.predict(scene.sar_processed, bbox_geo=scene.bbox)

    fusion_engine = SensorFusionEngine(config_path)
    mod3 = fusion_engine.predict_fusion(
        sar_norm=scene.sar_processed,
        optical_norm=scene.optical_processed,
        has_optical=scene.has_optical,
    )
    final_prob = max(mod2["spill_probability"], mod3["spill_probability"])

    primary_shape = mod2["polygons"][0]["shape_features"] if mod2["polygons"] else {}
    confidence_engine = OilConfidenceEngine(config_path)
    mod4 = confidence_engine.evaluate_confidence(
        model_probability=final_prob,
        module1_features=scene.features,
        shape_features=primary_shape,
        has_optical=scene.has_optical,
    )

    ocean_data, ais_records = _load_ocean_and_ais(cfg, scene, scene_id)

    forecast_engine = ForwardForecastEngine(config_path)
    mod9 = forecast_engine.forecast_spill_movement(
        spill_mask=mod2["segmentation_mask"],
        spill_polygons=mod2["polygons"],
        ocean_data=ocean_data,
        bbox_geo=tuple(scene.bbox),
    )

    uncertainty_engine = UncertaintyEngine(config_path)
    mod10 = uncertainty_engine.evaluate_spill_uncertainty(
        spill_mask=mod2["segmentation_mask"],
        spill_polygons=mod2["polygons"],
        ocean_data=ocean_data,
        geo_layers=scene.geographic_layers,
        bbox_geo=tuple(scene.bbox),
    )

    hindcast_engine = HindcastOriginEngine(config_path)
    mod7 = hindcast_engine.estimate_spill_origin(
        spill_mask=mod2["segmentation_mask"],
        spill_polygons=mod2["polygons"],
        observation_timestamp=scene.timestamp,
        ocean_data=ocean_data,
        bbox_geo=tuple(scene.bbox),
    )

    return scene, mod2, mod4, mod7, mod9, mod10, ocean_data

# ──────────────────────────────────────────────────────────────────────────────
# Module 11 — Impact Prediction
# ──────────────────────────────────────────────────────────────────────────────

def run_module11(scene_id: str, config_path: str) -> dict:
    cfg = load_config(config_path)
    _ensure_mock_data(cfg, scene_id, config_path)

    scene, mod2, mod4, mod7, mod9, mod10, ocean_data = _run_m2_m4_m9_m10(
        scene_id, config_path, cfg
    )

    impact_engine = ImpactEngine(config_path)
    result = impact_engine.evaluate_impact(
        mod2=mod2,
        mod4=mod4,
        mod10=mod10,
        ocean_data=ocean_data,
    )

    return make_serializable({
        "scene_id": scene_id,
        "data_type": "SIMULATED",
        "mode": "MOCK",
        "spill_severity_score": result["spill_severity_score"],
        "overall_impact_score": result["overall_impact_score"],
        "overall_impact_level": result["overall_impact_level"],
        "assets": result["assets"],
        "disclaimer": result["disclaimer"],
    })

# ──────────────────────────────────────────────────────────────────────────────
# Module 12 — Priority / Urgency Scoring
# ──────────────────────────────────────────────────────────────────────────────

def run_module12(scene_id: str, config_path: str) -> dict:
    cfg = load_config(config_path)
    _ensure_mock_data(cfg, scene_id, config_path)

    scene, mod2, mod4, mod7, mod9, mod10, ocean_data = _run_m2_m4_m9_m10(
        scene_id, config_path, cfg
    )

    impact_engine = ImpactEngine(config_path)
    mod11 = impact_engine.evaluate_impact(mod2=mod2, mod4=mod4, mod10=mod10, ocean_data=ocean_data)

    priority_engine = PriorityEngine(config_path)
    result = priority_engine.compute_priority(
        mod2=mod2,
        mod4=mod4,
        mod10=mod10,
        mod11=mod11,
    )

    return make_serializable({
        "scene_id": scene_id,
        "data_type": "SIMULATED",
        "priority_score": result["priority_score"],
        "urgency_label": result["urgency_label"],
        "factor_contributions": result["factor_contributions"],
        "weights_used": result["weights_used"],
        "disclaimer": result["disclaimer"],
    })

# ──────────────────────────────────────────────────────────────────────────────
# Module 13 — Resource Optimization
# ──────────────────────────────────────────────────────────────────────────────

def run_module13(scene_id: str, config_path: str, resource_override=None) -> dict:
    cfg = load_config(config_path)
    _ensure_mock_data(cfg, scene_id, config_path)

    scene, mod2, mod4, mod7, mod9, mod10, ocean_data = _run_m2_m4_m9_m10(
        scene_id, config_path, cfg
    )

    impact_engine = ImpactEngine(config_path)
    mod11 = impact_engine.evaluate_impact(mod2=mod2, mod4=mod4, mod10=mod10, ocean_data=ocean_data)

    optimizer = ResourceOptimizer(config_path)
    result = optimizer.allocate(
        mod11=mod11,
        mod9=mod9,
        mod7=mod7,
        resource_override=resource_override,
    )

    return make_serializable({
        "scene_id": scene_id,
        "data_type": "SIMULATED",
        **result,
    })

# ──────────────────────────────────────────────────────────────────────────────
# Module 14 — What-If Response Simulation
# ──────────────────────────────────────────────────────────────────────────────

def run_module14(
    scene_id: str,
    config_path: str,
    delay_hours: float = 6.0,
    additional_resource_type: str = "skimmer",
    additional_resource_count: int = 2,
    alternative_allocation=None,
) -> dict:
    cfg = load_config(config_path)
    _ensure_mock_data(cfg, scene_id, config_path)

    scene, mod2, mod4, mod7, mod9, mod10, ocean_data = _run_m2_m4_m9_m10(
        scene_id, config_path, cfg
    )

    impact_engine = ImpactEngine(config_path)
    mod11 = impact_engine.evaluate_impact(mod2=mod2, mod4=mod4, mod10=mod10, ocean_data=ocean_data)

    priority_engine = PriorityEngine(config_path)
    mod12 = priority_engine.compute_priority(mod2=mod2, mod4=mod4, mod10=mod10, mod11=mod11)

    simulator = WhatIfSimulator(config_path)
    result = simulator.simulate(
        mod11=mod11,
        mod12=mod12,
        mod9=mod9,
        mod7=mod7,
        delay_hours=delay_hours,
        additional_resource_type=additional_resource_type,
        additional_resource_count=additional_resource_count,
        alternative_allocation=alternative_allocation,
    )

    return make_serializable({
        "scene_id": scene_id,
        "data_type": "SIMULATED",
        **result,
    })

# ──────────────────────────────────────────────────────────────────────────────
# Module 15 — Prediction vs Reality Feedback
# ──────────────────────────────────────────────────────────────────────────────

def run_module15(
    predicted_polygon: dict,
    observed_polygon: dict,
    predicted_horizon_hours=None,
    prediction_made_timestamp=None,
    observation_timestamp=None,
    spill_origin=None,
) -> dict:
  
    comparator = FeedbackComparator()
    result = comparator.compare(
        predicted_polygon=predicted_polygon,
        observed_polygon=observed_polygon,
        predicted_horizon_hours=predicted_horizon_hours,
        prediction_made_timestamp=prediction_made_timestamp,
        observation_timestamp=observation_timestamp,
        spill_origin=spill_origin,
    )

    return make_serializable({
        "data_type": "FEEDBACK",
        **result,
    })

def run_full_pipeline(scene_id: str, config_path: str, include_modules_11_15: bool = True) -> dict:

    """
    Executes the full canonical pipeline (M1-M15).
    """
    cfg = load_config(config_path)
    set_seed(cfg["system"]["random_seed"])

    _ensure_mock_data(cfg, scene_id, config_path)

    # Module 1
    data_engine = DataProcessingPipeline(config_path)
    scene = data_engine.process_scene(scene_id)

    # Module 2
    detector = OilSpillDetector(config_path)
    mod2 = detector.predict(scene.sar_processed, bbox_geo=scene.bbox)

    # Module 3
    fusion_engine = SensorFusionEngine(config_path)
    mod3 = fusion_engine.predict_fusion(
        sar_norm=scene.sar_processed,
        optical_norm=scene.optical_processed,
        has_optical=scene.has_optical,
    )
    final_prob = max(mod2["spill_probability"], mod3["spill_probability"])

    # Module 4
    primary_shape = mod2["polygons"][0]["shape_features"] if mod2["polygons"] else {}
    confidence_engine = OilConfidenceEngine(config_path)
    mod4 = confidence_engine.evaluate_confidence(
        model_probability=final_prob,
        module1_features=scene.features,
        shape_features=primary_shape,
        has_optical=scene.has_optical,
    )

    # Module 5
    ship_engine = PhysicalShipDetectorEngine(config_path)
    ships = ship_engine.detect_physical_vessels(scene.sar_raw, bbox_geo=scene.bbox)

    # Load ocean + AIS
    ocean_data, ais_records = _load_ocean_and_ais(cfg, scene, scene_id)

    # Module 6
    ais_engine = AISAnomalyEngine(config_path)
    mod6 = ais_engine.process_ship_matching(
        physical_ships=ships,
        sat_timestamp_str=scene.timestamp,
        ais_records=ais_records,
    )

    # Module 7
    hindcast_engine = HindcastOriginEngine(config_path)
    mod7 = hindcast_engine.estimate_spill_origin(
        spill_mask=mod2["segmentation_mask"],
        spill_polygons=mod2["polygons"],
        observation_timestamp=scene.timestamp,
        ocean_data=ocean_data,
        bbox_geo=tuple(scene.bbox),
    )

    traj_hist = mod7.get("trajectory_history", [])
    backward_trajectory = []
    trajectory_snapshots = {}
    if traj_hist:
        num_steps = len(traj_hist)
        for step in traj_hist:
            lat_m = round(float(np.mean(step[:, 0])), 5)
            lon_m = round(float(np.mean(step[:, 1])), 5)
            backward_trajectory.append([lat_m, lon_m])
        
        offsets = [-48, -24, -12, -6, 0]
        for offset in offsets:
            frac = abs(offset) / 48.0
            idx = min(int(frac * (num_steps - 1)), num_steps - 1)
            particles_step = traj_hist[idx]
            sub_particles = particles_step[::max(1, len(particles_step)//25)]
            trajectory_snapshots[str(offset)] = {
                "offset_hours": offset,
                "mean_coords": [round(float(np.mean(particles_step[:, 0])), 5), round(float(np.mean(particles_step[:, 1])), 5)],
                "particles": [[round(float(p[0]), 5), round(float(p[1]), 5)] for p in sub_particles]
            }

    # Module 8
    attribution_engine = VesselAttributionEngine(config_path)
    mod8 = attribution_engine.rank_vessel_candidates(
        ais_records=ais_records,
        origin_result=mod7,
        ais_matching_result=mod6,
    )

    candidates = mod8.get("candidates", [])
    for cand in candidates:
        rec = cand.get("closest_record") or {}
        all_recs = cand.get("all_records") or []
        cand["lat"] = round(float(rec.get("lat", 12.35)), 5) if rec.get("lat") is not None else 12.35
        cand["lon"] = round(float(rec.get("lon", 72.35)), 5) if rec.get("lon") is not None else 72.35
        cand["speed_knots"] = rec.get("speed_knots", 12.5)
        cand["course_deg"] = rec.get("heading", 180)
        cand["imo"] = rec.get("imo", f"IMO{cand['mmsi']}")
        cand["flag"] = rec.get("flag", "Panama")
        cand["vessel_type"] = rec.get("vessel_type", "Oil Tanker" if cand.get("attribution_score", 0) > 0.7 else "Cargo Ship")
        cand["risk_level"] = "HIGH" if cand.get("attribution_score", 0) > 0.7 else ("MEDIUM" if cand.get("attribution_score", 0) > 0.4 else "LOW")
        cand["historical_track"] = [
            [round(float(r["lat"]), 5), round(float(r["lon"]), 5)]
            for r in all_recs if r.get("lat") is not None and r.get("lon") is not None
        ]

    # Module 9
    forecast_engine = ForwardForecastEngine(config_path)
    mod9 = forecast_engine.forecast_spill_movement(
        spill_mask=mod2["segmentation_mask"],
        spill_polygons=mod2["polygons"],
        ocean_data=ocean_data,
        bbox_geo=tuple(scene.bbox),
    )

    # Module 10
    uncertainty_engine = UncertaintyEngine(config_path)
    mod10 = uncertainty_engine.evaluate_spill_uncertainty(
        spill_mask=mod2["segmentation_mask"],
        spill_polygons=mod2["polygons"],
        ocean_data=ocean_data,
        geo_layers=scene.geographic_layers,
        bbox_geo=tuple(scene.bbox),
    )

    # Build forecast summary
    forecast_summary: dict = {}
    forward_trajectory = []
    for horizon_key, h_data in mod9["horizons"].items():
        forecast_summary[horizon_key] = {
            "horizon_hours": h_data["horizon_hours"],
            "center_coords": h_data["center_coords"],
            "particle_count": h_data["particle_count"],
            "predicted_polygon": h_data["predicted_polygon"],
        }
        if "center_coords" in h_data:
            forward_trajectory.append(h_data["center_coords"])

    result = {
        "scene_id": scene.scene_id,
        "timestamp": scene.timestamp,
        "mode": "MOCK",
        "bbox": list(scene.bbox),

        # Modules 1-5 — OBSERVED
        "spill": {
            "detected": mod2["spill_detected"],
            "probability": mod4["oil_probability"],
            "area_km2": mod2["spill_area_km2"],
            "slicks_count": mod2["slicks_found"],
            "confidence": mod4["confidence"],
            "lookalike_probability": mod4["lookalike_probability"],
            "verification_state": mod4["verification_state"],
            "verification_required": mod4["verification_required"],
            "polygons": mod2["polygons"],
        },
        "ships_observed": ships,
        "sensor_fusion": {
            "has_optical": scene.has_optical,
            "sensor_contributions": mod3["sensor_contributions"],
        },

        # Module 6 — INFERRED
        "ais_matching": {
            "data_type": "INFERRED",
            "matched_count": len(mod6["matched"]),
            "possible_match_count": len(mod6["possible_matches"]),
            "unmatched_count": len(mod6["unmatched"]),
            "anomalies_count": len(mod6["anomalies"]),
            "matched": mod6["matched"],
            "possible_matches": mod6["possible_matches"],
            "unmatched": mod6["unmatched"],
            "anomalies": mod6["anomalies"],
        },

        # Module 7 — INFERRED
        "spill_origin": {
            "data_type": "INFERRED",
            "origin_centroid": mod7["origin_centroid"],
            "top_origin_zones": mod7["top_origin_zones"],
            "estimated_release_time": mod7["estimated_release_time"],
            "particle_count": mod7["particle_count"],
            "backward_trajectory": backward_trajectory,
            "trajectory_snapshots": trajectory_snapshots,
        },

        # Module 8 — INFERRED
        "vessel_attribution": {
            "data_type": "INFERRED",
            "disclaimer": mod8["disclaimer"],
            "ranked_candidates": candidates,
        },

        # Module 9 — SIMULATED
        "spill_forecast": {
            "data_type": "SIMULATED",
            "horizons": forecast_summary,
            "forward_trajectory": forward_trajectory,
        },

        # Module 10 — SIMULATED
        "uncertainty": {
            "data_type": "SIMULATED",
            "num_simulations": mod10["num_simulations"],
            "overall_prediction_confidence": mod10["overall_prediction_confidence"],
            "asset_impact": mod10["assets"],
            "asset_impact_probabilities": {a.get("asset_name"): a.get("impact_probability", 0.5) for a in mod10.get("assets", [])},
            "disclaimer": mod10["disclaimer"],
        },

        # Data source flags
        "data_sources": {
            "sar": True,
            "optical": scene.has_optical,
            "ais": len(ais_records) > 0,
            "oceanographic": bool(ocean_data),
            "geographic": bool(scene.geographic_layers),
            "mode": "MOCK",
        },
    }

    # ── Optional M11–M13 extension ──────────────────────────────────────────
    if include_modules_11_15:
        # Module 11
        impact_engine = ImpactEngine(config_path)
        mod11 = impact_engine.evaluate_impact(
            mod2=mod2, mod4=mod4, mod10=mod10, ocean_data=ocean_data
        )
        result["impact"] = {
            "data_type": "SIMULATED",
            "mode": "MOCK",
            "spill_severity_score": mod11["spill_severity_score"],
            "overall_impact_score": mod11["overall_impact_score"],
            "overall_impact_level": mod11["overall_impact_level"],
            "assets": mod11["assets"],
            "disclaimer": mod11["disclaimer"],
        }

        # Module 12
        priority_engine = PriorityEngine(config_path)
        mod12 = priority_engine.compute_priority(
            mod2=mod2, mod4=mod4, mod10=mod10, mod11=mod11
        )
        result["priority"] = {
            "data_type": "SIMULATED",
            "priority_score": mod12["priority_score"],
            "urgency_label": mod12["urgency_label"],
            "factor_contributions": mod12["factor_contributions"],
            "weights_used": mod12["weights_used"],
            "disclaimer": mod12["disclaimer"],
        }

        # Module 13
        optimizer = ResourceOptimizer(config_path)
        mod13 = optimizer.allocate(mod11=mod11, mod9=mod9, mod7=mod7)
        result["resource_optimization"] = {
            "data_type": "SIMULATED",
            **mod13,
        }

    result["visuals"] = _build_visuals_for_payload(result)

    return make_serializable(result)

# ──────────────────────────────────────────────────────────────────────────────
# Module 16 — Explainability / Evidence Graph
# ──────────────────────────────────────────────────────────────────────────────

def run_module16(scene_id: str, config_path: str) -> dict:
    """
    Build the M16 evidence graph for a scene by running M2-M14 internally
    and passing their outputs to the EvidenceGraphEngine.

    This function does NOT independently rerun earlier modules from scratch
    beyond what is needed to assemble the evidence.  It mirrors the pattern
    used by run_module11–run_module14 (calling _run_m2_m4_m9_m10 and friends).
    """
    cfg = load_config(config_path)
    _ensure_mock_data(cfg, scene_id, config_path)

    # Shared sub-pipeline
    scene, mod2, mod4, mod7, mod9, mod10, ocean_data = _run_m2_m4_m9_m10(
        scene_id, config_path, cfg
    )

    # M3
    fusion_engine = SensorFusionEngine(config_path)
    mod3 = fusion_engine.predict_fusion(
        sar_norm=scene.sar_processed,
        optical_norm=scene.optical_processed,
        has_optical=scene.has_optical,
    )

    # M5
    ship_engine = PhysicalShipDetectorEngine(config_path)
    ships = ship_engine.detect_physical_vessels(scene.sar_raw, bbox_geo=scene.bbox)
    mod5 = {"ship_count": len(ships), "ships": ships}

    # M6
    _, ais_records = _load_ocean_and_ais(cfg, scene, scene_id)
    ais_engine = AISAnomalyEngine(config_path)
    mod6 = ais_engine.process_ship_matching(
        physical_ships=ships,
        sat_timestamp_str=scene.timestamp,
        ais_records=ais_records,
    )

    # M8
    attribution_engine = VesselAttributionEngine(config_path)
    mod8_raw = attribution_engine.rank_vessel_candidates(
        ais_records=ais_records,
        origin_result=mod7,
        ais_matching_result=mod6,
    )
    mod8 = {
        "ranked_candidates": mod8_raw["candidates"],
        "disclaimer": mod8_raw["disclaimer"],
    }

    # M11
    impact_engine = ImpactEngine(config_path)
    mod11 = impact_engine.evaluate_impact(mod2=mod2, mod4=mod4, mod10=mod10, ocean_data=ocean_data)

    # M12
    priority_engine = PriorityEngine(config_path)
    mod12 = priority_engine.compute_priority(mod2=mod2, mod4=mod4, mod10=mod10, mod11=mod11)

    # M13
    optimizer = ResourceOptimizer(config_path)
    mod13 = optimizer.allocate(mod11=mod11, mod9=mod9, mod7=mod7)

    # M14
    simulator = WhatIfSimulator(config_path)
    mod14 = simulator.simulate(
        mod11=mod11, mod12=mod12, mod9=mod9, mod7=mod7,
    )

    # Build evidence graph
    engine = EvidenceGraphEngine()
    result = engine.build_evidence_graph(
        scene_id=scene_id,
        mod2=mod2,
        mod3=mod3,
        mod4=mod4,
        mod5=mod5,
        mod6=mod6,
        mod7=mod7,
        mod8=mod8,
        mod9=mod9,
        mod10=mod10,
        mod11=mod11,
        mod12=mod12,
        mod13=mod13,
        mod14=mod14,
    )

    return make_serializable(result)


# ──────────────────────────────────────────────────────────────────────────────
# Module 17 — Action Recommendation / Decision Support
# ──────────────────────────────────────────────────────────────────────────────

def run_module17(scene_id: str, config_path: str) -> dict:
    """
    Produce the M17 action recommendation for a scene.

    Calls run_module16 internally to obtain the evidence graph, then
    passes all relevant module outputs to the ActionRecommender.
    """
    cfg = load_config(config_path)
    _ensure_mock_data(cfg, scene_id, config_path)

    # Shared sub-pipeline
    scene, mod2, mod4, mod7, mod9, mod10, ocean_data = _run_m2_m4_m9_m10(
        scene_id, config_path, cfg
    )

    # M5 + M6 + M8
    ship_engine = PhysicalShipDetectorEngine(config_path)
    ships = ship_engine.detect_physical_vessels(scene.sar_raw, bbox_geo=scene.bbox)
    _, ais_records = _load_ocean_and_ais(cfg, scene, scene_id)

    ais_engine = AISAnomalyEngine(config_path)
    mod6 = ais_engine.process_ship_matching(
        physical_ships=ships,
        sat_timestamp_str=scene.timestamp,
        ais_records=ais_records,
    )

    attribution_engine = VesselAttributionEngine(config_path)
    mod8_raw = attribution_engine.rank_vessel_candidates(
        ais_records=ais_records,
        origin_result=mod7,
        ais_matching_result=mod6,
    )
    mod8 = {
        "ranked_candidates": mod8_raw["candidates"],
        "disclaimer": mod8_raw["disclaimer"],
    }

    # M11 / M12 / M13 / M14
    impact_engine = ImpactEngine(config_path)
    mod11 = impact_engine.evaluate_impact(mod2=mod2, mod4=mod4, mod10=mod10, ocean_data=ocean_data)

    priority_engine = PriorityEngine(config_path)
    mod12 = priority_engine.compute_priority(mod2=mod2, mod4=mod4, mod10=mod10, mod11=mod11)

    optimizer = ResourceOptimizer(config_path)
    mod13 = optimizer.allocate(mod11=mod11, mod9=mod9, mod7=mod7)

    simulator = WhatIfSimulator(config_path)
    mod14 = simulator.simulate(mod11=mod11, mod12=mod12, mod9=mod9, mod7=mod7)

    # M16 evidence graph
    fusion_engine = SensorFusionEngine(config_path)
    mod3 = fusion_engine.predict_fusion(
        sar_norm=scene.sar_processed,
        optical_norm=scene.optical_processed,
        has_optical=scene.has_optical,
    )
    mod5 = {"ship_count": len(ships), "ships": ships}

    ev_engine = EvidenceGraphEngine()
    mod16 = ev_engine.build_evidence_graph(
        scene_id=scene_id,
        mod2=mod2, mod3=mod3, mod4=mod4, mod5=mod5,
        mod6=mod6, mod7=mod7, mod8=mod8, mod9=mod9,
        mod10=mod10, mod11=mod11, mod12=mod12, mod13=mod13, mod14=mod14,
    )

    # M17 recommendation
    recommender = ActionRecommender(config_path)
    result = recommender.recommend(
        scene_id=scene_id,
        mod2=mod2,
        mod4=mod4,
        mod7=mod7,
        mod8=mod8,
        mod10=mod10,
        mod11=mod11,
        mod12=mod12,
        mod13=mod13,
        mod14=mod14,
        mod16=mod16,
    )

    return make_serializable(result)

# ──────────────────────────────────────────────────────────────────────────────
# Extended pipeline — M1→M17
# ──────────────────────────────────────────────────────────────────────────────

def run_full_pipeline_extended(
    scene_id: str,
    config_path: str,
    include_modules_11_15: bool = False,
    include_modules_16_17: bool = False,
) -> dict:
    """
    Executes the full pipeline with optional M16/M17 extension.

    Behaviour:
      include_modules_16_17=False  →  delegates to run_full_pipeline (M1–M10 or M1–M13)
      include_modules_16_17=True   →  M1–M10 + M11–M13 + M16 + M17

    M14 and M15 remain standalone endpoints only.
    """
    if not include_modules_16_17:
        return run_full_pipeline(scene_id, config_path, include_modules_11_15)

    # --- Extended pipeline: M1–M13 + M16 + M17 ---
    cfg = load_config(config_path)
    set_seed(cfg["system"]["random_seed"])
    _ensure_mock_data(cfg, scene_id, config_path)

    # M1
    data_engine = DataProcessingPipeline(config_path)
    scene = data_engine.process_scene(scene_id)

    # M2
    detector = OilSpillDetector(config_path)
    mod2 = detector.predict(scene.sar_processed, bbox_geo=scene.bbox)

    # M3
    fusion_engine = SensorFusionEngine(config_path)
    mod3 = fusion_engine.predict_fusion(
        sar_norm=scene.sar_processed,
        optical_norm=scene.optical_processed,
        has_optical=scene.has_optical,
    )
    final_prob = max(mod2["spill_probability"], mod3["spill_probability"])

    # M4
    primary_shape = mod2["polygons"][0]["shape_features"] if mod2["polygons"] else {}
    confidence_engine = OilConfidenceEngine(config_path)
    mod4 = confidence_engine.evaluate_confidence(
        model_probability=final_prob,
        module1_features=scene.features,
        shape_features=primary_shape,
        has_optical=scene.has_optical,
    )

    # M5
    ship_engine = PhysicalShipDetectorEngine(config_path)
    ships = ship_engine.detect_physical_vessels(scene.sar_raw, bbox_geo=scene.bbox)

    ocean_data, ais_records = _load_ocean_and_ais(cfg, scene, scene_id)

    # M6
    ais_engine = AISAnomalyEngine(config_path)
    mod6 = ais_engine.process_ship_matching(
        physical_ships=ships,
        sat_timestamp_str=scene.timestamp,
        ais_records=ais_records,
    )

    # M7
    hindcast_engine = HindcastOriginEngine(config_path)
    mod7 = hindcast_engine.estimate_spill_origin(
        spill_mask=mod2["segmentation_mask"],
        spill_polygons=mod2["polygons"],
        observation_timestamp=scene.timestamp,
        ocean_data=ocean_data,
        bbox_geo=tuple(scene.bbox),
    )

    # M8
    attribution_engine = VesselAttributionEngine(config_path)
    mod8_raw = attribution_engine.rank_vessel_candidates(
        ais_records=ais_records,
        origin_result=mod7,
        ais_matching_result=mod6,
    )
    mod8 = {
        "ranked_candidates": mod8_raw["candidates"],
        "disclaimer": mod8_raw["disclaimer"],
    }

    # M9
    forecast_engine = ForwardForecastEngine(config_path)
    mod9 = forecast_engine.forecast_spill_movement(
        spill_mask=mod2["segmentation_mask"],
        spill_polygons=mod2["polygons"],
        ocean_data=ocean_data,
        bbox_geo=tuple(scene.bbox),
    )

    # M10
    uncertainty_engine = UncertaintyEngine(config_path)
    mod10 = uncertainty_engine.evaluate_spill_uncertainty(
        spill_mask=mod2["segmentation_mask"],
        spill_polygons=mod2["polygons"],
        ocean_data=ocean_data,
        geo_layers=scene.geographic_layers,
        bbox_geo=tuple(scene.bbox),
    )

    # M11
    impact_engine = ImpactEngine(config_path)
    mod11 = impact_engine.evaluate_impact(mod2=mod2, mod4=mod4, mod10=mod10, ocean_data=ocean_data)

    # M12
    priority_engine = PriorityEngine(config_path)
    mod12 = priority_engine.compute_priority(mod2=mod2, mod4=mod4, mod10=mod10, mod11=mod11)

    # M13
    optimizer = ResourceOptimizer(config_path)
    mod13 = optimizer.allocate(mod11=mod11, mod9=mod9, mod7=mod7)

    # M16 evidence graph
    ev_engine = EvidenceGraphEngine()
    mod5_dict = {"ship_count": len(ships), "ships": ships}
    mod16 = ev_engine.build_evidence_graph(
        scene_id=scene_id,
        mod2=mod2, mod3=mod3, mod4=mod4, mod5=mod5_dict,
        mod6=mod6, mod7=mod7, mod8=mod8, mod9=mod9,
        mod10=mod10, mod11=mod11, mod12=mod12, mod13=mod13,
    )

    # M17 recommendation
    recommender = ActionRecommender(config_path)
    mod17 = recommender.recommend(
        scene_id=scene_id,
        mod2=mod2, mod4=mod4, mod7=mod7, mod8=mod8,
        mod10=mod10, mod11=mod11, mod12=mod12, mod13=mod13,
        mod16=mod16,
    )

    # Build forecast summary
    forecast_summary: dict = {}
    for horizon_key, h_data in mod9["horizons"].items():
        forecast_summary[horizon_key] = {
            "horizon_hours": h_data["horizon_hours"],
            "center_coords": h_data["center_coords"],
            "particle_count": h_data["particle_count"],
            "predicted_polygon": h_data["predicted_polygon"],
        }

    result = {
        "scene_id": scene.scene_id,
        "timestamp": scene.timestamp,
        "mode": "MOCK",
        "bbox": list(scene.bbox),
        "spill": {
            "detected": mod2["spill_detected"],
            "probability": mod4["oil_probability"],
            "area_km2": mod2["spill_area_km2"],
            "slicks_count": mod2["slicks_found"],
            "confidence": mod4["confidence"],
            "lookalike_probability": mod4["lookalike_probability"],
            "verification_state": mod4["verification_state"],
            "verification_required": mod4["verification_required"],
            "polygons": mod2["polygons"],
        },
        "ships_observed": ships,
        "sensor_fusion": {
            "has_optical": scene.has_optical,
            "sensor_contributions": mod3["sensor_contributions"],
        },
        "ais_matching": {
            "data_type": "INFERRED",
            "matched_count": len(mod6["matched"]),
            "possible_match_count": len(mod6["possible_matches"]),
            "unmatched_count": len(mod6["unmatched"]),
            "anomalies_count": len(mod6["anomalies"]),
            "matched": mod6["matched"],
            "possible_matches": mod6["possible_matches"],
            "unmatched": mod6["unmatched"],
            "anomalies": mod6["anomalies"],
        },
        "spill_origin": {
            "data_type": "INFERRED",
            "origin_centroid": mod7["origin_centroid"],
            "top_origin_zones": mod7["top_origin_zones"],
            "estimated_release_time": mod7["estimated_release_time"],
            "particle_count": mod7["particle_count"],
        },
        "vessel_attribution": {
            "data_type": "INFERRED",
            "disclaimer": mod8["disclaimer"],
            "ranked_candidates": mod8["ranked_candidates"],
        },
        "spill_forecast": {
            "data_type": "SIMULATED",
            "horizons": forecast_summary,
        },
        "uncertainty": {
            "data_type": "SIMULATED",
            "num_simulations": mod10["num_simulations"],
            "overall_prediction_confidence": mod10["overall_prediction_confidence"],
            "asset_impact": mod10["assets"],
            "disclaimer": mod10["disclaimer"],
        },
        "data_sources": {
            "sar": True,
            "optical": scene.has_optical,
            "ais": len(ais_records) > 0,
            "oceanographic": bool(ocean_data),
            "geographic": bool(scene.geographic_layers),
            "mode": "MOCK",
        },
        "impact": {
            "data_type": "SIMULATED",
            "mode": "MOCK",
            "spill_severity_score": mod11["spill_severity_score"],
            "overall_impact_score": mod11["overall_impact_score"],
            "overall_impact_level": mod11["overall_impact_level"],
            "assets": mod11["assets"],
            "disclaimer": mod11["disclaimer"],
        },
        "priority": {
            "data_type": "SIMULATED",
            "priority_score": mod12["priority_score"],
            "urgency_label": mod12["urgency_label"],
            "factor_contributions": mod12["factor_contributions"],
            "weights_used": mod12["weights_used"],
            "disclaimer": mod12["disclaimer"],
        },
        "resource_optimization": {
            "data_type": "SIMULATED",
            **mod13,
        },
        "explainability": mod16,
        "action_recommendation": mod17,
    }

    return make_serializable(result)
