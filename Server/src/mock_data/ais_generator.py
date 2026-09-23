import numpy as np
from typing import List, Dict, Any


def generate_synthetic_ais(
    satellite_ships: List[Dict[str, Any]],
    timestamp_str: str = "2026-01-01T12:00:00Z",
    bbox_geo: tuple = (12.0, 72.0, 13.0, 73.0),
    dark_vessel_ratio: float = 0.33,
    seed: int = None
) -> List[Dict[str, Any]]:
    """
    Generates synthetic AIS vessel records.
    Intentionally creates a mismatch between satellite physically observed ships and AIS reported ships:
    - ~67% of satellite ships have AIS broadcasts (cooperative vessels)
    - ~33% of satellite ships have NO AIS broadcasts (Dark Vessels)
    - Generates extra AIS ships moving outside satellite view
    """
    if seed is not None:
        np.random.seed(seed)

    ais_records = []
    min_lat, min_lon, max_lat, max_lon = bbox_geo

    # 1. AIS entries for cooperative satellite ships
    for i, ship in enumerate(satellite_ships):
        # Decide if this ship broadcasts AIS or is a dark vessel
        if np.random.rand() > dark_vessel_ratio:
            # Cooperative vessel: AIS location is close to satellite detected location (with slight offset)
            lat_offset = np.random.uniform(-0.002, 0.002)
            lon_offset = np.random.uniform(-0.002, 0.002)
            
            ais_records.append({
                "mmsi": int(367000000 + i * 12345 + np.random.randint(100, 999)),
                "vessel_name": f"MV_CARGO_{i+1:02d}",
                "lat": round(float(ship["lat"] + lat_offset), 5),
                "lon": round(float(ship["lon"] + lon_offset), 5),
                "timestamp": timestamp_str,
                "sog_knots": round(float(np.random.uniform(5.0, 18.0)), 1),
                "cog_deg": round(float(np.random.uniform(0.0, 360.0)), 1),
                "nav_status": "Under way using engine",
                "matched_sat_ship_id": ship["ship_id"]
            })

    # 2. Extra AIS ships operating in the region (without matching satellite ships)
    num_extra = np.random.randint(1, 4)
    for k in range(num_extra):
        extra_lat = np.random.uniform(min_lat + 0.1, max_lat - 0.1)
        extra_lon = np.random.uniform(min_lon + 0.1, max_lon - 0.1)
        ais_records.append({
            "mmsi": int(538000000 + k * 54321 + np.random.randint(100, 999)),
            "vessel_name": f"TANKER_TRANSIT_{k+1:02d}",
            "lat": round(float(extra_lat), 5),
            "lon": round(float(extra_lon), 5),
            "timestamp": timestamp_str,
            "sog_knots": round(float(np.random.uniform(10.0, 22.0)), 1),
            "cog_deg": round(float(np.random.uniform(0.0, 360.0)), 1),
            "nav_status": "Under way using engine",
            "matched_sat_ship_id": None
        })

    return ais_records
