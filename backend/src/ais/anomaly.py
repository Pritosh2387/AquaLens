import math
import numpy as np
from typing import List, Dict, Any, Tuple

from src.utils.logging import get_logger
from src.utils.config import load_config
from src.ais.matcher import match_spatial_temporal_ais, calculate_geodesic_distance_km
from src.ais.trajectory import calculate_trajectory_score
from src.ais.gap_detector import detect_ais_gaps

logger = get_logger("AISAnomalyEngine")


class AISAnomalyEngine:
    """
    Module 6 Engine: Matches satellite physical ship detections with AIS tracks,
    detects transmission gaps, and calculates transparent behavior anomaly scores.
    """
    def __init__(self, config_path: str = "configs/config.yaml"):
        self.cfg = load_config(config_path)
        self.ais_cfg = self.cfg["ais_matching"]
        self.weights = self.ais_cfg["weights"]

    def process_ship_matching(
        self,
        physical_ships: List[Dict[str, Any]],
        sat_timestamp_str: str,
        ais_records: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Processes AIS matching and anomaly detection across all physically detected satellite ships.
        """
        radius_km = self.ais_cfg["radius_km"]
        time_win = self.ais_cfg["time_window_minutes"]
        gap_thresh = self.ais_cfg["gap_threshold_minutes"]

        matched_results = []
        possible_matches = []
        unmatched_results = []
        anomalies_detected = []

        logger.info(f"[MODULE 6 AIS MATCHING] Matching {len(physical_ships)} satellite vessels against {len(ais_records)} AIS records")

        for sat_ship in physical_ships:
            sat_id = sat_ship["ship_id"]
            
            # Step 1 & 2: Spatial & Temporal Candidate Search
            candidates = match_spatial_temporal_ais(
                sat_ship=sat_ship,
                sat_timestamp_str=sat_timestamp_str,
                ais_records=ais_records,
                radius_km=radius_km,
                time_window_minutes=time_win
            )

            if not candidates:
                # UNMATCHED vessel (No AIS signal in proximity)
                unmatched_item = {
                    "satellite_ship_id": sat_id,
                    "mmsi": None,
                    "physical_match": False,
                    "lat": sat_ship["lat"],
                    "lon": sat_ship["lon"],
                    "match_distance_km": None,
                    "time_difference_minutes": None,
                    "ais_gap_minutes": 0.0,
                    "position_error_km": None,
                    "trajectory_score": 0.0,
                    "anomaly_score": 0.90,  # High anomaly due to missing AIS transmission
                    "status": "UNMATCHED",
                    "note": "Potential unmatched vessel requiring verification."
                }
                unmatched_results.append(unmatched_item)
                anomalies_detected.append(unmatched_item)
                continue

            # Select best candidate (closest spatial match)
            best_cand = min(candidates, key=lambda c: c["match_distance_km"])
            mmsi = best_cand.get("mmsi")

            # Step 3: Trajectory Analysis
            pos_error_km, traj_score = calculate_trajectory_score(
                sat_ship=sat_ship,
                sat_timestamp_str=sat_timestamp_str,
                ais_record=best_cand
            )

            # Step 4: AIS Gap Detection for this MMSI
            vessel_records = [r for r in ais_records if r.get("mmsi") == mmsi]
            has_gap, gap_duration_min, gap_details = detect_ais_gaps(vessel_records, gap_threshold_minutes=gap_thresh)

            # Step 5: Course & Speed Differences
            course_diff_deg = abs(best_cand.get("cog_deg", 0.0) - 0.0) % 360.0  # Normalized course diff
            speed_diff_knots = abs(best_cand.get("sog_knots", 10.0) - 10.0)

            # Step 6: Transparent Weighted Anomaly Score
            norm_pos_err = float(np.clip(pos_error_km / 5.0, 0.0, 1.0))
            norm_traj_err = float(np.clip(1.0 - traj_score, 0.0, 1.0))
            norm_gap = float(np.clip(gap_duration_min / 60.0, 0.0, 1.0))
            norm_course = float(np.clip(course_diff_deg / 180.0, 0.0, 1.0))
            norm_speed = float(np.clip(speed_diff_knots / 15.0, 0.0, 1.0))

            w = self.weights
            anomaly_score = (
                w["position_error"] * norm_pos_err +
                w["trajectory_error"] * norm_traj_err +
                w["ais_gap"] * norm_gap +
                w["course_difference"] * norm_course +
                w["speed_difference"] * norm_speed
            )
            anomaly_score = round(float(np.clip(anomaly_score, 0.05, 0.99)), 2)

            # Determine Status
            if norm_pos_err < 0.4 and anomaly_score < 0.45:
                status = "MATCHED"
            elif norm_pos_err < 0.8 or has_gap:
                status = "POSSIBLE_MATCH"
            else:
                status = "UNMATCHED"

            record_res = {
                "satellite_ship_id": sat_id,
                "mmsi": mmsi,
                "vessel_name": best_cand.get("vessel_name", "UNKNOWN"),
                "physical_match": True,
                "lat": sat_ship["lat"],
                "lon": sat_ship["lon"],
                "match_distance_km": best_cand["match_distance_km"],
                "time_difference_minutes": best_cand["time_difference_minutes"],
                "ais_gap_minutes": gap_duration_min,
                "position_error_km": pos_error_km,
                "trajectory_score": traj_score,
                "anomaly_score": anomaly_score,
                "status": status
            }

            if status == "MATCHED":
                matched_results.append(record_res)
            elif status == "POSSIBLE_MATCH":
                possible_matches.append(record_res)
            else:
                record_res["note"] = "Potential unmatched vessel requiring verification."
                unmatched_results.append(record_res)

            if anomaly_score > 0.40 or has_gap:
                anomalies_detected.append(record_res)

        logger.info(
            f"[MODULE 6 AIS MATCHING] Matched: {len(matched_results)} | "
            f"Possible: {len(possible_matches)} | Unmatched: {len(unmatched_results)} | "
            f"Anomalies: {len(anomalies_detected)}"
        )

        return {
            "matched": matched_results,
            "possible_matches": possible_matches,
            "unmatched": unmatched_results,
            "anomalies": anomalies_detected
        }
