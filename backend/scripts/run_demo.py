"""
run_demo.py — End-to-End Oil Spill Monitoring Pipeline Demo (Modules 1–10)

Runs the full satellite oil-spill detection, attribution, forecast, and uncertainty pipeline
on synthetic MOCK data. Every result is clearly labelled [MOCK] / [INFERRED] / [SIMULATED].
"""
import sys
import os
import json

# Add root directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.utils.logging import get_logger
from src.utils.config import load_config
from src.utils.seed import set_seed
from src.mock_data.generate_dataset import generate_mock_dataset
from src.mock_data.scenario_generator import generate_attribution_scenario
from src.data_processing.pipeline import DataProcessingPipeline
from src.oil_spill_detection.inference import OilSpillDetector
from src.fusion.inference import SensorFusionEngine
from src.confidence.inference import OilConfidenceEngine
from src.ship_detection.inference import PhysicalShipDetectorEngine
from src.utils.visualization import visualize_pipeline_results

# Modules 6–10
from src.ais.anomaly import AISAnomalyEngine
from src.hindcast.origin_probability import HindcastOriginEngine
from src.attribution.ranking import VesselAttributionEngine
from src.forecast.plume import ForwardForecastEngine
from src.uncertainty.impact import UncertaintyEngine

# Modules 11-13, 16-17 (Response & Decision Support)
from src.impact.scoring import ImpactEngine
from src.priority.scoring import PriorityEngine
from src.resource_optimization.allocator import ResourceOptimizer
from src.explainability.evidence_graph import EvidenceGraphEngine
from src.action_recommendation.recommender import ActionRecommender


logger = get_logger("EndToEndDemo")


