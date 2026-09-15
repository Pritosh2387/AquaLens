import os
import json
import numpy as np
from typing import Dict, Any, List

from src.utils.logging import get_logger
from src.utils.config import load_config
from src.mock_data.oil_spill_generator import generate_synthetic_slick_mask
from src.mock_data.sar_generator import generate_synthetic_sar
from src.mock_data.optical_generator import generate_synthetic_optical
from src.mock_data.geographic_generator import generate_synthetic_geographic

logger = get_logger("ScenarioGenerator")


def generate_attribution_scenario(config_path: str = "configs/config.yaml") -> str:
    """
    Generates a realistic multi-vessel scenario explicitly designed to demonstrate Modules 6 through 10.
    
    SCENE_001 setup:
    - Spill detected at T0 (2026-01-01T12:00:00Z)
    - Vessel A (MMSI 419000101): Passed through origin zone, 45-min AIS gap, physically matched -> High attribution
    - Vessel B (MMSI 419000102): Passed near region, no AIS gap, normal behavior -> Medium/Low attribution
    - Vessel C (MMSI 419000103): Operating nearby, trajectory avoids origin zone -> Low attribution
    - Vessel D (SHIP_SAT_004): Satellite physically detected vessel with NO AIS signal -> Unmatched vessel
    """
    cfg = load_config(config_path)
    output_dir = cfg["paths"]["mock_data_dir"]
    bbox = tuple(cfg["mock_generator"]["bounding_box"])  # (12.0, 72.0, 13.0, 73.0)
    
    min_lat, min_lon, max_lat, max_lon = bbox
    t0_str = "2026-01-01T12:00:00Z"
    scene_id = "SCENE_001"

    logger.info(f"[SCENARIO GENERATOR] Building integrated Scenario for '{scene_id}'")

    # 1. Physical Satellite Ships (Observed by Satellite)
    physical_ships = [
        {
            "ship_id": "SHIP_SAT_001",
            "lat": 12.48,
            "lon": 72.48,
            "pixel_center": [115, 122],
            "pixel_bbox": [108, 115, 122, 129],
            "confidence": 0.96,
            "length_m": 180.0
        },
        {
            "ship_id": "SHIP_SAT_002",
            "lat": 12.65,
            "lon": 72.70,
            "pixel_center": [70, 178],
            "pixel_bbox": [64, 172, 76, 184],
            "confidence": 0.94,
            "length_m": 140.0
        },
        {
            "ship_id": "SHIP_SAT_003",
            "lat": 12.25,
            "lon": 72.30,
            "pixel_center": [172, 76],
            "pixel_bbox": [165, 70, 179, 82],
            "confidence": 0.88,
            "length_m": 90.0
        },
        {
            "ship_id": "SHIP_SAT_004",  # Unmatched vessel (No AIS)
            "lat": 12.38,
            "lon": 72.58,
            "pixel_center": [140, 148],
            "pixel_bbox": [133, 142, 147, 154],
            "confidence": 0.92,
            "length_m": 110.0
        }
    ]

    # 2. Synchronized AIS Tracks across T0-3h to T0+1h
    ais_records = [
        # Vessel A: Passes through origin zone [12.40, 72.40], has a 45-min AIS gap during release interval
        {
            "mmsi": 419000101,
            "vessel_name": "MV_TANKER_ALPHA",
            "lat": 12.35,
            "lon": 72.35,
            "timestamp": "2026-01-01T09:30:00Z",
            "sog_knots": 12.0,
            "cog_deg": 45.0,
            "nav_status": "Under way using engine",
            "matched_sat_ship_id": "SHIP_SAT_001"
        },
        {
            "mmsi": 419000101,
            "vessel_name": "MV_TANKER_ALPHA",
            "lat": 12.40,
            "lon": 72.40,  # Directly in origin zone at T0-2h!
            "timestamp": "2026-01-01T10:00:00Z",
            "sog_knots": 12.0,
            "cog_deg": 45.0,
            "nav_status": "Under way using engine",
            "matched_sat_ship_id": "SHIP_SAT_001"
        },
        # 45-minute AIS GAP between 10:00 and 10:45 UTC
        {
            "mmsi": 419000101,
            "vessel_name": "MV_TANKER_ALPHA",
            "lat": 12.46,
            "lon": 72.46,
            "timestamp": "2026-01-01T10:45:00Z",
            "sog_knots": 11.5,
            "cog_deg": 45.0,
            "nav_status": "Under way using engine",
            "matched_sat_ship_id": "SHIP_SAT_001"
        },
        {
            "mmsi": 419000101,
            "vessel_name": "MV_TANKER_ALPHA",
            "lat": 12.48,
            "lon": 72.48,
            "timestamp": "2026-01-01T12:00:00Z",
            "sog_knots": 11.0,
            "cog_deg": 45.0,
            "nav_status": "Under way using engine",
            "matched_sat_ship_id": "SHIP_SAT_001"
        },

        # Vessel B: Passes near region, complete AIS (no gap), normal behavior
        {
            "mmsi": 419000102,
            "vessel_name": "MV_CARGO_BETA",
            "lat": 12.55,
            "lon": 72.60,
            "timestamp": "2026-01-01T10:00:00Z",
            "sog_knots": 14.0,
            "cog_deg": 60.0,
            "nav_status": "Under way using engine",
            "matched_sat_ship_id": "SHIP_SAT_002"
        },
        {
            "mmsi": 419000102,
            "vessel_name": "MV_CARGO_BETA",
            "lat": 12.60,
            "lon": 72.65,
            "timestamp": "2026-01-01T11:00:00Z",
            "sog_knots": 14.0,
            "cog_deg": 60.0,
            "nav_status": "Under way using engine",
            "matched_sat_ship_id": "SHIP_SAT_002"
        },
        {
            "mmsi": 419000102,
            "vessel_name": "MV_CARGO_BETA",
            "lat": 12.65,
            "lon": 72.70,
            "timestamp": "2026-01-01T12:00:00Z",
            "sog_knots": 14.0,
            "cog_deg": 60.0,
            "nav_status": "Under way using engine",
            "matched_sat_ship_id": "SHIP_SAT_002"
        },

        # Vessel C: Operating nearby, but trajectory stays far from origin zone
        {
            "mmsi": 419000103,
            "vessel_name": "MV_FISHING_GAMMA",
            "lat": 12.20,
            "lon": 72.25,
            "timestamp": "2026-01-01T10:00:00Z",
            "sog_knots": 6.0,
            "cog_deg": 180.0,
            "nav_status": "Engaged in fishing",
            "matched_sat_ship_id": "SHIP_SAT_003"
        },
        {
            "mmsi": 419000103,
            "vessel_name": "MV_FISHING_GAMMA",
            "lat": 12.25,
            "lon": 72.30,
            "timestamp": "2026-01-01T12:00:00Z",
            "sog_knots": 6.0,
            "cog_deg": 180.0,
            "nav_status": "Engaged in fishing",
            "matched_sat_ship_id": "SHIP_SAT_003"
        }
    ]

    # 3. Synchronized Oceanographic Environmental Vector Field
    ocean_data = {
        "timestamp": t0_str,
        "bbox": list(bbox),
        "wind_u": 3.5,  # Eastward wind (m/s)
        "wind_v": 2.0,  # Northward wind (m/s)
        "wind_speed_ms": round(float(np.sqrt(3.5**2 + 2.0**2)), 2),
        "wind_direction_deg": 209.7,
        "current_u": 0.35,  # Eastward current (m/s)
        "current_v": 0.20,  # Northward current (m/s)
        "current_speed_ms": round(float(np.sqrt(0.35**2 + 0.20**2)), 2),
        "wave_height_m": 1.4,
        "sea_surface_temperature_c": 26.5
    }

    # 4. Synchronized Geographic Assets Layer
    geo_data = generate_synthetic_geographic(bbox_geo=bbox, seed=42)

    # Save to data/mock/
    with open(os.path.join(output_dir, "ais", f"{scene_id}_ais.json"), "w", encoding="utf-8") as f:
        json.dump(ais_records, f, indent=2)

    with open(os.path.join(output_dir, "ocean", f"{scene_id}_ocean.json"), "w", encoding="utf-8") as f:
        json.dump(ocean_data, f, indent=2)

    logger.info(f"[SCENARIO GENERATOR] Integrated scenario '{scene_id}' generated successfully!")
    return scene_id
