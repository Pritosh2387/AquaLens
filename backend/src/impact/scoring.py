"""
src/impact/scoring.py - Module 11: Impact Prediction Engine.

Extends Module 10 asset impact_probability with:
  - Spill severity scoring
  - Asset sensitivity classification (prototype heuristics)
  - Time-urgency factor
  - Weighted asset impact score
  - Scene-level aggregate impact score and level

All weights are PROTOTYPE HEURISTICS, not scientifically validated constants.
They are configurable via configs/config.yaml (impact section).
"""
from typing import Any, Dict, List

from src.utils.logging import get_logger
from src.utils.config import load_config
from src.impact.sensitivity import get_sensitivity

logger = get_logger("ImpactEngine")

IMPACT_LEVELS = [
    (0.75, "CRITICAL"),
    (0.50, "HIGH"),
    (0.25, "MEDIUM"),
    (0.0,  "LOW"),
]


def _level(score: float) -> str:
    for threshold, label in IMPACT_LEVELS:
        if score >= threshold:
            return label
    return "LOW"


def _clip(v: float, lo: float = 0.0, hi: float = 1.0) -> float:
    return max(lo, min(hi, float(v)))


class ImpactEngine:
    """
    Module 11 Engine.  Consumes M2, M4, M9, M10 outputs and produces
    per-asset impact scores and a scene-level impact summary.
    """

    def __init__(self, config_path: str = "configs/config.yaml"):
        self.cfg = load_config(config_path)
        self.imp_cfg = self.cfg.get("impact", {})
        self.sev_w = self.imp_cfg.get("severity_weights", {})
        self.aiw = self.imp_cfg.get("asset_impact_weights", {})
        self.sens_table: Dict[str, float] = self.imp_cfg.get("sensitivity_defaults", {})

    def compute_severity(
        self,
        spill_area_km2: float,
        oil_probability: float,
        wind_speed_ms: float,
    ) -> float:
        """
        Compute a 0-1 severity score from spill characteristics.
        All weights are configurable prototype heuristics.
        """
        norm_area = self.sev_w.get("area_normalization_km2", 100.0)
        w_area = self.sev_w.get("area_km2_factor", 0.5)
        w_oil  = self.sev_w.get("oil_probability_factor", 0.3)
        w_wind = self.sev_w.get("wind_factor", 0.2)

        s_area = _clip(spill_area_km2 / max(norm_area, 1.0))
        s_oil  = _clip(oil_probability)
        s_wind = _clip(wind_speed_ms / 15.0)
        return round(_clip(w_area * s_area + w_oil * s_oil + w_wind * s_wind), 4)

    def evaluate_impact(
        self,
        mod2: Dict[str, Any],
        mod4: Dict[str, Any],
        mod10: Dict[str, Any],
        ocean_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Compute per-asset and scene-level impact scores.

        Parameters
        ----------
        mod2 : dict  - Module 2 result (spill_detected, spill_area_km2, spill_probability)
        mod4 : dict  - Module 4 result (oil_probability, confidence)
        mod10 : dict - Module 10 result (assets list with impact_probability, eta_hours)
        ocean_data : dict - ocean conditions (wind_speed_ms)
        """
        spill_area = float(mod2.get("spill_area_km2", 0.0))
        oil_prob   = float(mod4.get("oil_probability", mod2.get("spill_probability", 0.3)))
        wind_speed = float(ocean_data.get("wind_speed_ms", 5.0))

        severity = self.compute_severity(spill_area, oil_prob, wind_speed)

        w_imp  = float(self.aiw.get("impact_probability", 0.50))
        w_time = float(self.aiw.get("time_factor", 0.25))
        w_sens = float(self.aiw.get("sensitivity", 0.15))
        w_sev  = float(self.aiw.get("severity", 0.10))

        m10_assets: List[Dict[str, Any]] = mod10.get("assets", [])
        if not m10_assets:
            logger.warning("[MODULE 11] No M10 assets found; returning minimal impact result.")

        evaluated_assets = []
        total_weighted = 0.0
        total_sensitivity = 0.0

        for asset_rec in m10_assets:
            atype = asset_rec.get("asset_type", "Geographic Asset")
            sensitivity = get_sensitivity(atype, self.sens_table)

            imp_prob = _clip(float(asset_rec.get("impact_probability", 0.0)))
            eta = asset_rec.get("eta_hours", [18, 24])
            eta_mid = (eta[0] + eta[1]) / 2.0
            time_factor = _clip(1.0 - eta_mid / 72.0)

            asset_score = _clip(
                w_imp  * imp_prob +
                w_time * time_factor +
                w_sens * sensitivity +
                w_sev  * severity
            )

            evaluated_assets.append({
                "asset": asset_rec.get("asset", "Unknown"),
                "asset_type": atype,
                "sensitivity": round(sensitivity, 3),
                "impact_probability": round(imp_prob, 4),
                "eta_hours": list(eta),
                "time_to_impact_factor": round(time_factor, 4),
                "asset_impact_score": round(asset_score, 4),
                "impact_level": _level(asset_score),
            })

            total_weighted += asset_score * sensitivity
            total_sensitivity += sensitivity

        overall = _clip(total_weighted / total_sensitivity) if total_sensitivity > 0 else 0.0
        overall = round(overall, 4)

        logger.info(
            "[MODULE 11 IMPACT] Evaluated %d assets. Severity=%.3f OverallImpact=%.3f (%s)",
            len(evaluated_assets), severity, overall, _level(overall)
        )

        return {
            "spill_severity_score": severity,
            "overall_impact_score": overall,
            "overall_impact_level": _level(overall),
            "assets": evaluated_assets,
            "disclaimer": (
                "Impact scores are derived from prototype heuristic weights applied to "
                "synthetic mock data. They are NOT scientifically validated predictions."
            ),
        }
