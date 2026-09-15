import cv2
import numpy as np
from typing import Tuple, List, Dict, Any


def align_raster_grid(
    image: np.ndarray,
    target_shape: Tuple[int, int]
) -> np.ndarray:
    """
    Resamples a raster image (2D or 3D) to match the target spatial shape.
    """
    if image.shape[:2] == target_shape:
        return image

    if image.ndim == 2:
        resampled = cv2.resize(image, (target_shape[1], target_shape[0]), interpolation=cv2.INTER_LINEAR)
    else:
        resampled = cv2.resize(image, (target_shape[1], target_shape[0]), interpolation=cv2.INTER_LINEAR)
    
    return resampled


def pixel_to_geo_coords(
    pixel_coords: Tuple[int, int],
    grid_shape: Tuple[int, int],
    bbox_geo: Tuple[float, float, float, float]
) -> Tuple[float, float]:
    """
    Converts (row, col) pixel coordinates to (latitude, longitude).
    bbox_geo: (min_lat, min_lon, max_lat, max_lon)
    """
    py, px = pixel_coords
    h, w = grid_shape
    min_lat, min_lon, max_lat, max_lon = bbox_geo

    lat = max_lat - (py / h) * (max_lat - min_lat)
    lon = min_lon + (px / w) * (max_lon - min_lon)
    return round(float(lat), 5), round(float(lon), 5)


def geo_to_pixel_coords(
    geo_coords: Tuple[float, float],
    grid_shape: Tuple[int, int],
    bbox_geo: Tuple[float, float, float, float]
) -> Tuple[int, int]:
    """
    Converts (latitude, longitude) to (row, col) pixel coordinates.
    """
    lat, lon = geo_coords
    h, w = grid_shape
    min_lat, min_lon, max_lat, max_lon = bbox_geo

    py = int((max_lat - lat) / (max_lat - min_lat + 1e-8) * h)
    px = int((lon - min_lon) / (max_lon - min_lon + 1e-8) * w)

    py = max(0, min(h - 1, py))
    px = max(0, min(w - 1, px))
    return py, px


def filter_points_by_bbox(
    points: List[Dict[str, Any]],
    bbox_geo: Tuple[float, float, float, float]
) -> List[Dict[str, Any]]:
    """
    Filters point observations (e.g. AIS vessels) to only keep those within bbox_geo.
    """
    min_lat, min_lon, max_lat, max_lon = bbox_geo
    filtered = []
    for pt in points:
        lat = pt.get("lat")
        lon = pt.get("lon")
        if lat is not None and lon is not None:
            if min_lat <= lat <= max_lat and min_lon <= lon <= max_lon:
                filtered.append(pt)
    return filtered
