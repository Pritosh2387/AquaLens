import numpy as np
from typing import List, Dict, Any

from src.utils.logging import get_logger
from src.utils.config import load_config
from src.attribution.candidate_filter import filter_candidate_vessels
from src.attribution.features import extract_candidate_attribution_features
from src.attribution.explanation import generate_attribution_explanation

logger = get_logger("VesselAttributionEngine")


class VesselAttributionEngine:
    """
    Module 8 Engine: Ranks candidate vessels plausibly associated with the estimated spill origin
    based on spatial, temporal, trajectory, and AIS evidence.
    """
    def __init__(self, config_path: str = "configs/config.yaml"):
        self.cfg = load_config(config_path)
        self.attr_cfg = self.cfg["vessel_attribution"]
        self.weights = self.attr_cfg["weights"]

    def rank_vessel_candidates(
        self,
        ais_records: List[Dict[str, Any]],
        origin_result: Dict[str, Any],
        ais_matching_result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Ranks candidate vessels using evidence feature vectors and configurable weights.
        """
        # 1. Candidate Filtering
        candidates = filter_candidate_vessels(
            ais_records=ais_records,
            origin_result=origin_result,
            max_distance_km=15.0
        )

        logger.info(f"[MODULE 8 ATTRIBUTION] Filtering candidates: {len(candidates)} vessels passed origin proximity filter")

        ranked_candidates = []
        w = self.weights

        for cand in candidates:
            mmsi = cand["mmsi"]
            vessel_name = cand["vessel_name"]
            dist_km = cand["min_origin_distance_km"]

            # 2. Evidence Feature Extraction
            evidence = extract_candidate_attribution_features(cand, ais_matching_result)

            # 3. Transparent Weighted Attribution Score
            score = (
                w["distance_score"] * evidence["origin_distance"] +
                w["time_score"] * evidence["time_match"] +
                w["trajectory_score"] * evidence["trajectory"] +
                w["physical_match"] * evidence["physical_match"] +
                w["ais_anomaly"] * evidence["ais_gap"] +
                w["behavior_anomaly"] * evidence["behavior_anomaly"] +
                w["data_quality"] * evidence["data_quality"]
            )

            attr_score = round(float(np.clip(score, 0.05, 0.99)), 2)

            ranked_candidates.append({
                "mmsi": mmsi,
                "vessel_name": vessel_name,
                "attribution_score": attr_score,
                "min_origin_distance_km": dist_km,
                "evidence": evidence
            })

        # Sort candidates descending by attribution_score
        ranked_candidates.sort(key=lambda c: c["attribution_score"], reverse=True)

        # Attach rank and explanation string
        for idx, cand in enumerate(ranked_candidates):
            rank = idx + 1
            cand["rank"] = rank
            cand["explanation"] = generate_attribution_explanation(
                rank=rank,
                vessel_name=cand["vessel_name"],
                mmsi=cand["mmsi"],
                dist_km=cand["min_origin_distance_km"],
                evidence=cand["evidence"]
            )

        logger.info(f"[MODULE 8 ATTRIBUTION] Ranked {len(ranked_candidates)} candidates. Top Rank: {ranked_candidates[0]['vessel_name'] if ranked_candidates else 'None'}")

        return {
            "candidates": ranked_candidates,
            "disclaimer": "Candidate rankings represent circumstantial decision-support metrics and do not establish legal causation."
        }
