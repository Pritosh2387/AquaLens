"""
src/resource_optimization/mock_fleet.py

Default mock response fleet for SCENE_001 demonstration.
Loaded from configs/config.yaml resource_optimization.resources.
These are synthetic / mock values - not real operational data.
"""
from typing import Any, Dict, List


DEFAULT_FLEET: List[Dict[str, Any]] = [
    {"type": "skimmer",          "count": 3, "speed_knots": 8,   "capacity_tons": 50,  "range_km": 200,  "home_lat": 12.1,  "home_lon": 72.1},
    {"type": "containment_boom", "count": 5, "speed_knots": 0,   "capacity_tons": 100, "range_km": 50,   "home_lat": 12.15, "home_lon": 72.15},
    {"type": "patrol_vessel",    "count": 2, "speed_knots": 15,  "capacity_tons": 10,  "range_km": 500,  "home_lat": 12.05, "home_lon": 72.05},
    {"type": "drone",            "count": 4, "speed_knots": 40,  "capacity_tons": 0.5, "range_km": 100,  "home_lat": 12.2,  "home_lon": 72.2},
    {"type": "aircraft",         "count": 1, "speed_knots": 120, "capacity_tons": 5,   "range_km": 1000, "home_lat": 12.3,  "home_lon": 72.3},
]
