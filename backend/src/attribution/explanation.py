from typing import Dict, Any


def generate_attribution_explanation(
    rank: int,
    vessel_name: str,
    mmsi: int,
    dist_km: float,
    evidence: Dict[str, float]
) -> str:
    """
    Generates a human-readable evidence explanation for a ranked candidate vessel.
    Uses non-definitive wording suitable for decision support.
    """
    phys_match_str = "and was physically observed near the spill region in satellite imagery" if evidence.get("physical_match", 0) > 0.8 else "without direct physical satellite verification"
    gap_str = " It exhibited a notable AIS transmission gap during the estimated release window." if evidence.get("ais_gap", 0) > 0.8 else ""

    text = (
        f"Candidate ranked #{rank} ({vessel_name}, MMSI {mmsi}) because its AIS trajectory "
        f"passed within {dist_km:.1f} km of the highest-probability origin zone during the estimated release interval {phys_match_str}.{gap_str} "
        f"[Notice: Circumstantial decision-support evidence only; does not establish legal causation.]"
    )
    return text
