"""
src/explainability/evidence_graph.py — Module 16: Explainable AI / Evidence Graph Engine.

Builds a structured evidence graph connecting the outputs of Modules 1-15 into a
transparent chain of evidence answering "Why did the system reach this conclusion?".

Design principles:
  - Consumes existing module outputs only — does not rerun any ML logic.
  - Preserves OBSERVED / INFERRED / SIMULATED / FEEDBACK provenance of each source.
  - Does NOT falsely convert simulated evidence into observed evidence.
  - Provides explanations for: spill credibility, vessel attribution, priority,
    resource allocation, what-if recommendation, and forecast confidence.
  - Uses non-legal, evidence-based language for vessel attribution.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from src.utils.logging import get_logger

logger = get_logger("EvidenceGraphEngine")

# ──────────────────────────────────────────────────────────────────────────────
# Evidence status vocabulary
# ──────────────────────────────────────────────────────────────────────────────
_STATUS_POSITIVE = "positive"
_STATUS_NEGATIVE = "negative"
_STATUS_PARTIAL   = "partial"
_STATUS_VERIFIED  = "verified"
_STATUS_UNCERTAIN = "uncertain"
_STATUS_SIMULATED = "simulated"


def _clip(v: float, lo: float = 0.0, hi: float = 1.0) -> float:
    return max(lo, min(hi, float(v)))


# ──────────────────────────────────────────────────────────────────────────────
# Evidence node / edge builders
# ──────────────────────────────────────────────────────────────────────────────

def _node(
    node_id: str,
    node_type: str,
    source_module: str,
    provenance: str,
    status: str,
    confidence: Optional[float],
    evidence: Dict[str, Any],
    description: str = "",
) -> Dict[str, Any]:
    out: Dict[str, Any] = {
        "id": node_id,
        "type": node_type,
        "source_module": source_module,
        "provenance": provenance,
        "status": status,
        "description": description,
        "evidence": evidence,
    }
    if confidence is not None:
        out["confidence"] = round(float(confidence), 4)
    return out


def _edge(from_id: str, to_id: str, relationship: str) -> Dict[str, Any]:
    return {"from": from_id, "to": to_id, "relationship": relationship}


# ──────────────────────────────────────────────────────────────────────────────
# Text helpers for explanations
# ──────────────────────────────────────────────────────────────────────────────

def _explain_spill_credibility(
    mod2: Dict[str, Any],
    mod3: Dict[str, Any],
    mod4: Dict[str, Any],
) -> str:
    prob    = mod2.get("spill_probability", 0.0)
    area    = mod2.get("spill_area_km2", 0.0)
    conf    = mod4.get("confidence", 0.0)
    la_prob = mod4.get("lookalike_probability", 0.0)
    vs      = mod4.get("verification_state", "unknown")
    sar_c   = mod3.get("sensor_contributions", {}).get("sar_contribution", 0.0)
    opt_c   = mod3.get("sensor_contributions", {}).get("optical_contribution", 0.0)

    parts = [
        f"The spill was considered credible based on the following evidence:",
        f"  • SAR spill probability: {prob:.2%} (Module 2).",
        f"  • Estimated spill area: {area:.2f} km² (Module 2).",
        f"  • Sensor fusion: SAR contribution={sar_c:.2%}, "
        f"optical contribution={opt_c:.2%} (Module 3).",
        f"  • Oil confidence assessment: confidence={conf:.2%}, "
        f"look-alike probability={la_prob:.2%}, "
        f"verification state={vs} (Module 4).",
    ]
    if la_prob > 0.4:
        parts.append(
            f"  ⚠ Elevated look-alike probability ({la_prob:.2%}) indicates some ambiguity. "
            "Independent verification is recommended."
        )
    return " ".join(parts)


def _explain_vessel_attribution(candidates: List[Dict[str, Any]]) -> str:
    if not candidates:
        return (
            "No candidate vessels met the spatial-temporal proximity criteria for "
            "association with the estimated spill origin."
        )
    top = candidates[0]
    name  = top.get("vessel_name", "Unknown")
    score = top.get("attribution_score", 0.0)
    dist  = top.get("min_origin_distance_km", None)
    ev    = top.get("evidence", {})
    parts = [
        f"Vessel '{name}' was the highest-ranked candidate based on available evidence "
        f"(attribution score: {score:.2f})."
    ]
    if dist is not None:
        parts.append(
            f"Its AIS track passed within {dist:.1f} km of the highest-probability "
            "origin zone during the estimated release window (Module 7 hindcast)."
        )
    if ev.get("ais_gap", 0) > 0.5:
        parts.append(
            "An AIS transmission gap was observed during the estimated release interval (Module 6)."
        )
    if ev.get("trajectory", 0) > 0.6:
        parts.append("Trajectory evidence was consistent with originating near the inferred spill zone.")
    parts.append(
        "[Notice: This is the highest-ranked candidate based on circumstantial evidence. "
        "Ranking does not establish legal responsibility or causation.]"
    )
    return " ".join(parts)


def _explain_priority(mod12: Dict[str, Any]) -> str:
    score  = mod12.get("priority_score", 0.0)
    urgency = mod12.get("urgency_label", "UNKNOWN")
    fc     = mod12.get("factor_contributions", {})
    parts  = [
        f"Incident received urgency label '{urgency}' with a priority score of {score:.1f}/100 (Module 12).",
        "Contributing factors:",
    ]
    for fname, fdata in fc.items():
        wc = fdata.get("weighted_contribution", 0.0)
        parts.append(f"  • {fname}: weighted contribution={wc:.4f}")
    return " ".join(parts)


def _explain_resource_allocation(mod13: Dict[str, Any]) -> str:
    method    = mod13.get("optimization_method", "unknown")
    deployed  = mod13.get("total_resources_deployed", 0)
    available = mod13.get("total_resources_available", 0)
    cov       = mod13.get("estimated_coverage_fraction", 0.0)
    allocs    = mod13.get("allocations", [])
    parts = [
        f"Resource allocation used the '{method}' strategy (Module 13). "
        f"{deployed}/{available} resources were deployed, "
        f"estimated coverage: {cov:.2%}.",
    ]
    for a in allocs[:3]:
        parts.append(
            f"  • {a.get('resource_id', '?')} ({a.get('resource_type', '?')}) "
            f"→ {a.get('target_asset', '?')} "
            f"(score={a.get('deployment_score', 0.0):.2f})."
        )
    if len(allocs) > 3:
        parts.append(f"  … and {len(allocs) - 3} additional allocations.")
    return " ".join(parts)


def _explain_whatif(mod14: Dict[str, Any]) -> str:
    rec  = mod14.get("recommended_scenario", "optimized")
    sc   = mod14.get("scenarios", {})
    rec_data = sc.get(rec, {})
    impact_reduction = rec_data.get("estimated_impact_reduction", 0.0)
    coverage = rec_data.get("coverage_fraction", 0.0)

    parts = [
        f"The '{rec}' scenario was recommended by the what-if analysis (Module 14). "
        f"It provides the highest estimated impact reduction ({impact_reduction:.2f}) "
        f"with coverage fraction {coverage:.2%}.",
    ]
    if "optimized" in sc and rec != "optimized":
        opt = sc["optimized"]
        parts.append(
            f"The 'optimized' scenario had coverage {opt.get('coverage_fraction', 0.0):.2%} "
            f"and impact reduction {opt.get('estimated_impact_reduction', 0.0):.2f}."
        )
    if "delayed" in sc:
        dl = sc["delayed"]
        parts.append(
            f"Delayed response scenario coverage: {dl.get('coverage_fraction', 0.0):.2%} — "
            "delay reduces response effectiveness."
        )
    return " ".join(parts)


def _explain_forecast_confidence(mod10: Dict[str, Any]) -> str:
    conf = mod10.get("overall_prediction_confidence", 0.0)
    nsim = mod10.get("num_simulations", 0)
    assets = mod10.get("assets", [])
    hi_prob_assets = [a for a in assets if a.get("impact_probability", 0) > 0.5]
    parts = [
        f"Forecast confidence: {conf:.2%} across {nsim} Monte Carlo simulations (Module 10).",
    ]
    if hi_prob_assets:
        names = ", ".join(a.get("asset", "?") for a in hi_prob_assets[:3])
        parts.append(
            f"Assets with impact probability >50%: {names}."
        )
    if conf < 0.6:
        parts.append(
            "Confidence is below 60%: significant uncertainty remains. "
            "Additional observations or verification are advisable before committing major resources."
        )
    return " ".join(parts)


# ──────────────────────────────────────────────────────────────────────────────
# Main Engine
# ──────────────────────────────────────────────────────────────────────────────

class EvidenceGraphEngine:
    """
    Module 16 Engine — builds the evidence graph from upstream module outputs.

    All inputs are optional: the engine gracefully handles missing upstream
    results by omitting the corresponding evidence nodes.

    Provenance is preserved per node — no SIMULATED data is relabelled as OBSERVED.
    """

    def build_evidence_graph(
        self,
        scene_id: str,
        mod2: Optional[Dict[str, Any]] = None,
        mod3: Optional[Dict[str, Any]] = None,
        mod4: Optional[Dict[str, Any]] = None,
        mod5: Optional[Dict[str, Any]] = None,
        mod6: Optional[Dict[str, Any]] = None,
        mod7: Optional[Dict[str, Any]] = None,
        mod8: Optional[Dict[str, Any]] = None,
        mod9: Optional[Dict[str, Any]] = None,
        mod10: Optional[Dict[str, Any]] = None,
        mod11: Optional[Dict[str, Any]] = None,
        mod12: Optional[Dict[str, Any]] = None,
        mod13: Optional[Dict[str, Any]] = None,
        mod14: Optional[Dict[str, Any]] = None,
        mod15: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Assemble evidence nodes, edges, and natural-language explanations.

        Parameters
        ----------
        scene_id : str
            Scene identifier for this incident.
        mod2..mod15 : dict or None
            Outputs from each upstream module. Missing modules are skipped gracefully.

        Returns
        -------
        dict
            Structured evidence graph with evidence_nodes, evidence_edges,
            explanations, and provenance summary.
        """
        nodes: List[Dict[str, Any]] = []
        edges: List[Dict[str, Any]] = []
        explanations: List[Dict[str, Any]] = []

        last_node: Optional[str] = None

        # ── M2 — Spill Detection ──────────────────────────────────────────────
        if mod2 is not None:
            spill_detected = mod2.get("spill_detected", False)
            spill_prob     = mod2.get("spill_probability", 0.0)
            spill_area     = mod2.get("spill_area_km2", 0.0)
            slicks         = mod2.get("slicks_found", 0)
            n = _node(
                node_id="spill_detection",
                node_type="spill_detection",
                source_module="M2",
                provenance="OBSERVED",
                status=_STATUS_POSITIVE if spill_detected else _STATUS_NEGATIVE,
                confidence=spill_prob,
                evidence={
                    "spill_detected": spill_detected,
                    "spill_probability": round(spill_prob, 4),
                    "spill_area_km2": round(spill_area, 4),
                    "slicks_found": slicks,
                    "polygon_count": len(mod2.get("polygons", [])),
                },
                description="SAR-based U-Net oil spill segmentation (Module 2).",
            )
            nodes.append(n)
            if last_node:
                edges.append(_edge(last_node, "spill_detection", "precedes"))
            last_node = "spill_detection"

        # ── M3 — Sensor Fusion ────────────────────────────────────────────────
        if mod3 is not None:
            fused_prob = mod3.get("spill_probability", 0.0)
            contribs   = mod3.get("sensor_contributions", {})
            sar_c      = contribs.get("sar_contribution", 0.0)
            opt_c      = contribs.get("optical_contribution", 0.0)
            n = _node(
                node_id="sensor_fusion",
                node_type="sensor_fusion",
                source_module="M3",
                provenance="OBSERVED",
                status=_STATUS_POSITIVE if fused_prob > 0.5 else _STATUS_PARTIAL,
                confidence=fused_prob,
                evidence={
                    "fused_spill_probability": round(fused_prob, 4),
                    "sar_contribution": round(sar_c, 4),
                    "optical_contribution": round(opt_c, 4),
                    "has_optical_used": mod3.get("has_optical_used", False),
                },
                description="SAR + optical sensor fusion (Module 3).",
            )
            nodes.append(n)
            if last_node:
                edges.append(_edge(last_node, "sensor_fusion", "supports"))
            last_node = "sensor_fusion"

        # ── M4 — Oil Confidence / Look-Alike ─────────────────────────────────
        if mod4 is not None:
            oil_prob   = mod4.get("oil_probability", 0.0)
            confidence = mod4.get("confidence", 0.0)
            la_prob    = mod4.get("lookalike_probability", 0.0)
            vs         = mod4.get("verification_state", "unknown")
            n = _node(
                node_id="lookalike_check",
                node_type="verification",
                source_module="M4",
                provenance="OBSERVED",
                status=_STATUS_VERIFIED if oil_prob > 0.7 else _STATUS_UNCERTAIN,
                confidence=confidence,
                evidence={
                    "oil_probability": round(oil_prob, 4),
                    "confidence": round(confidence, 4),
                    "lookalike_probability": round(la_prob, 4),
                    "verification_state": vs,
                    "verification_required": mod4.get("verification_required", False),
                },
                description=(
                    "Oil confidence and look-alike discrimination (Module 4). "
                    "High look-alike probability increases uncertainty."
                ),
            )
            nodes.append(n)
            if last_node:
                edges.append(_edge(last_node, "lookalike_check", "supports"))
            last_node = "lookalike_check"

        # ── M5 — Physical Ship Detection ─────────────────────────────────────
        if mod5 is not None:
            ships    = mod5.get("ships", [])
            n = _node(
                node_id="physical_ship_detection",
                node_type="ship_detection",
                source_module="M5",
                provenance="OBSERVED",
                status=_STATUS_POSITIVE if ships else _STATUS_NEGATIVE,
                confidence=None,
                evidence={
                    "ship_count": mod5.get("ship_count", 0),
                    "ships_detected": [
                        {
                            "ship_id": s.get("ship_id", "?"),
                            "lat": s.get("lat"),
                            "lon": s.get("lon"),
                            "confidence": s.get("confidence"),
                        }
                        for s in ships[:5]  # limit to first 5
                    ],
                },
                description="CFAR-based SAR physical vessel detection (Module 5).",
            )
            nodes.append(n)
            if last_node:
                edges.append(_edge(last_node, "physical_ship_detection", "corroborates"))
            last_node = "physical_ship_detection"

        # ── M6 — AIS Matching + Anomaly ───────────────────────────────────────
        if mod6 is not None:
            anomalies = mod6.get("anomalies", [])
            n = _node(
                node_id="ais_matching",
                node_type="ais_evidence",
                source_module="M6",
                provenance="INFERRED",
                status=_STATUS_POSITIVE if anomalies else _STATUS_PARTIAL,
                confidence=None,
                evidence={
                    "matched_count": mod6.get("matched_count", 0),
                    "possible_match_count": mod6.get("possible_match_count", 0),
                    "unmatched_count": mod6.get("unmatched_count", 0),
                    "anomalies_count": mod6.get("anomalies_count", 0),
                    "top_anomalies": [
                        {
                            "mmsi": a.get("mmsi"),
                            "vessel_name": a.get("vessel_name"),
                            "anomaly_score": a.get("anomaly_score"),
                            "gap_minutes": a.get("gap_minutes"),
                        }
                        for a in anomalies[:3]
                    ],
                },
                description=(
                    "AIS track matching and anomaly detection (Module 6). "
                    "INFERRED — derived analytically from AIS data."
                ),
            )
            nodes.append(n)
            if last_node:
                edges.append(_edge(last_node, "ais_matching", "supports"))
            last_node = "ais_matching"

        # ── M7 — Hindcast / Spill Origin ─────────────────────────────────────
        if mod7 is not None:
            origin_c = mod7.get("origin_centroid", [None, None])
            rel_time = mod7.get("estimated_release_time", {})
            top_zones = mod7.get("top_origin_zones", [])
            n = _node(
                node_id="spill_origin_hindcast",
                node_type="hindcast",
                source_module="M7",
                provenance="INFERRED",
                status=_STATUS_POSITIVE if origin_c and origin_c[0] is not None else _STATUS_UNCERTAIN,
                confidence=None,
                evidence={
                    "origin_centroid": origin_c,
                    "estimated_release_time": rel_time,
                    "particle_count": mod7.get("particle_count", 0),
                    "top_zone_count": len(top_zones),
                    "top_zone_centroid": top_zones[0].get("centroid") if top_zones else None,
                    "top_zone_probability": top_zones[0].get("probability") if top_zones else None,
                },
                description=(
                    "Backward particle hindcast to infer spill origin zone "
                    "and release time (Module 7). INFERRED."
                ),
            )
            nodes.append(n)
            if last_node:
                edges.append(_edge(last_node, "spill_origin_hindcast", "feeds_into"))
            last_node = "spill_origin_hindcast"

        # ── M8 — Vessel Attribution ───────────────────────────────────────────
        candidates = []
        if mod8 is not None:
            candidates = mod8.get("ranked_candidates", mod8.get("candidates", []))
            for idx, cand in enumerate(candidates[:3]):
                nid = f"vessel_candidate_{idx + 1}"
                attr_score = cand.get("attribution_score", 0.0)
                ev_dict    = cand.get("evidence", {})
                n = _node(
                    node_id=nid,
                    node_type="vessel_attribution",
                    source_module="M8",
                    provenance="INFERRED",
                    status=_STATUS_POSITIVE,
                    confidence=attr_score,
                    evidence={
                        "rank": cand.get("rank", idx + 1),
                        "mmsi": cand.get("mmsi"),
                        "vessel_name": cand.get("vessel_name"),
                        "attribution_score": round(attr_score, 4),
                        "min_origin_distance_km": cand.get("min_origin_distance_km"),
                        "origin_distance_score": round(ev_dict.get("origin_distance", 0.0), 4),
                        "time_match_score": round(ev_dict.get("time_match", 0.0), 4),
                        "trajectory_score": round(ev_dict.get("trajectory", 0.0), 4),
                        "ais_gap_score": round(ev_dict.get("ais_gap", 0.0), 4),
                        "physical_match_score": round(ev_dict.get("physical_match", 0.0), 4),
                    },
                    description=(
                        f"Candidate vessel ranked #{cand.get('rank', idx + 1)} by evidence-based "
                        f"attribution scoring (Module 8). INFERRED — not legal attribution."
                    ),
                )
                nodes.append(n)
                if last_node:
                    edges.append(_edge(last_node, nid, "supports"))
                last_node = nid

        # ── M9 — Forward Forecast ─────────────────────────────────────────────
        if mod9 is not None:
            horizons = mod9.get("horizons", {})
            h24 = horizons.get("24h", {})
            n = _node(
                node_id="forward_forecast",
                node_type="forecast",
                source_module="M9",
                provenance="SIMULATED",
                status=_STATUS_SIMULATED,
                confidence=None,
                evidence={
                    "particle_count": mod9.get("particle_count", 0),
                    "horizon_keys": list(horizons.keys()),
                    "24h_center": h24.get("center_coords"),
                    "24h_particle_count": h24.get("particle_count"),
                },
                description=(
                    "Forward particle drift forecast (6–72 h horizons) (Module 9). "
                    "SIMULATED — physics-based particle advection."
                ),
            )
            nodes.append(n)
            if last_node:
                edges.append(_edge(last_node, "forward_forecast", "informs"))
            last_node = "forward_forecast"

        # ── M10 — Uncertainty ────────────────────────────────────────────────
        if mod10 is not None:
            pred_conf = mod10.get("overall_prediction_confidence", 0.0)
            assets    = mod10.get("assets", [])
            hi_impact = [a for a in assets if a.get("impact_probability", 0) > 0.5]
            n = _node(
                node_id="uncertainty",
                node_type="uncertainty",
                source_module="M10",
                provenance="SIMULATED",
                status=_STATUS_SIMULATED,
                confidence=pred_conf,
                evidence={
                    "num_simulations": mod10.get("num_simulations", 0),
                    "overall_prediction_confidence": round(pred_conf, 4),
                    "high_impact_asset_count": len(hi_impact),
                    "high_impact_assets": [a.get("asset") for a in hi_impact[:3]],
                },
                description=(
                    "Monte Carlo uncertainty quantification across N simulations (Module 10). "
                    "SIMULATED."
                ),
            )
            nodes.append(n)
            if last_node:
                edges.append(_edge(last_node, "uncertainty", "quantifies"))
            last_node = "uncertainty"

        # ── M11 — Impact ──────────────────────────────────────────────────────
        if mod11 is not None:
            overall_impact = mod11.get("overall_impact_score", 0.0)
            impact_level   = mod11.get("overall_impact_level", "UNKNOWN")
            severity       = mod11.get("spill_severity_score", 0.0)
            top_assets     = sorted(
                mod11.get("assets", []),
                key=lambda a: a.get("asset_impact_score", 0),
                reverse=True,
            )[:3]
            n = _node(
                node_id="impact_prediction",
                node_type="impact",
                source_module="M11",
                provenance="SIMULATED",
                status=_STATUS_SIMULATED,
                confidence=overall_impact,
                evidence={
                    "overall_impact_score": round(overall_impact, 4),
                    "overall_impact_level": impact_level,
                    "spill_severity_score": round(severity, 4),
                    "top_impact_assets": [
                        {
                            "asset": a.get("asset"),
                            "impact_score": a.get("asset_impact_score"),
                            "impact_level": a.get("impact_level"),
                            "sensitivity": a.get("sensitivity"),
                        }
                        for a in top_assets
                    ],
                },
                description="Impact prediction — per-asset impact scoring (Module 11). SIMULATED.",
            )
            nodes.append(n)
            if last_node:
                edges.append(_edge(last_node, "impact_prediction", "informs"))
            last_node = "impact_prediction"

        # ── M12 — Priority ────────────────────────────────────────────────────
        if mod12 is not None:
            p_score  = mod12.get("priority_score", 0.0)
            p_urgency = mod12.get("urgency_label", "UNKNOWN")
            n = _node(
                node_id="priority_score",
                node_type="priority",
                source_module="M12",
                provenance="SIMULATED",
                status=_STATUS_SIMULATED,
                confidence=round(p_score / 100.0, 4),
                evidence={
                    "priority_score": round(p_score, 2),
                    "urgency_label": p_urgency,
                    "factor_contributions": mod12.get("factor_contributions", {}),
                    "weights_used": mod12.get("weights_used", {}),
                },
                description="Priority / urgency scoring 0–100 (Module 12). SIMULATED.",
            )
            nodes.append(n)
            if last_node:
                edges.append(_edge(last_node, "priority_score", "drives"))
            last_node = "priority_score"

        # ── M13 — Resource Optimization ───────────────────────────────────────
        if mod13 is not None:
            allocs = mod13.get("allocations", [])
            n = _node(
                node_id="resource_allocation",
                node_type="resource_plan",
                source_module="M13",
                provenance="SIMULATED",
                status=_STATUS_SIMULATED,
                confidence=None,
                evidence={
                    "optimization_method": mod13.get("optimization_method"),
                    "total_resources_available": mod13.get("total_resources_available"),
                    "total_resources_deployed": mod13.get("total_resources_deployed"),
                    "estimated_coverage_fraction": round(
                        mod13.get("estimated_coverage_fraction", 0.0), 4
                    ),
                    "assets_targeted": mod13.get("assets_targeted"),
                    "top_allocations": [
                        {
                            "resource_id": a.get("resource_id"),
                            "resource_type": a.get("resource_type"),
                            "target_asset": a.get("target_asset"),
                            "deployment_score": a.get("deployment_score"),
                        }
                        for a in allocs[:3]
                    ],
                },
                description="Resource fleet allocation plan (Module 13). SIMULATED.",
            )
            nodes.append(n)
            if last_node:
                edges.append(_edge(last_node, "resource_allocation", "produces"))
            last_node = "resource_allocation"

        # ── M14 — What-If ─────────────────────────────────────────────────────
        if mod14 is not None:
            rec = mod14.get("recommended_scenario", "optimized")
            sc  = mod14.get("scenarios", {})
            rec_data = sc.get(rec, {})
            n = _node(
                node_id="whatif_simulation",
                node_type="whatif",
                source_module="M14",
                provenance="SIMULATED",
                status=_STATUS_SIMULATED,
                confidence=None,
                evidence={
                    "recommended_scenario": rec,
                    "scenario_keys": list(sc.keys()),
                    "recommended_coverage_fraction": round(
                        rec_data.get("coverage_fraction", 0.0), 4
                    ),
                    "recommended_impact_reduction": round(
                        rec_data.get("estimated_impact_reduction", 0.0), 4
                    ),
                    "reference_priority_score": round(
                        mod14.get("reference_priority_score", 0.0), 2
                    ),
                },
                description="What-if scenario comparison (Module 14). SIMULATED.",
            )
            nodes.append(n)
            if last_node:
                edges.append(_edge(last_node, "whatif_simulation", "compares"))
            last_node = "whatif_simulation"

        # ── M15 — Forecast Feedback ───────────────────────────────────────────
        if mod15 is not None:
            iou    = mod15.get("iou", 0.0)
            recal  = mod15.get("recalibration_factor", 0.0)
            interp = mod15.get("recalibration_interpretation", "UNKNOWN")
            n = _node(
                node_id="forecast_feedback",
                node_type="feedback",
                source_module="M15",
                provenance="FEEDBACK",
                status="feedback",
                confidence=recal,
                evidence={
                    "iou": round(iou, 4),
                    "centroid_error_km": mod15.get("centroid_error_km"),
                    "area_error_km2": mod15.get("area_error_km2"),
                    "area_error_fraction": mod15.get("area_error_fraction"),
                    "recalibration_factor": round(recal, 4),
                    "recalibration_interpretation": interp,
                },
                description=(
                    "Forecast-vs-observation feedback comparison (Module 15). "
                    "FEEDBACK — advisory only; does not modify model weights."
                ),
            )
            nodes.append(n)
            if last_node:
                edges.append(_edge(last_node, "forecast_feedback", "validates"))
            last_node = "forecast_feedback"

        # ── Natural-language explanations ─────────────────────────────────────
        if mod2 is not None:
            explanations.append({
                "decision": "spill_credibility",
                "source_modules": ["M2", "M3", "M4"],
                "provenance": "OBSERVED",
                "explanation": _explain_spill_credibility(
                    mod2,
                    mod3 or {},
                    mod4 or {},
                ),
            })

        if mod8 is not None:
            explanations.append({
                "decision": "vessel_attribution",
                "source_modules": ["M6", "M7", "M8"],
                "provenance": "INFERRED",
                "explanation": _explain_vessel_attribution(candidates),
            })

        if mod12 is not None:
            explanations.append({
                "decision": "priority_score",
                "source_modules": ["M2", "M4", "M10", "M11", "M12"],
                "provenance": "SIMULATED",
                "explanation": _explain_priority(mod12),
            })

        if mod13 is not None:
            explanations.append({
                "decision": "resource_allocation",
                "source_modules": ["M11", "M12", "M13"],
                "provenance": "SIMULATED",
                "explanation": _explain_resource_allocation(mod13),
            })

        if mod14 is not None:
            explanations.append({
                "decision": "whatif_recommendation",
                "source_modules": ["M11", "M12", "M13", "M14"],
                "provenance": "SIMULATED",
                "explanation": _explain_whatif(mod14),
            })

        if mod10 is not None:
            explanations.append({
                "decision": "forecast_confidence",
                "source_modules": ["M9", "M10"],
                "provenance": "SIMULATED",
                "explanation": _explain_forecast_confidence(mod10),
            })

        # ── Provenance summary ─────────────────────────────────────────────────
        provenance_counts: Dict[str, int] = {}
        for nd in nodes:
            prov = nd.get("provenance", "UNKNOWN")
            provenance_counts[prov] = provenance_counts.get(prov, 0) + 1

        logger.info(
            "[MODULE 16 EVIDENCE] Built %d nodes, %d edges, %d explanations for scene %s",
            len(nodes), len(edges), len(explanations), scene_id,
        )

        return {
            "scene_id": scene_id,
            "data_type": "SIMULATED",
            "incident": {"scene_id": scene_id},
            "evidence_nodes": nodes,
            "evidence_edges": edges,
            "explanations": explanations,
            "provenance_summary": provenance_counts,
            "disclaimer": (
                "Evidence graph is assembled from synthetic mock data across Modules 1–15. "
                "Provenance labels (OBSERVED / INFERRED / SIMULATED / FEEDBACK) reflect the "
                "data type of each source module. No output constitutes legal attribution or "
                "an operationally validated result."
            ),
        }
