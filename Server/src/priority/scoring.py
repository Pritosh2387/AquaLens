"""
src/priority/scoring.py - Module 12: Priority / Urgency Scoring Engine.

Computes a transparent 0-100 priority score with per-factor explainability.
Formula (weights configurable via configs/config.yaml priority_scoring section):

  Priority = 100 * (
      0.30 * Impact
    + 0.20 * TimeToImpact
    + 0.20 * OilSeverity
    + 0.15 * DetectionConfidence
    + 0.10 * EnvironmentalSensitivity
    + 0.05 * DataQuality
  )
"""
from typing import Any, Dict, List

from src.utils.logging import get_logger
from src.utils.config import load_config

logger = get_logger("PriorityEngine")

URGENCY_LABELS = [
    (80.0, "CRITICAL_URGENT"),
    (60.0, "HIGH_PRIORITY"),
    (40.0, "MEDIUM_PRIORITY"),
    (0.0,  "ROUTINE_MONITORING"),
]

FACTOR_KEYS = [
    "impact",
    "time_to_impact",
    "oil_severity",
    "detection_confidence",
    "environmental_sensitivity",
    "data_quality",
]

DEFAULT_WEIGHTS = {
    "impact": 0.30,
    "time_to_impact": 0.20,
    "oil_severity": 0.20,
    "detection_confidence": 0.15,
    "environmental_sensitivity": 0.10,
    "data_quality": 0.05,
}


def _clip(v: float, lo: float = 0.0, hi: float = 1.0) -> float:
    return max(lo, min(hi, float(v)))


def _urgency(score: float) -> str:
    for threshold, label in URGENCY_LABELS:
        if score >= threshold:
            return label
    return "ROUTINE_MONITORING"


class PriorityEngine:
    """Module 12 Engine - transparent weighted priority scoring."""

    def __init__(self, config_path: str = "configs/config.yaml"):
        self.cfg = load_config(config_path)
        cfg_weights = self.cfg.get("priority_scoring", {}).get("weights", {})
        self.weights = {k: float(cfg_weights.get(k, DEFAULT_WEIGHTS[k])) for k in FACTOR_KEYS}

    def compute_priority(
        self,
        mod2: Dict[str, Any],
        mod4: Dict[str, Any],
        mod10: Dict[str, Any],
        mod11: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Compute 0-100 priority score with factor contributions.
        """
        f_impact = _clip(float(mod11.get("overall_impact_score", 0.0)))

        m10_assets = mod10.get("assets", [])
        min_eta = 72.0
        for a in m10_assets:
            eta = a.get("eta_hours", [72, 72])
            min_eta = min(min_eta, float(eta[0]) if eta else 72.0)
        f_time = _clip(1.0 - min_eta / 72.0)

        oil_prob  = _clip(float(mod4.get("oil_probability", mod2.get("spill_probability", 0.3))))
        area_km2  = float(mod2.get("spill_area_km2", 0.0))
        f_severity = _clip(oil_prob * area_km2 / 100.0 + oil_prob * 0.5)

        f_detect = _clip(float(mod4.get("confidence", 0.5)))

        m11_assets = mod11.get("assets", [])
        max_sens = max((a.get("sensitivity", 0.6) for a in m11_assets), default=0.6)
        f_sensitivity = _clip(float(max_sens))

        f_quality = _clip(float(mod10.get("overall_prediction_confidence", 0.75)))

        factors = {
            "impact": f_impact,
            "time_to_impact": f_time,
            "oil_severity": f_severity,
            "detection_confidence": f_detect,
            "environmental_sensitivity": f_sensitivity,
            "data_quality": f_quality,
        }

        raw_score = sum(self.weights[k] * factors[k] for k in FACTOR_KEYS)
        priority_score = round(_clip(raw_score, 0.0, 1.0) * 100.0, 2)

        contributions = {
            k: {
                "value": round(factors[k], 4),
                "weight": round(self.weights[k], 4),
                "weighted_contribution": round(self.weights[k] * factors[k], 4),
            }
            for k in FACTOR_KEYS
        }

        logger.info(
            "[MODULE 12 PRIORITY] score=%.1f urgency=%s",
            priority_score, _urgency(priority_score)
        )

        return {
            "priority_score": priority_score,
            "urgency_label": _urgency(priority_score),
            "factor_contributions": contributions,
            "weights_used": {k: round(v, 4) for k, v in self.weights.items()},
            "disclaimer": (
                "Priority score is derived from prototype heuristic weights on synthetic mock data. "
                "It is NOT a validated operational metric."
            ),
        }
