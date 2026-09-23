from typing import Dict, Any, List
from shapely.geometry import Polygon, Point, mapping


def generate_synthetic_geographic(
    bbox_geo: tuple = (12.0, 72.0, 13.0, 73.0),
    seed: int = None
) -> Dict[str, Any]:
    """
    Generates synthetic spatial/geographic feature layers (coastline, protected areas, ports, fisheries).
    Compatible with GeoJSON / Shapely geometries.
    """
    min_lat, min_lon, max_lat, max_lon = bbox_geo

    # 1. Coastline segment
    coastline = {
        "type": "LineString",
        "coordinates": [
            [min_lon, min_lat + 0.1],
            [min_lon + 0.2, (min_lat + max_lat) / 2],
            [min_lon + 0.15, max_lat - 0.1]
        ]
    }

    # 2. Port location
    port_point = Point(min_lon + 0.15, min_lat + 0.3)
    port = {
        "id": "PORT_01",
        "name": "Synthetic Harbor Terminal",
        "type": "Major Commercial Port",
        "geometry": mapping(port_point)
    }

    # 3. Marine Protected Area (MPA)
    mpa_polygon = Polygon([
        [min_lon + 0.5, min_lat + 0.5],
        [min_lon + 0.8, min_lat + 0.5],
        [min_lon + 0.8, min_lat + 0.8],
        [min_lon + 0.5, min_lat + 0.8],
        [min_lon + 0.5, min_lat + 0.5]
    ])
    marine_protected_area = {
        "id": "MPA_01",
        "name": "Coral Reserve Park",
        "sensitivity_index": "HIGH",
        "geometry": mapping(mpa_polygon)
    }

    # 4. Fishery zone
    fishery_polygon = Polygon([
        [min_lon + 0.2, min_lat + 0.6],
        [min_lon + 0.4, min_lat + 0.6],
        [min_lon + 0.4, min_lat + 0.9],
        [min_lon + 0.2, min_lat + 0.9],
        [min_lon + 0.2, min_lat + 0.6]
    ])
    fishery_zone = {
        "id": "FISH_01",
        "name": "Coastal Fishing Grounds",
        "geometry": mapping(fishery_polygon)
    }

    return {
        "bbox": list(bbox_geo),
        "coastline": coastline,
        "ports": [port],
        "protected_areas": [marine_protected_area],
        "fisheries": [fishery_zone]
    }
