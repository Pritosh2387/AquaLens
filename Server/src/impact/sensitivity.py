"""
src/impact/sensitivity.py

NOTE: All sensitivity values are PROTOTYPE HEURISTICS for demonstration purposes.
They are NOT scientifically validated constants.  Values are configurable via
configs/config.yaml under impact.sensitivity_defaults.
"""
from typing import Dict

DEFAULT_SENSITIVITY: Dict[str, float] = {
    "Protected Area": 1.0,
    "Beach": 0.85,
    "Fishery Zone": 0.80,
    "Critical Infrastructure": 0.90,
    "Coastal Settlement": 0.75,
    "Port": 0.70,
    "Tourism Area": 0.65,
    "Geographic Asset": 0.60,
}


def get_sensitivity(asset_type: str, sensitivity_table: Dict[str, float]) -> float:
    """Return sensitivity weight for asset_type, falling back to defaults."""
    if asset_type in sensitivity_table:
        return float(sensitivity_table[asset_type])
    if asset_type in DEFAULT_SENSITIVITY:
        return DEFAULT_SENSITIVITY[asset_type]
    return 0.60  # unknown type fallback
