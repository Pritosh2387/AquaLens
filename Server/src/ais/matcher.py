import math
from typing import List, Dict, Any, Tuple
from datetime import datetime, timezone

try:
    from geopy.distance import geodesic
    HAS_GEOPY = True
except ImportError:
    HAS_GEOPY = False

from src.data_processing.temporal_alignment import parse_timestamp


def calculate_geodesic_distance_km(coord1: Tuple[float, float], coord2: Tuple[float, float]) -> float:
    """
    Calculates accurate geodesic distance in kilometers between two (lat, lon) coordinates.
    Uses geopy geodesic if available, fallback to Haversine formula.
    """
    if HAS_GEOPY:
        return float(geodesic(coord1, coord2).km)
    
    # Haversine formula fallback
    lat1, lon1 = coord1
    lat2, lon2 = coord2
    R = 6371.0  # Earth radius in km

    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return float(R * c)


def match_spatial_temporal_ais(
    sat_ship: Dict[str, Any],
    sat_timestamp_str: str,
    ais_records: List[Dict[str, Any]],
    radius_km: float = 5.0,
    time_window_minutes: float = 30.0
) -> List[Dict[str, Any]]:
    """
    Searches AIS records within spatial radius_km and temporal time_window_minutes
    from satellite physically observed ship position.
    """
    sat_lat = sat_ship["lat"]
    sat_lon = sat_ship["lon"]
    sat_dt = parse_timestamp(sat_timestamp_str)

    candidates = []

    for ais in ais_records:
        ais_lat = ais.get("lat")
        ais_lon = ais.get("lon")
        ais_ts = ais.get("timestamp")

        if ais_lat is None or ais_lon is None:
            continue

        # Spatial Geodesic Distance
        dist_km = calculate_geodesic_distance_km((sat_lat, sat_lon), (ais_lat, ais_lon))
        if dist_km > radius_km:
            continue

        # Temporal Window
        time_diff_min = 0.0
        if ais_ts:
            ais_dt = parse_timestamp(ais_ts)
            time_diff_min = abs((sat_dt - ais_dt).total_seconds()) / 60.0

        if time_diff_min > time_window_minutes:
            continue

        cand = ais.copy()
        cand["match_distance_km"] = round(dist_km, 3)
        cand["time_difference_minutes"] = round(time_diff_min, 1)
        candidates.append(cand)

    return candidates
