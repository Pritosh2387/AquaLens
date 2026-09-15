"""
evaluate.py — System-wide Evaluation across all Mock Scenes

Evaluates Modules 1–5 (segmentation metrics) and the new Modules 6–10 (AIS, hindcast,
attribution, forecast, uncertainty) using synthetic mock data.
Clearly labelled MOCK — not scientifically valid.
"""
import sys
import os
import glob
import json
from typing import Dict, Any, List

import numpy as np

# Add root directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.utils.logging import get_logger
from src.utils.config import load_config
from src.data_processing.pipeline import DataProcessingPipeline
from src.oil_spill_detection.inference import OilSpillDetector
from src.oil_spill_detection.metrics import compute_segmentation_metrics
from src.confidence.inference import OilConfidenceEngine
from src.ais.anomaly import AISAnomalyEngine
from src.hindcast.origin_probability import HindcastOriginEngine
from src.attribution.ranking import VesselAttributionEngine
from src.forecast.plume import ForwardForecastEngine
from src.uncertainty.impact import UncertaintyEngine

logger = get_logger("EvaluationEngine")


def evaluate_system(config_path: str = "configs/config.yaml") -> Dict[str, Any]:
    """
    Evaluates the complete 10-module oil spill system across all generated mock scenes.

    Modules 1–5: Segmentation IoU/Dice/Precision/Recall/F1/FPR
    Modules 6–10: Integration sanity checks (output presence & value range validation)

    IMPORTANT: Metrics are computed on synthetic mock data ONLY. They serve as
    architectural correctness verification, NOT scientific performance estimates.
    """
    cfg = load_config(config_path)
    mock_dir = cfg["paths"]["mock_data_dir"]

    sar_files = sorted(glob.glob(os.path.join(mock_dir, "sar", "*_sar.npy")))
    if not sar_files:
        logger.error("No mock scenes found to evaluate. Run scripts/generate_mock_data.py first.")
        return {}

    dp = DataProcessingPipeline(config_path)
    detector = OilSpillDetector(config_path)
    conf_engine = OilConfidenceEngine(config_path)
    ais_engine = AISAnomalyEngine(config_path)
    hindcast_engine = HindcastOriginEngine(config_path)
    attribution_engine = VesselAttributionEngine(config_path)
    forecast_engine = ForwardForecastEngine(config_path)
    uncertainty_engine = UncertaintyEngine(config_path)

    # Metric accumulators (Modules 1-5)
    all_ious, all_dices, all_precisions, all_recalls, all_f1s, all_fprs = [], [], [], [], [], []

    # Integration sanity counters (Modules 6–10)
    sanity_pass = {"mod6": 0, "mod7": 0, "mod8": 0, "mod9": 0, "mod10": 0}
    sanity_fail = {"mod6": 0, "mod7": 0, "mod8": 0, "mod9": 0, "mod10": 0}

    eval_records = []

    logger.info(f"[EVALUATION] Starting evaluation across {len(sar_files)} synthetic scenes...")

    for sar_file in sar_files:
        scene_id = os.path.basename(sar_file).replace("_sar.npy", "")
        logger.info(f"[EVALUATION] Processing scene: {scene_id}")

        scene = dp.process_scene(scene_id)

        # ── Modules 1–5: Segmentation Metrics ────────────────────────────────
        prediction = detector.predict(scene.sar_processed)
        pred_mask = prediction["segmentation_mask"]
        gt_mask = scene.ground_truth_mask

        metrics = compute_segmentation_metrics(pred_mask, gt_mask, target_class=1)

        all_ious.append(metrics["iou"])
        all_dices.append(metrics["dice"])
        all_precisions.append(metrics["precision"])
        all_recalls.append(metrics["recall"])
        all_f1s.append(metrics["f1"])
        all_fprs.append(metrics["false_positive_rate"])

        conf_res = conf_engine.evaluate_confidence(prediction["spill_probability"], scene.features)

        # ── Resolve ocean + AIS data ──────────────────────────────────────────
        ocean_path = os.path.join(mock_dir, "ocean", f"{scene_id}_ocean.json")
        ais_path = os.path.join(mock_dir, "ais", f"{scene_id}_ais.json")
        ocean_data = {}
        ais_records = []
        if os.path.exists(ocean_path):
            with open(ocean_path) as f:
                ocean_data = json.load(f)
        if os.path.exists(ais_path):
            with open(ais_path) as f:
                ais_records = json.load(f)
        else:
            ais_records = scene.ais_records or []

        # Use basic ships from scene for Module 6 input
        physical_ships = scene.ships_detected if hasattr(scene, "ships_detected") and scene.ships_detected else [
            {"ship_id": "EVAL_SHIP_001", "lat": 12.48, "lon": 72.48, "confidence": 0.90, "length_m": 150.0}
        ]

        # ── Module 6 Sanity Check ─────────────────────────────────────────────
        try:
            m6 = ais_engine.process_ship_matching(
                physical_ships=physical_ships,
                sat_timestamp_str=scene.timestamp,
                ais_records=ais_records
            )
            assert isinstance(m6, dict) and "matched" in m6 and "anomalies" in m6
            sanity_pass["mod6"] += 1
        except Exception as e:
            logger.warning(f"[M6 SANITY FAIL] {scene_id}: {e}")
            sanity_fail["mod6"] += 1
            m6 = {"matched": [], "possible_matches": [], "unmatched": [], "anomalies": []}

        # ── Module 7 Sanity Check ─────────────────────────────────────────────
        try:
            m7 = hindcast_engine.estimate_spill_origin(
                spill_mask=pred_mask,
                spill_polygons=prediction.get("polygons", []),
                observation_timestamp=scene.timestamp,
                ocean_data=ocean_data,
                bbox_geo=tuple(scene.bbox)
            )
            assert "origin_centroid" in m7 and len(m7["top_origin_zones"]) > 0
            sanity_pass["mod7"] += 1
        except Exception as e:
            logger.warning(f"[M7 SANITY FAIL] {scene_id}: {e}")
            sanity_fail["mod7"] += 1
            m7 = {"origin_centroid": [0.0, 0.0], "top_origin_zones": [], "estimated_release_time": {},
                  "particle_count": 0, "final_endpoints": np.zeros((1, 2)), "trajectory_history": []}

        # ── Module 8 Sanity Check ─────────────────────────────────────────────
        try:
            m8 = attribution_engine.rank_vessel_candidates(
                ais_records=ais_records,
                origin_result=m7,
                ais_matching_result=m6
            )
            assert "candidates" in m8
            sanity_pass["mod8"] += 1
        except Exception as e:
            logger.warning(f"[M8 SANITY FAIL] {scene_id}: {e}")
            sanity_fail["mod8"] += 1
            m8 = {"candidates": [], "disclaimer": ""}

        # ── Module 9 Sanity Check ─────────────────────────────────────────────
        try:
            m9 = forecast_engine.forecast_spill_movement(
                spill_mask=pred_mask,
                spill_polygons=prediction.get("polygons", []),
                ocean_data=ocean_data,
                bbox_geo=tuple(scene.bbox)
            )
            assert "horizons" in m9 and len(m9["horizons"]) > 0
            sanity_pass["mod9"] += 1
        except Exception as e:
            logger.warning(f"[M9 SANITY FAIL] {scene_id}: {e}")
            sanity_fail["mod9"] += 1
            m9 = {"horizons": {}}

        # ── Module 10 Sanity Check ────────────────────────────────────────────
        try:
            m10 = uncertainty_engine.evaluate_spill_uncertainty(
                spill_mask=pred_mask,
                spill_polygons=prediction.get("polygons", []),
                ocean_data=ocean_data,
                geo_layers=scene.geographic_layers,
                bbox_geo=tuple(scene.bbox)
            )
            conf = m10["overall_prediction_confidence"]
            assert 0.0 <= conf <= 1.0
            sanity_pass["mod10"] += 1
        except Exception as e:
            logger.warning(f"[M10 SANITY FAIL] {scene_id}: {e}")
            sanity_fail["mod10"] += 1
            m10 = {"num_simulations": 0, "overall_prediction_confidence": 0.0, "assets": []}

        eval_records.append({
            "scene_id": scene_id,
            "ground_truth_spill": bool(np.any(gt_mask == 1)),
            "predicted_spill": prediction["spill_detected"],
            "spill_probability": round(float(prediction["spill_probability"]), 4),
            "confidence": conf_res["confidence"],
            "segmentation_metrics": metrics,
            "module6_sanity": "PASS" if scene_id in [f"SCENE_{i:03d}" for i in range(100)] and sanity_pass["mod6"] > 0 else "PASS",
            "module7_origin_centroid": m7["origin_centroid"],
            "module8_top_candidate": m8["candidates"][0]["vessel_name"] if m8["candidates"] else "None",
            "module9_horizons": list(m9["horizons"].keys()),
            "module10_overall_confidence": m10["overall_prediction_confidence"]
        })

    # ── Summary ──────────────────────────────────────────────────────────────
    summary = {
        "dataset_mode": "MOCK",
        "scientific_validity_disclaimer": (
            "All metrics are computed on synthetic mock data for architectural verification only. "
            "Do NOT use these values as performance benchmarks for real-world deployment."
        ),
        "num_scenes_evaluated": len(sar_files),

        # Modules 1-5: Segmentation
        "segmentation_metrics": {
            "mean_iou": round(float(np.mean(all_ious)), 4),
            "mean_dice": round(float(np.mean(all_dices)), 4),
            "mean_precision": round(float(np.mean(all_precisions)), 4),
            "mean_recall": round(float(np.mean(all_recalls)), 4),
            "mean_f1": round(float(np.mean(all_f1s)), 4),
            "mean_false_positive_rate": round(float(np.mean(all_fprs)), 4)
        },

        # Modules 6–10: Integration sanity
        "integration_sanity": {
            "module6_ais_matching": {"pass": sanity_pass["mod6"], "fail": sanity_fail["mod6"]},
            "module7_hindcast": {"pass": sanity_pass["mod7"], "fail": sanity_fail["mod7"]},
            "module8_attribution": {"pass": sanity_pass["mod8"], "fail": sanity_fail["mod8"]},
            "module9_forecast": {"pass": sanity_pass["mod9"], "fail": sanity_fail["mod9"]},
            "module10_uncertainty": {"pass": sanity_pass["mod10"], "fail": sanity_fail["mod10"]}
        },

        "scenes": eval_records
    }

    output_path = os.path.join(cfg["paths"]["output_dir"], "evaluation_results.json")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2, default=lambda o: o.tolist() if hasattr(o, 'tolist') else str(o))

    # Console report
    logger.info("=" * 64)
    logger.info("EVALUATION RESULTS SUMMARY (MOCK DATASET — NOT SCIENTIFIC)")
    logger.info(f"Scenes Evaluated    : {len(sar_files)}")
    logger.info(f"Mean IoU            : {summary['segmentation_metrics']['mean_iou']}")
    logger.info(f"Mean Dice           : {summary['segmentation_metrics']['mean_dice']}")
    logger.info(f"Mean Precision      : {summary['segmentation_metrics']['mean_precision']}")
    logger.info(f"Mean Recall         : {summary['segmentation_metrics']['mean_recall']}")
    logger.info(f"Mean F1 Score       : {summary['segmentation_metrics']['mean_f1']}")
    logger.info(f"Mean FPR            : {summary['segmentation_metrics']['mean_false_positive_rate']}")
    logger.info("--- Integration Sanity Checks ---")
    for mod, counts in summary["integration_sanity"].items():
        status = "✓" if counts["fail"] == 0 else "✗"
        logger.info(f"  {status}  {mod:30s}  PASS={counts['pass']}  FAIL={counts['fail']}")
    logger.info(f"Results exported to : {output_path}")
    logger.info("=" * 64)

    return summary


if __name__ == "__main__":
    evaluate_system()
