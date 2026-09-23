import numpy as np
from typing import Tuple, List, Dict, Any


def generate_synthetic_ships(
    shape: Tuple[int, int] = (256, 256),
    num_ships: int = 3,
    bbox_geo: Tuple[float, float, float, float] = (12.0, 72.0, 13.0, 73.0),
    seed: int = None
) -> List[Dict[str, Any]]:
    """
    Generates synthetic ship positions in both pixel grid and geographical coordinates.
    """
    if seed is not None:
        np.random.seed(seed)

    h, w = shape
    min_lat, min_lon, max_lat, max_lon = bbox_geo
    ships = []

    for i in range(num_ships):
        px = np.random.randint(20, w - 20)
        py = np.random.randint(20, h - 20)
        
        box_w = np.random.randint(4, 10)
        box_h = np.random.randint(6, 16)
        
        # Bounding box [ymin, xmin, ymax, xmax] in pixels
        ymin = max(0, py - box_h // 2)
        ymax = min(h, py + box_h // 2)
        xmin = max(0, px - box_w // 2)
        xmax = min(w, px + box_w // 2)
        
        # Convert pixel to geographical lat/lon
        lat = max_lat - (py / h) * (max_lat - min_lat)
        lon = min_lon + (px / w) * (max_lon - min_lon)
        
        ships.append({
            "ship_id": f"SHIP_SAT_{i+1:03d}",
            "pixel_center": [py, px],
            "pixel_bbox": [ymin, xmin, ymax, xmax],
            "lat": round(float(lat), 5),
            "lon": round(float(lon), 5),
            "length_m": round(float(np.random.uniform(40, 250)), 1),
            "confidence": round(float(np.random.uniform(0.85, 0.99)), 2)
        })

    return ships
