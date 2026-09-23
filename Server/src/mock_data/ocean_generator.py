import numpy as np
from typing import Dict, Any


def generate_synthetic_oceanographic(
    timestamp_str: str = "2026-01-01T12:00:00Z",
    bbox_geo: tuple = (12.0, 72.0, 13.0, 73.0),
    seed: int = None
) -> Dict[str, Any]:
    """
    Generates synthetic oceanographic measurements for the scene.
    """
    if seed is not None:
        np.random.seed(seed)

    # Wind conditions (u: eastward, v: northward in m/s)
    wind_u = float(np.random.uniform(-8.0, 8.0))
    wind_v = float(np.random.uniform(-8.0, 8.0))
    wind_speed = float(np.sqrt(wind_u**2 + wind_v**2))
    wind_dir = float((np.degrees(np.arctan2(wind_u, wind_v)) + 360) % 360)

    # Current conditions (m/s)
    current_u = float(np.random.uniform(-0.8, 0.8))
    current_v = float(np.random.uniform(-0.8, 0.8))
    current_speed = float(np.sqrt(current_u**2 + current_v**2))

    # Wave height & SST
    wave_height = float(np.random.uniform(0.5, 3.5))  # meters
    sst = float(np.random.uniform(22.0, 29.0))  # deg C

    return {
        "timestamp": timestamp_str,
        "bbox": list(bbox_geo),
        "wind_u": round(wind_u, 2),
        "wind_v": round(wind_v, 2),
        "wind_speed_ms": round(wind_speed, 2),
        "wind_direction_deg": round(wind_dir, 1),
        "current_u": round(current_u, 2),
        "current_v": round(current_v, 2),
        "current_speed_ms": round(current_speed, 2),
        "wave_height_m": round(wave_height, 2),
        "sea_surface_temperature_c": round(sst, 1)
    }
