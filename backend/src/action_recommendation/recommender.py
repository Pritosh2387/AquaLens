"""
src/action_recommendation/recommender.py — Module 17: Action Recommendation / Decision Support.

Transforms outputs from Modules 10–16 into a transparent, rule/scoring-based
action recommendation.

Design principles:
  - NO additional ML models.
  - Transparent rule-based logic — every decision is traceable.
  - Does NOT make legal conclusions or accuse vessels.
  - Uses evidence-based language throughout.
  - Recommendation is advisory only — NOT an autonomous command.

Action categories (in escalating order):
  MONITOR, VERIFY, INVESTIGATE, DEPLOY_RESOURCES, URGENT_RESPONSE, ESCALATE

Decision logic considers:
  1. M12 priority score + urgency label
  2. M11 overall impact score + impact level
  3. M10 overall_prediction_confidence (uncertainty check)
  4. M13 resource availability
  5. M14 what-if scenario comparison
  6. M16 evidence strength (node count, attribution evidence)
  7. M15 forecast quality (recalibration_factor) if available
  8. M8 attribution evidence strength
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from src.utils.logging import get_logger

logger = get_logger("ActionRecommender")

# ──────────────────────────────────────────────────────────────────────────────
# Constants
# ──────────────────────────────────────────────────────────────────────────────

# Action categories ordered by escalation level
ACTION_MONITOR            = "MONITOR"
ACTION_VERIFY             = "VERIFY"
ACTION_INVESTIGATE        = "INVESTIGATE"
ACTION_DEPLOY_RESOURCES   = "DEPLOY_RESOURCES"
ACTION_URGENT_RESPONSE    = "URGENT_RESPONSE"
ACTION_ESCALATE           = "ESCALATE"

VALID_ACTIONS = [
    ACTION_MONITOR,
    ACTION_VERIFY,
    ACTION_INVESTIGATE,
    ACTION_DEPLOY_RESOURCES,
    ACTION_URGENT_RESPONSE,
    ACTION_ESCALATE,
]

_URGENCY_ACTION_MAP = {
    "CRITICAL_URGENT":   ACTION_URGENT_RESPONSE,
    "HIGH_PRIORITY":     ACTION_DEPLOY_RESOURCES,
    "MEDIUM_PRIORITY":   ACTION_INVESTIGATE,
    "ROUTINE_MONITORING": ACTION_MONITOR,
}


def _clip(v: float, lo: float = 0.0, hi: float = 1.0) -> float:
    return max(lo, min(hi, float(v)))


def _safe_float(val: Any, default: float = 0.0) -> float:
    try:
        return float(val)
    except (TypeError, ValueError):
        return default


# ──────────────────────────────────────────────────────────────────────────────
# Recommendation logic helpers
# ──────────────────────────────────────────────────────────────────────────────

def _determine_action(
    priority_score: float,
    urgency_label: str,
    confidence: float,
    impact_score: float,
    impact_level: str,
    uncertainty_high: bool,
    resources_available: bool,
    thresholds: Dict[str, float],
) -> str:
    """
    Transparent rule-based action selection.

    Rules applied in priority order:
      1. If confidence is very low → VERIFY before committing resources.
      2. If uncertainty is very high → VERIFY first.
      3. If priority is CRITICAL and impact is HIGH/CRITICAL → URGENT_RESPONSE.
      4. If priority ≥ high threshold → DEPLOY_RESOURCES (if resources available).
      5. If resources not available → ESCALATE.
      6. Map urgency label to action.
      7. Default → MONITOR.
    """
    conf_low_threshold   = thresholds.get("confidence_low", 0.40)
    unc_high_threshold   = thresholds.get("uncertainty_high", 0.35)
    priority_critical    = thresholds.get("priority_critical", 80.0)
    priority_high        = thresholds.get("priority_high", 60.0)
    priority_medium      = thresholds.get("priority_medium", 40.0)

    # Rule 1: Low confidence → verify first
    if confidence < conf_low_threshold:
        return ACTION_VERIFY

    # Rule 2: High uncertainty → verify first
    if uncertainty_high:
        return ACTION_VERIFY

    # Rule 3: Critical priority + HIGH/CRITICAL impact → urgent
    if (priority_score >= priority_critical
            and impact_level in ("HIGH", "CRITICAL")):
        if resources_available:
            return ACTION_URGENT_RESPONSE
        else:
            return ACTION_ESCALATE

    # Rule 4: High priority + resources → deploy
    if priority_score >= priority_high:
        if resources_available:
            return ACTION_DEPLOY_RESOURCES
        else:
            return ACTION_ESCALATE

    # Rule 5: Medium priority → investigate
    if priority_score >= priority_medium:
        return ACTION_INVESTIGATE

    # Rule 6: Urgency map fallback
    action = _urgency_ACTION_MAP_safe(urgency_label)
    return action


def _urgency_ACTION_MAP_safe(urgency_label: str) -> str:
    return _URGENCY_ACTION_MAP.get(urgency_label, ACTION_MONITOR)


def _build_recommended_actions(
    action: str,
    mod11: Optional[Dict[str, Any]],
    mod13: Optional[Dict[str, Any]],
    mod7: Optional[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """Build a list of concrete recommended action steps."""
    rec_actions: List[Dict[str, Any]] = []

    if action in (ACTION_DEPLOY_RESOURCES, ACTION_URGENT_RESPONSE):
        # Add resource deployments from M13
        if mod13:
            allocs = mod13.get("allocations", [])
            for alloc in allocs[:5]:
                rec_actions.append({
                    "action": f"Deploy {alloc.get('resource_id', 'resource')}",
                    "resource_type": alloc.get("resource_type"),
                    "target": alloc.get("target_asset", "unknown"),
                    "estimated_arrival_hours": alloc.get("estimated_arrival_hours"),
                    "reason": (
                        f"High-priority target '{alloc.get('target_asset', '?')}' identified by "
                        f"impact assessment (Module 11). Deployment score: "
                        f"{alloc.get('deployment_score', 0.0):.2f}."
                    ),
                    "source_module": "M13",
                })

        # Add patrol near origin zone
        if mod7:
            origin_c = mod7.get("origin_centroid", [])
            if origin_c and len(origin_c) == 2:
                rec_actions.append({
                    "action": "Dispatch patrol to inferred origin zone",
                    "target": f"Origin zone near [{origin_c[0]:.3f}, {origin_c[1]:.3f}]",
                    "estimated_arrival_hours": None,
                    "reason": (
                        "Hindcast (Module 7) inferred this location as the highest-probability "
                        "spill origin. Patrol may gather corroborating evidence."
                    ),
                    "source_module": "M7",
                })

    elif action == ACTION_INVESTIGATE:
        if mod7:
            origin_c = mod7.get("origin_centroid", [])
            if origin_c and len(origin_c) == 2:
                rec_actions.append({
                    "action": "Investigate inferred origin zone",
                    "target": f"Origin zone [{origin_c[0]:.3f}, {origin_c[1]:.3f}]",
                    "estimated_arrival_hours": None,
                    "reason": (
                        "Priority is elevated but confidence warrants investigation "
                        "before large-scale resource deployment."
                    ),
                    "source_module": "M7",
                })

    elif action in (ACTION_VERIFY, ACTION_MONITOR):
        rec_actions.append({
            "action": "Acquire additional satellite or aerial imagery",
            "target": "Spill location",
            "estimated_arrival_hours": None,
            "reason": (
                "Current confidence or uncertainty level does not justify "
                "deploying significant resources without verification."
            ),
            "source_module": "M4",
        })

    return rec_actions


def _build_verification_actions(
    action: str,
    confidence: float,
    mod10: Optional[Dict[str, Any]],
    mod15: Optional[Dict[str, Any]],
    thresholds: Dict[str, float],
) -> List[Dict[str, Any]]:
    """Determine what verification steps are recommended."""
    ver_actions: List[Dict[str, Any]] = []

    conf_verification_threshold = thresholds.get("confidence_verification", 0.70)

    if confidence < conf_verification_threshold:
        ver_actions.append({
            "action": "Acquire verification imagery (SAR or optical)",
            "reason": (
                f"Detection confidence is {confidence:.2%} "
                f"(below {conf_verification_threshold:.2%} verification threshold). "
                "Independent observation is recommended before operational commitment."
            ),
            "source_module": "M4",
        })

    if mod10:
        pred_conf = _safe_float(mod10.get("overall_prediction_confidence", 1.0))
        unc_high_threshold = thresholds.get("uncertainty_high", 0.35)
        if pred_conf < (1.0 - unc_high_threshold):
            ver_actions.append({
                "action": "Run updated forecast with latest ocean data",
                "reason": (
                    f"Monte Carlo prediction confidence is {pred_conf:.2%}. "
                    "Forecast uncertainty is significant. "
                    "Updated ocean current data may reduce uncertainty (Module 10)."
                ),
                "source_module": "M10",
            })

    if mod15:
        recal = _safe_float(mod15.get("recalibration_factor", 1.0))
        if recal < 0.5:
            ver_actions.append({
                "action": "Review forecast model calibration",
                "reason": (
                    f"Forecast-vs-observation feedback (Module 15) shows "
                    f"recalibration factor {recal:.2f} ({mod15.get('recalibration_interpretation', '?')}). "
                    "Prior forecasts showed significant deviation from observations."
                ),
                "source_module": "M15",
            })

    return ver_actions


def _vessel_investigation_recommendation(
    candidates: List[Dict[str, Any]],
    confidence: float,
    thresholds: Dict[str, float],
) -> Dict[str, Any]:
    """Determine whether vessel investigation is recommended."""
    if not candidates:
        return {
            "recommended": False,
            "reason": (
                "No candidate vessels passed the spatial-temporal proximity filter. "
                "Vessel investigation cannot be prioritised without candidate evidence."
            ),
        }
    top = candidates[0]
    score = _safe_float(top.get("attribution_score", 0.0))
    name  = top.get("vessel_name", "Unknown")
    mmsi  = top.get("mmsi", "?")
    attr_threshold = thresholds.get("attribution_investigation", 0.40)

    if score >= attr_threshold:
        return {
            "recommended": True,
            "top_candidate": {
                "vessel_name": name,
                "mmsi": mmsi,
                "attribution_score": score,
            },
            "reason": (
                f"Vessel '{name}' (MMSI: {mmsi}) is the highest-ranked candidate "
                f"with attribution score {score:.2f} (Module 8). "
                "Circumstantial evidence suggests proximity to the inferred spill origin. "
                "[Notice: Attribution score is NOT legal proof of responsibility. "
                "Investigation by appropriate authorities is recommended to gather direct evidence.]"
            ),
        }
    else:
        return {
            "recommended": False,
            "top_candidate": {
                "vessel_name": name,
                "mmsi": mmsi,
                "attribution_score": score,
            },
            "reason": (
                f"Highest-ranked candidate '{name}' has attribution score {score:.2f}, "
                f"below the investigation threshold ({attr_threshold:.2f}). "
                "Evidence is insufficient to recommend vessel investigation at this time."
            ),
        }


def _build_evidence_summary(
    mod2: Optional[Dict[str, Any]],
    mod4: Optional[Dict[str, Any]],
    mod8: Optional[Dict[str, Any]],
    mod10: Optional[Dict[str, Any]],
    mod12: Optional[Dict[str, Any]],
    mod16: Optional[Dict[str, Any]],
) -> List[str]:
    """Produce a concise list of key evidence points."""
    summary = []

    if mod2:
        prob = _safe_float(mod2.get("spill_probability", 0))
        area = _safe_float(mod2.get("spill_area_km2", 0))
        summary.append(
            f"SAR spill detection: probability={prob:.2%}, area={area:.2f} km² (Module 2, OBSERVED)."
        )

    if mod4:
        conf = _safe_float(mod4.get("confidence", 0))
        la   = _safe_float(mod4.get("lookalike_probability", 0))
        vs   = mod4.get("verification_state", "unknown")
        summary.append(
            f"Oil confidence: {conf:.2%}, look-alike probability={la:.2%}, "
            f"verification state={vs} (Module 4, OBSERVED)."
        )

    if mod10:
        pred_conf = _safe_float(mod10.get("overall_prediction_confidence", 0))
        summary.append(
            f"Monte Carlo forecast confidence: {pred_conf:.2%} (Module 10, SIMULATED)."
        )

    if mod12:
        p_score = _safe_float(mod12.get("priority_score", 0))
        p_urg   = mod12.get("urgency_label", "UNKNOWN")
        summary.append(
            f"Priority score: {p_score:.1f}/100, urgency: {p_urg} (Module 12, SIMULATED)."
        )

    if mod8:
        candidates = mod8.get("ranked_candidates", mod8.get("candidates", []))
        if candidates:
            top = candidates[0]
            summary.append(
                f"Top attribution candidate: '{top.get('vessel_name', '?')}' "
                f"(MMSI: {top.get('mmsi', '?')}, score={top.get('attribution_score', 0.0):.2f}) "
                "(Module 8, INFERRED — NOT legal attribution)."
            )

    if mod16:
        node_count = len(mod16.get("evidence_nodes", []))
        summary.append(
            f"Evidence graph: {node_count} evidence nodes assembled across Modules 2–15 (Module 16)."
        )

    return summary


# ──────────────────────────────────────────────────────────────────────────────
# Main Engine
# ──────────────────────────────────────────────────────────────────────────────

class ActionRecommender:
    """
    Module 17 Engine — transparent rule/scoring-based decision-support recommender.

    Inputs: outputs of Modules 10–16 (any may be None, handled gracefully).
    Output: structured action recommendation.

    All recommendations are decision-support outputs — NOT autonomous commands.
    All vessel-related language is circumstantial and non-legal.
    """

    # Default thresholds — override via config_path YAML
    _DEFAULT_THRESHOLDS = {
        "confidence_low": 0.40,
        "confidence_verification": 0.70,
        "uncertainty_high": 0.35,       # if (1 - pred_conf) > this → high uncertainty
        "priority_critical": 80.0,
        "priority_high": 60.0,
        "priority_medium": 40.0,
        "attribution_investigation": 0.40,
    }

    def __init__(self, config_path: str = "configs/config.yaml"):
        try:
            from src.utils.config import load_config
            cfg = load_config(config_path)
            # Allow overriding thresholds from config if present
            ar_cfg = cfg.get("action_recommendation", {})
            self.thresholds = {
                **self._DEFAULT_THRESHOLDS,
                **{k: float(v) for k, v in ar_cfg.get("thresholds", {}).items()},
            }
        except Exception:
            self.thresholds = dict(self._DEFAULT_THRESHOLDS)

    def recommend(
        self,
        scene_id: str,
        mod8:  Optional[Dict[str, Any]] = None,
        mod10: Optional[Dict[str, Any]] = None,
        mod11: Optional[Dict[str, Any]] = None,
        mod12: Optional[Dict[str, Any]] = None,
        mod13: Optional[Dict[str, Any]] = None,
        mod14: Optional[Dict[str, Any]] = None,
        mod15: Optional[Dict[str, Any]] = None,
        mod16: Optional[Dict[str, Any]] = None,
        mod7:  Optional[Dict[str, Any]] = None,
        mod2:  Optional[Dict[str, Any]] = None,
        mod4:  Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Produce a transparent action recommendation.

        Parameters
        ----------
        scene_id : str
        mod2..mod16 : optional dicts of upstream module results

        Returns
        -------
        dict  Structured recommendation with action, reasoning, and supporting evidence.
        """
        thresholds = self.thresholds

        # ── Extract key signals ───────────────────────────────────────────────

        # Priority (M12)
        priority_score  = _safe_float(mod12.get("priority_score",  0.0) if mod12 else 0.0)
        urgency_label   = (mod12.get("urgency_label", "ROUTINE_MONITORING") if mod12
                          else "ROUTINE_MONITORING")

        # Confidence — prefer M4 confidence, fall back to M10 pred confidence
        confidence = _safe_float(
            (mod4.get("confidence") if mod4 else None)
            or (mod10.get("overall_prediction_confidence") if mod10 else None)
            or 0.5
        )

        # Impact (M11)
        impact_score = _safe_float(mod11.get("overall_impact_score", 0.0) if mod11 else 0.0)
        impact_level = (mod11.get("overall_impact_level", "LOW") if mod11 else "LOW")

        # Uncertainty (M10)
        pred_conf    = _safe_float(
            mod10.get("overall_prediction_confidence", 1.0) if mod10 else 1.0
        )
        uncertainty_high = (1.0 - pred_conf) > thresholds["uncertainty_high"]

        # Resources (M13)
        resources_available = (
            bool(mod13 and mod13.get("total_resources_deployed", 0) > 0)
        )

        # Attribution candidates (M8)
        candidates = []
        if mod8:
            candidates = mod8.get("ranked_candidates", mod8.get("candidates", []))

        # ── Rule-based action selection ───────────────────────────────────────
        action = _determine_action(
            priority_score=priority_score,
            urgency_label=urgency_label,
            confidence=confidence,
            impact_score=impact_score,
            impact_level=impact_level,
            uncertainty_high=uncertainty_high,
            resources_available=resources_available,
            thresholds=thresholds,
        )

        # ── Compute overall recommendation confidence ─────────────────────────
        # Weighted average: confidence (0.4) + priority_norm (0.3) + impact (0.3)
        priority_norm = _clip(priority_score / 100.0)
        rec_confidence = round(
            _clip(
                0.4 * confidence + 0.3 * priority_norm + 0.3 * impact_score
            ),
            4,
        )

        # ── Build reasoning trace ─────────────────────────────────────────────
        reasoning: List[str] = []
        reasoning.append(
            f"Priority score: {priority_score:.1f}/100 (urgency: {urgency_label}) — M12."
        )
        reasoning.append(
            f"Impact: {impact_level} (overall impact score: {impact_score:.3f}) — M11."
        )
        reasoning.append(
            f"Detection confidence: {confidence:.2%} — M4/M10."
        )
        if uncertainty_high:
            reasoning.append(
                f"Forecast uncertainty is HIGH (prediction confidence: {pred_conf:.2%}, "
                f"threshold: {(1.0 - thresholds['uncertainty_high']):.2%}) — M10. "
                "Verification recommended before major resource commitment."
            )
        else:
            reasoning.append(
                f"Forecast uncertainty is ACCEPTABLE (prediction confidence: {pred_conf:.2%}) — M10."
            )
        if confidence < thresholds["confidence_low"]:
            reasoning.append(
                f"Confidence ({confidence:.2%}) is below low-confidence threshold "
                f"({thresholds['confidence_low']:.2%}) — VERIFY action selected."
            )
        if resources_available:
            deployed = mod13.get("total_resources_deployed", 0) if mod13 else 0
            coverage = mod13.get("estimated_coverage_fraction", 0.0) if mod13 else 0.0
            reasoning.append(
                f"Response resources available: {deployed} deployed, "
                f"coverage {coverage:.2%} — M13."
            )
        else:
            reasoning.append("No response resources allocated (M13 not available or zero deployed).")
        if mod14:
            rec_sc = mod14.get("recommended_scenario", "optimized")
            reasoning.append(f"What-if analysis recommends '{rec_sc}' scenario — M14.")
        if mod16:
            ev_count = len(mod16.get("evidence_nodes", []))
            reasoning.append(
                f"Evidence graph assembled {ev_count} nodes — M16."
            )

        # ── Recommended actions ───────────────────────────────────────────────
        recommended_actions = _build_recommended_actions(
            action=action,
            mod11=mod11,
            mod13=mod13,
            mod7=mod7,
        )

        # ── Verification actions ──────────────────────────────────────────────
        verification_actions = _build_verification_actions(
            action=action,
            confidence=confidence,
            mod10=mod10,
            mod15=mod15,
            thresholds=thresholds,
        )

        # ── Vessel investigation ──────────────────────────────────────────────
        vessel_investigation = _vessel_investigation_recommendation(
            candidates=candidates,
            confidence=confidence,
            thresholds=thresholds,
        )

        # ── Evidence summary ──────────────────────────────────────────────────
        evidence_summary = _build_evidence_summary(
            mod2=mod2,
            mod4=mod4,
            mod8=mod8,
            mod10=mod10,
            mod12=mod12,
            mod16=mod16,
        )

        # ── What-if summary ───────────────────────────────────────────────────
        whatif_summary: Optional[Dict[str, Any]] = None
        if mod14:
            rec_sc   = mod14.get("recommended_scenario", "optimized")
            sc_data  = mod14.get("scenarios", {}).get(rec_sc, {})
            opt_data = mod14.get("scenarios", {}).get("optimized", {})
            whatif_summary = {
                "recommended_scenario": rec_sc,
                "coverage_fraction": round(sc_data.get("coverage_fraction", 0.0), 4),
                "estimated_impact_reduction": round(
                    sc_data.get("estimated_impact_reduction", 0.0), 4
                ),
                "optimized_coverage_fraction": round(
                    opt_data.get("coverage_fraction", 0.0), 4
                ),
                "reason": (
                    f"Scenario '{rec_sc}' provides the highest estimated impact reduction "
                    f"({sc_data.get('estimated_impact_reduction', 0.0):.2f}) "
                    "among evaluated alternatives (Module 14)."
                ),
            }

        logger.info(
            "[MODULE 17 RECOMMEND] scene=%s action=%s priority=%.1f confidence=%.2f urgency=%s",
            scene_id, action, priority_score, confidence, urgency_label,
        )

        return {
            "scene_id": scene_id,
            "data_type": "SIMULATED",
            "recommendation": {
                "action": action,
                "priority": urgency_label,
                "urgency_score": round(priority_score, 2),
                "confidence": rec_confidence,
            },
            "reasoning": reasoning,
            "recommended_actions": recommended_actions,
            "verification_actions": verification_actions,
            "vessel_investigation": vessel_investigation,
            "evidence_summary": evidence_summary,
            "whatif_summary": whatif_summary,
            "disclaimer": (
                "This is a decision-support recommendation generated from synthetic mock data "
                "across Modules 1–16. It is NOT an autonomous operational command. "
                "All vessel attribution language is circumstantial and does not constitute "
                "legal attribution or proof of responsibility. "
                "Outputs must be reviewed by qualified human operators before any operational action."
            ),
        }
