import math
import numpy as np
from typing import Dict, Any


def extract_candidate_attribution_features(
    candidate: Dict[str, Any],
    ais_matching_result: Dict[str, Any]
) -> Dict[str, float]:
    """
    Extracts 0 to 1 normalized evidence metrics for a candidate vessel.
    Higher score (1.0) = Stronger circumstantial evidence association.
    """
    dist_km = candidate.get("min_origin_distance_km", 10.0)
    records = candidate.get("all_records", [])
    mmsi = candidate.get("mmsi")

    # 1. Origin Distance Score (Exponential decay from 0 km to 15 km)
    dist_score = float(math.exp(-dist_km / 3.0))

    # 2. Time Match Score (Passed near origin during release interval)
    time_score = 0.90 if dist_km < 5.0 else 0.60

    # 3. Trajectory Score
    traj_score = float(np.clip(1.0 - (dist_km / 12.0), 0.1, 0.95))

    # 4. Physical Satellite Match Score
    # Check if this MMSI matched a physical satellite ship in Module 6
    matched_list = ais_matching_result.get("matched", []) + ais_matching_result.get("possible_matches", [])
    matched_mmsis = [r.get("mmsi") for r in matched_list]
    physical_match_score = 0.96 if mmsi in matched_mmsis else 0.30

    # 5. AIS Gap Score (Presence of signal gap increases anomaly weight)
    anomalies = ais_matching_result.get("anomalies", [])
    mmsi_anomalies = [a for a in anomalies if a.get("mmsi") == mmsi]
    has_gap = any(a.get("ais_gap_minutes", 0) > 30 for a in mmsi_anomalies)
    ais_gap_score = 0.85 if has_gap else 0.20

    # 6. Behavior Anomaly Score
    max_anomaly = max([a.get("anomaly_score", 0.1) for a in mmsi_anomalies], default=0.1)
    behavior_score = float(np.clip(max_anomaly, 0.1, 0.95))

    # 7. Data Quality Score
    data_quality_score = 0.90 if len(records) >= 3 else 0.50

    return {
        "origin_distance": round(dist_score, 2),
        "time_match": round(time_score, 2),
        "trajectory": round(traj_score, 2),
        "physical_match": round(physical_match_score, 2),
        "ais_gap": round(ais_gap_score, 2),
        "behavior_anomaly": round(behavior_score, 2),
        "data_quality": round(data_quality_score, 2)
    }
