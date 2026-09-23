import math
from typing import Tuple, Dict, Any

from src.ais.matcher import calculate_geodesic_distance_km
from src.data_processing.temporal_alignment import parse_timestamp


def extrapolate_ais_position(
    lat: float,
    lon: float,
    sog_knots: float,
    cog_deg: float,
    time_delta_seconds: float
) -> Tuple[float, float]:
    """
    Extrapolates vessel position assuming constant velocity motion.
    SOG: Speed over ground in knots (1 knot = 0.514444 m/s)
    COG: Course over ground in degrees (0 = North, 90 = East)
    """
    speed_ms = sog_knots * 0.514444
    distance_m = speed_ms * time_delta_seconds
    distance_km = distance_m / 1000.0

    # Dead reckoning projection
    R = 6371.0  # Earth radius in km
    lat_rad = math.radians(lat)
    lon_rad = math.radians(lon)
    cog_rad = math.radians(cog_deg)

    extrap_lat_rad = math.asin(
        math.sin(lat_rad) * math.cos(distance_km / R) +
        math.cos(lat_rad) * math.sin(distance_km / R) * math.cos(cog_rad)
    )
    extrap_lon_rad = lon_rad + math.atan2(
        math.sin(cog_rad) * math.sin(distance_km / R) * math.cos(lat_rad),
        math.cos(distance_km / R) - math.sin(lat_rad) * math.sin(extrap_lat_rad)
    )

    extrap_lat = round(math.degrees(extrap_lat_rad), 5)
    extrap_lon = round(math.degrees(extrap_lon_rad), 5)
    return extrap_lat, extrap_lon


def calculate_trajectory_score(
    sat_ship: Dict[str, Any],
    sat_timestamp_str: str,
    ais_record: Dict[str, Any]
) -> Tuple[float, float]:
    """
    Extrapolates expected AIS position at satellite acquisition time
    and compares expected position with physical satellite position.
    
    Returns:
        expected_position_error_km: float
        trajectory_score: float (0.0 to 1.0, where 1.0 = perfect trajectory match)
    """
    sat_lat, sat_lon = sat_ship["lat"], sat_ship["lon"]
    sat_dt = parse_timestamp(sat_timestamp_str)
    ais_dt = parse_timestamp(ais_record.get("timestamp", sat_timestamp_str))

    time_delta_seconds = (sat_dt - ais_dt).total_seconds()
    sog = ais_record.get("sog_knots", 10.0)
    cog = ais_record.get("cog_deg", 0.0)

    # Extrapolate expected position
    exp_lat, exp_lon = extrapolate_ais_position(
        lat=ais_record.get("lat", sat_lat),
        lon=ais_record.get("lon", sat_lon),
        sog_knots=sog,
        cog_deg=cog,
        time_delta_seconds=time_delta_seconds
    )

    # Calculate distance error between expected position and satellite position
    position_error_km = calculate_geodesic_distance_km((sat_lat, sat_lon), (exp_lat, exp_lon))

    # Trajectory consistency score (exponential decay over error distance)
    # Error < 1 km -> score ~ 0.95+
    trajectory_score = float(math.exp(-position_error_km / 3.0))

    return round(position_error_km, 3), round(trajectory_score, 3)