def run_end_to_end_demo(scene_id: str = "SCENE_001", config_path: str = "configs/config.yaml", extended: bool = False) -> str:
    """
    Executes the complete 10-module oil spill monitoring pipeline on MOCK data.

    Pipeline Stages:
        Module 1  — Data Processing & Feature Engineering
        Module 2  — Oil Spill Segmentation (U-Net)
        Module 3  — SAR + Optical Sensor Fusion
        Module 4  — Oil Confidence & Look-Alike Engine
        Module 5  — Physical Ship Detection
        Module 6  — AIS Matching + Anomaly Engine     [INFERRED]
        Module 7  — Hindcast / Spill Origin Engine    [INFERRED]
        Module 8  — Vessel Attribution Engine         [INFERRED]
        Module 9  — Forward Spill Forecast Engine     [SIMULATED]
        Module 10 — Uncertainty Engine (Monte Carlo)  [SIMULATED]
    """
    cfg = load_config(config_path)
    set_seed(cfg["system"]["random_seed"])

    logger.info("=" * 72)
    if extended:
        logger.info("AQUALENS PIPELINE  [17-MODULE EXTENDED DEMO]")
    else:
        logger.info("AQUALENS PIPELINE  [10-MODULE DEMO]")
    logger.info("=" * 72)
    logger.info("[WARNING] MODE: SYNTHETIC MOCK DATA -- Results are NOT scientifically valid measurements.")

    predictions_dir = cfg["paths"]["predictions_dir"]
    vis_dir = cfg["paths"]["visualizations_dir"]
    os.makedirs(predictions_dir, exist_ok=True)
    os.makedirs(vis_dir, exist_ok=True)

    # ─────────────────────────────────────────────────────────────────────────
    # STEP 0 — Ensure Mock Dataset & Integrated Scenario Exist
    # ─────────────────────────────────────────────────────────────────────────
    mock_dir = cfg["paths"]["mock_data_dir"]
    if not os.path.exists(os.path.join(mock_dir, "sar")):
        logger.info("[STEP 0] Mock data not found — generating base dataset...")
        generate_mock_dataset(config_path)

    ais_path = os.path.join(mock_dir, "ais", f"{scene_id}_ais.json")
    if not os.path.exists(ais_path):
        logger.info("[STEP 0] AIS scenario not found — generating integrated multi-vessel scenario...")
        generate_attribution_scenario(config_path)

    # ─────────────────────────────────────────────────────────────────────────
    # MODULE 1 — Data Processing & Feature Engineering
    # ─────────────────────────────────────────────────────────────────────────
    logger.info("\n--- MODULE 1: DATA PROCESSING & FEATURE ENGINEERING ---")
    data_engine = DataProcessingPipeline(config_path)
    scene = data_engine.process_scene(scene_id)

    # ─────────────────────────────────────────────────────────────────────────
    # MODULE 2 — Oil Spill Segmentation (U-Net)
    # ─────────────────────────────────────────────────────────────────────────
    logger.info("\n--- MODULE 2: OIL SPILL SEGMENTATION (U-NET) ---")
    segmentor = OilSpillDetector(config_path)
    mod2_output = segmentor.predict(scene.sar_processed, bbox_geo=scene.bbox)

    # ─────────────────────────────────────────────────────────────────────────
    # MODULE 3 — SAR + Optical Sensor Fusion
    # ─────────────────────────────────────────────────────────────────────────
    logger.info("\n--- MODULE 3: SAR + OPTICAL SENSOR FUSION ---")
    fusion_engine = SensorFusionEngine(config_path)
    mod3_output = fusion_engine.predict_fusion(
        sar_norm=scene.sar_processed,
        optical_norm=scene.optical_processed,
        has_optical=scene.has_optical
    )
    final_prob = max(mod2_output["spill_probability"], mod3_output["spill_probability"])

    # ─────────────────────────────────────────────────────────────────────────
    # MODULE 4 — Oil Confidence & Look-Alike Engine
    # ─────────────────────────────────────────────────────────────────────────
    logger.info("\n--- MODULE 4: OIL CONFIDENCE & LOOK-ALIKE ENGINE ---")
    confidence_engine = OilConfidenceEngine(config_path)
    primary_slick_shape = mod2_output["polygons"][0]["shape_features"] if mod2_output["polygons"] else {}
    mod4_output = confidence_engine.evaluate_confidence(
        model_probability=final_prob,
        module1_features=scene.features,
        shape_features=primary_slick_shape,
        has_optical=scene.has_optical
    )

    # ─────────────────────────────────────────────────────────────────────────
    # MODULE 5 — Physical Ship Detection
    # ─────────────────────────────────────────────────────────────────────────
    logger.info("\n--- MODULE 5: PHYSICAL SHIP DETECTION ---")
    ship_engine = PhysicalShipDetectorEngine(config_path)
    physical_ships = ship_engine.detect_physical_vessels(scene.sar_raw, bbox_geo=scene.bbox)

    # ─────────────────────────────────────────────────────────────────────────
    # Resolve ocean_data for physics engines (Modules 6–10)
    # Use the scenario-generated ocean data if available, else fallback to scene
    # ─────────────────────────────────────────────────────────────────────────
    import json as _json
    ocean_path = os.path.join(mock_dir, "ocean", f"{scene_id}_ocean.json")
    if os.path.exists(ocean_path):
        with open(ocean_path, "r") as f:
            ocean_data = _json.load(f)
    else:
        ocean_data = scene.ocean_data if scene.ocean_data else {}

    ais_records = scene.ais_records if scene.ais_records else []
    if not ais_records and os.path.exists(ais_path):
        with open(ais_path, "r") as f:
            ais_records = _json.load(f)

    sat_timestamp = scene.timestamp

    # ─────────────────────────────────────────────────────────────────────────
    # MODULE 6 — AIS Matching + Anomaly Engine  [INFERRED]
    # ─────────────────────────────────────────────────────────────────────────
    logger.info("\n--- MODULE 6: AIS MATCHING + ANOMALY ENGINE [INFERRED] ---")
    ais_engine = AISAnomalyEngine(config_path)
    mod6_output = ais_engine.process_ship_matching(
        physical_ships=physical_ships,
        sat_timestamp_str=sat_timestamp,
        ais_records=ais_records
    )

    # ─────────────────────────────────────────────────────────────────────────
    # MODULE 7 — Hindcast / Spill Origin Engine  [INFERRED]
    # ─────────────────────────────────────────────────────────────────────────
    logger.info("\n--- MODULE 7: HINDCAST / SPILL ORIGIN ENGINE [INFERRED] ---")
    hindcast_engine = HindcastOriginEngine(config_path)
    mod7_output = hindcast_engine.estimate_spill_origin(
        spill_mask=mod2_output["segmentation_mask"],
        spill_polygons=mod2_output["polygons"],
        observation_timestamp=sat_timestamp,
        ocean_data=ocean_data,
        bbox_geo=tuple(scene.bbox)
    )

    # Export hindcast visualizations
    try:
        from src.hindcast.visualization import plot_hindcast_results
        hindcast_vis_dir = os.path.join(vis_dir, "hindcast")
        os.makedirs(hindcast_vis_dir, exist_ok=True)
        plot_hindcast_results(
            scene_id=scene_id,
            spill_polygons=mod2_output.get("polygons", []),
            hindcast_result=mod7_output,
            ocean_data=ocean_data,
            output_dir=hindcast_vis_dir
        )
    except Exception as e:
        logger.warning(f"[MODULE 7] Hindcast visualization skipped: {e}")

    # ─────────────────────────────────────────────────────────────────────────
    # MODULE 8 — Vessel Attribution Engine  [INFERRED]
    # ─────────────────────────────────────────────────────────────────────────
    logger.info("\n--- MODULE 8: VESSEL ATTRIBUTION ENGINE [INFERRED] ---")
    attribution_engine = VesselAttributionEngine(config_path)
    mod8_output = attribution_engine.rank_vessel_candidates(
        ais_records=ais_records,
        origin_result=mod7_output,
        ais_matching_result=mod6_output
    )

    # ─────────────────────────────────────────────────────────────────────────
    # MODULE 9 — Forward Spill Forecast Engine  [SIMULATED]
    # ─────────────────────────────────────────────────────────────────────────
    logger.info("\n--- MODULE 9: FORWARD SPILL FORECAST ENGINE [SIMULATED] ---")
    forecast_engine = ForwardForecastEngine(config_path)
    mod9_output = forecast_engine.forecast_spill_movement(
        spill_mask=mod2_output["segmentation_mask"],
        spill_polygons=mod2_output["polygons"],
        ocean_data=ocean_data,
        bbox_geo=tuple(scene.bbox) # type: ignore
    )

    # Export forecast visualizations
    try:
        from src.forecast.visualization import plot_forecast_results
        forecast_vis_dir = os.path.join(vis_dir, "forecast")
        os.makedirs(forecast_vis_dir, exist_ok=True)
        plot_forecast_results(
            scene_id=scene_id,
            forecast_result=mod9_output,
            geo_layers=scene.geographic_layers,
            output_dir=forecast_vis_dir
        )
    except Exception as e:
        logger.warning(f"[MODULE 9] Forecast visualization skipped: {e}")

    # ─────────────────────────────────────────────────────────────────────────
    # MODULE 10 — Uncertainty Engine (Monte Carlo)  [SIMULATED]
    # ─────────────────────────────────────────────────────────────────────────
    logger.info("\n--- MODULE 10: UNCERTAINTY ENGINE — MONTE CARLO [SIMULATED] ---")
    uncertainty_engine = UncertaintyEngine(config_path)
    mod10_output = uncertainty_engine.evaluate_spill_uncertainty(
        spill_mask=mod2_output["segmentation_mask"],
        spill_polygons=mod2_output["polygons"],
        ocean_data=ocean_data,
        geo_layers=scene.geographic_layers,
        bbox_geo=tuple(scene.bbox) # type: ignore
    )

    # =========================================================================
    # EXTENDED PIPELINE (Modules 11-13, 16, 17)
    # =========================================================================
    mod11_output = None
    mod12_output = None
    mod13_output = None
    mod16_output = None
    mod17_output = None

    if extended:
        logger.info("\n--- EXTENDED DEMO MODE ENABLED ---")
        logger.info("[Module 11] Predicting Impact...")
        impact_engine = ImpactEngine(config_path)
        mod11_output = impact_engine.evaluate_impact(mod2=mod2_output, mod4=mod4_output, mod10=mod10_output, ocean_data=ocean_data)

        logger.info("[Module 12] Scoring Priority / Urgency...")
        priority_engine = PriorityEngine(config_path)
        mod12_output = priority_engine.compute_priority(mod2=mod2_output, mod4=mod4_output, mod10=mod10_output, mod11=mod11_output)

        logger.info("[Module 13] Optimizing Resource Allocation...")
        resource_optimizer = ResourceOptimizer(config_path)
        mod13_output = resource_optimizer.allocate(mod11=mod11_output, mod9=mod9_output, mod7=mod7_output)

        logger.info("[Module 16] Assembling Evidence Graph / Explainability...")
        evidence_graph_engine = EvidenceGraphEngine()
        mod16_output = evidence_graph_engine.build_evidence_graph(
            scene_id=scene.scene_id,
            mod2=mod2_output, mod3=mod3_output, mod4=mod4_output, mod5={"ship_count": len(physical_ships), "ships": physical_ships},
            mod6=mod6_output, mod7=mod7_output, mod8=mod8_output, mod9=mod9_output,
            mod10=mod10_output, mod11=mod11_output, mod12=mod12_output, mod13=mod13_output,
            mod14=None, mod15=None  # M14 and M15 are standalone
        )

        logger.info("[Module 17] Generating Action Recommendation...")
        action_recommender = ActionRecommender(config_path)
        mod17_output = action_recommender.recommend(
            scene_id=scene.scene_id,
            mod2=mod2_output, mod7=mod7_output, mod8=mod8_output,
            mod10=mod10_output, mod11=mod11_output, mod12=mod12_output,
            mod13=mod13_output, mod14=None, mod15=None, mod16=mod16_output
        )

    # ─────────────────────────────────────────────────────────────────────────
    # FINAL JSON — Unified API Output
    # ─────────────────────────────────────────────────────────────────────────
    logger.info("\n--- FINAL SYSTEM OUTPUT COMPILATION ---")

    def _serialisable(obj):
        """Recursively make numpy types JSON-serialisable."""
        import numpy as np
        if isinstance(obj, dict):
            return {k: _serialisable(v) for k, v in obj.items()}
        if isinstance(obj, list):
            return [_serialisable(i) for i in obj]
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        if isinstance(obj, (np.integer,)):
            return int(obj)
        if isinstance(obj, (np.floating,)):
            return float(obj)
        return obj

    # Build forecast summary (polygon coordinates omitted for brevity in top-level)
    forecast_summary = {}
    for horizon_key, h_data in mod9_output["horizons"].items():
        forecast_summary[horizon_key] = {
            "horizon_hours": h_data["horizon_hours"],
            "center_coords": h_data["center_coords"],
            "particle_count": h_data["particle_count"]
        }

    final_result = {
        "scene_id": scene.scene_id,
        "timestamp": scene.timestamp,
        "mode": "MOCK",
        "bbox": list(scene.bbox),

        # ── Modules 1-5 ─────────────────────────────────────────────────────
        "spill": {
            "detected": mod2_output["spill_detected"],
            "probability": mod4_output["oil_probability"],
            "area_km2": mod2_output["spill_area_km2"],
            "slicks_count": mod2_output["slicks_found"],
            "confidence": mod4_output["confidence"],
            "lookalike_probability": mod4_output["lookalike_probability"],
            "verification_state": mod4_output["verification_state"],
            "verification_required": mod4_output["verification_required"],
            "polygons": mod2_output["polygons"]
        },
        "ships_observed": physical_ships,
        "sensor_fusion": {
            "has_optical": scene.has_optical,
            "sensor_contributions": mod3_output["sensor_contributions"]
        },

        # ── Module 6: AIS Matching [INFERRED] ───────────────────────────────
        "ais_matching": {
            "data_type": "INFERRED",
            "matched_count": len(mod6_output["matched"]),
            "possible_match_count": len(mod6_output["possible_matches"]),
            "unmatched_count": len(mod6_output["unmatched"]),
            "anomalies_count": len(mod6_output["anomalies"]),
            "matched": mod6_output["matched"],
            "possible_matches": mod6_output["possible_matches"],
            "unmatched": mod6_output["unmatched"],
            "anomalies": mod6_output["anomalies"]
        },

        # ── Module 7: Spill Origin [INFERRED] ───────────────────────────────
        "spill_origin": {
            "data_type": "INFERRED",
            "origin_centroid": mod7_output["origin_centroid"],
            "top_origin_zones": mod7_output["top_origin_zones"],
            "estimated_release_time": mod7_output["estimated_release_time"],
            "particle_count": mod7_output["particle_count"]
        },

        # ── Module 8: Attribution [INFERRED] ────────────────────────────────
        "vessel_attribution": {
            "data_type": "INFERRED",
            "disclaimer": mod8_output["disclaimer"],
            "ranked_candidates": mod8_output["candidates"]
        },

        # ── Module 9: Forecast [SIMULATED] ──────────────────────────────────
        "spill_forecast": {
            "data_type": "SIMULATED",
            "horizons": forecast_summary
        },

        # ── Module 10: Uncertainty [SIMULATED] ──────────────────────────────
        "uncertainty": {
            "data_type": "SIMULATED",
            "num_simulations": mod10_output["num_simulations"],
            "overall_prediction_confidence": mod10_output["overall_prediction_confidence"],
            "asset_impact": mod10_output["assets"],
            "disclaimer": mod10_output["disclaimer"]
        },

        # ── Data source flags ────────────────────────────────────────────────
        "data_sources": {
            "sar": True,
            "optical": scene.has_optical,
            "ais": len(ais_records) > 0,
            "oceanographic": bool(ocean_data),
            "geographic": bool(scene.geographic_layers),
            "mode": "MOCK"
        }
    }

    if extended:
        final_result["impact"] = mod11_output
        final_result["priority"] = mod12_output
        final_result["resource_optimization"] = mod13_output
        final_result["explainability"] = mod16_output
        final_result["action_recommendation"] = mod17_output

    # Ensure JSON-serialisable
    final_result = _serialisable(final_result)

    # Save JSON result
    json_path = os.path.join(predictions_dir, f"{scene_id}_result.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(final_result, f, indent=2)

    # ─────────────────────────────────────────────────────────────────────────
    # MAIN VISUALIZATION — Modules 1-5 overview figure
    # ─────────────────────────────────────────────────────────────────────────
    vis_path = visualize_pipeline_results(
        scene_id=scene.scene_id,
        sar_raw=scene.sar_raw,
        sar_processed=scene.sar_processed,
        optical_processed=scene.optical_processed,
        gt_mask=scene.ground_truth_mask,
        prob_map=mod2_output["probability_map"],
        pred_mask=mod2_output["segmentation_mask"],
        spill_polygons=mod2_output["polygons"],
        ship_detections=physical_ships,
        confidence_result={
            "mode": "MOCK",
            "spill_detected": mod2_output["spill_detected"],
            "confidence": mod4_output["confidence"],
            "verification_state": mod4_output["verification_state"]
        },
        output_dir=vis_dir
    )

    # ─────────────────────────────────────────────────────────────────────────
    # SUMMARY LOG
    # ─────────────────────────────────────────────────────────────────────────
    logger.info("=" * 72)
    if extended:
        logger.info("PIPELINE COMPLETE — 17-MODULE EXTENDED DEMO SUMMARY")
    else:
        logger.info("PIPELINE COMPLETE — 10-MODULE SUMMARY")
    logger.info(f"  Scene              : {scene.scene_id}")
    logger.info(f"  Timestamp          : {scene.timestamp}")
    logger.info(f"  Mode               : MOCK (Synthetic data — not scientifically valid)")
    logger.info(f"  Spill Detected     : {mod2_output['spill_detected']}  (Prob={final_prob:.2f})")
    logger.info(f"  Spill Area         : {mod2_output['spill_area_km2']} km²")
    logger.info(f"  Physical Ships     : {len(physical_ships)}")
    logger.info(f"  AIS Matched        : {len(mod6_output['matched'])} | Anomalies: {len(mod6_output['anomalies'])}")
    logger.info(f"  Origin Centroid    : {mod7_output['origin_centroid']}")
    top_attr = mod8_output["candidates"][0] if mod8_output["candidates"] else {}
    logger.info(f"  Top Attribution    : {top_attr.get('vessel_name', 'None')} (Score={top_attr.get('attribution_score', 0.0)})")
    logger.info(f"  Forecast Horizons  : {list(forecast_summary.keys())}")
    logger.info(f"  MC Simulations     : {mod10_output['num_simulations']}")
    logger.info(f"  Overall Confidence : {mod10_output['overall_prediction_confidence']}")
    
    if extended:
        logger.info("-" * 72)
        logger.info("  [M16] EXPLAINABILITY / EVIDENCE GRAPH")
        logger.info(f"    Evidence Nodes   : {len(mod16_output.get('evidence_nodes', []))}")
        logger.info(f"    Evidence Edges   : {len(mod16_output.get('evidence_edges', []))}")
        logger.info(f"    Provenance Stats : {mod16_output.get('provenance_summary', {})}")
        
        # Extract explanations
        expls = {e["decision"]: e["explanation"] for e in mod16_output.get("explanations", [])}
        logger.info(f"    Spill Reason     : {expls.get('spill_credibility', 'N/A')[:80]}...")
        logger.info(f"    Attr Reason      : {expls.get('vessel_attribution', 'N/A')[:80]}...")
        logger.info(f"    Priority Reason  : {expls.get('priority_score', 'N/A')[:80]}...")
        
        logger.info("-" * 72)
        logger.info("  [M17] ACTION RECOMMENDATION")
        rec = mod17_output.get("recommendation", {})
        logger.info(f"    Recommended      : {rec.get('action')}")
        logger.info(f"    Priority         : {rec.get('priority')}")
        logger.info(f"    Urgency Score    : {rec.get('urgency_score')}")
        logger.info(f"    Confidence       : {rec.get('confidence')}")
        logger.info(f"    Actions          : {len(mod17_output.get('recommended_actions', []))} listed")
        logger.info(f"    Verification     : {len(mod17_output.get('verification_actions', []))} listed")
        logger.info(f"    What-If Summary  : {mod17_output.get('whatif_summary', 'N/A')}")

    logger.info(f"  JSON result        : {json_path}")
    logger.info(f"  Visualization      : {vis_path}")
    logger.info("=" * 72)

    # Print abbreviated JSON to console
    console_summary = {
        "scene_id": final_result["scene_id"],
        "mode": "MOCK",
        "spill_detected": final_result["spill"]["detected"],
        "spill_probability": final_result["spill"]["probability"],
        "ships_observed": len(physical_ships),
        "ais_anomalies": len(mod6_output["anomalies"]),
        "origin_centroid": mod7_output["origin_centroid"],
        "top_vessel_attribution": top_attr.get("vessel_name"),
        "attribution_score": top_attr.get("attribution_score"),
        "forecast_horizons": list(forecast_summary.keys()),
        "mc_simulations": mod10_output["num_simulations"],
        "overall_confidence": mod10_output["overall_prediction_confidence"]
    }
    
    if extended:
        rec = mod17_output.get("recommendation", {})
        console_summary["primary_action"] = rec.get("action")
        console_summary["priority_level"] = rec.get("priority")
        console_summary["evidence_nodes"] = len(mod16_output.get("evidence_nodes", []))

    print("\n--- PIPELINE CONSOLE SUMMARY ---")
    print(json.dumps(console_summary, indent=2))

    return json_path


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Run End-to-End Demo")
    parser.add_argument("scene_id", type=str, nargs="?", default="SCENE_001", help="Scene ID to process")
    parser.add_argument("--extended", action="store_true", help="Run extended 17-module pipeline")
    args = parser.parse_args()

    run_end_to_end_demo(scene_id=args.scene_id, extended=args.extended)
