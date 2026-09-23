import cv2
import numpy as np
from typing import Tuple, List, Dict, Any
from shapely.geometry import Polygon, mapping

from src.data_processing.spatial_alignment import pixel_to_geo_coords
from src.data_processing.feature_extraction import extract_shape_features


def postprocess_segmentation_mask(
    prob_map: np.ndarray,
    prob_threshold: float = 0.5,
    min_area_pixels: int = 20,
    morph_kernel_size: int = 3,
    bbox_geo: Tuple[float, float, float, float] = (12.0, 72.0, 13.0, 73.0),
    pixel_size_m: float = 10.0
) -> Tuple[np.ndarray, List[Dict[str, Any]], bool, float]:
    """
    Segmentation Postprocessing Pipeline:
    1. Threshold probability map -> binary mask
    2. Morphological opening/closing mask cleanup
    3. Connected component analysis & minimum-area filtering
    4. Polygon conversion & shape metric extraction
    
    Returns:
        cleaned_mask: 2D binary numpy array
        detected_polygons: List of polygon dicts with geo-coordinates and shape features
        spill_detected: bool
        total_spill_area_km2: float
    """
    h, w = prob_map.shape
    binary_raw = (prob_map >= prob_threshold).astype(np.uint8)

    # Morphological Operations
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (morph_kernel_size, morph_kernel_size))
    opened = cv2.morphologyEx(binary_raw, cv2.MORPH_OPEN, kernel)
    cleaned_mask = cv2.morphologyEx(opened, cv2.MORPH_CLOSE, kernel)

    # Connected Components & Contour Extraction
    contours, _ = cv2.findContours(cleaned_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    detected_polygons = []
    total_area_km2 = 0.0

    filtered_mask = np.zeros((h, w), dtype=np.uint8)

    for idx, cnt in enumerate(contours):
        area_pixels = cv2.contourArea(cnt)
        if area_pixels < min_area_pixels:
            continue  # Filter out tiny noise clusters

        cv2.drawContours(filtered_mask, [cnt], -1, 1, -1)

        # Extract Shape Features
        shape_feats = extract_shape_features(cnt, pixel_size_m=pixel_size_m)
        total_area_km2 += shape_feats["area_km2"]

        # Convert contour pixel points to geographic (lat, lon) coordinates
        geo_coords = []
        for pt in cnt:
            px, py = pt[0]
            lat, lon = pixel_to_geo_coords((py, px), (h, w), bbox_geo)
            geo_coords.append([lon, lat])  # Shapely format: [lon, lat]

        # Ensure valid polygon (at least 3 vertices)
        if len(geo_coords) >= 3:
            geo_coords.append(geo_coords[0])  # Close polygon loop
            try:
                poly_geom = Polygon(geo_coords)
                geojson_geom = mapping(poly_geom)
            except Exception:
                geojson_geom = {"type": "Polygon", "coordinates": [geo_coords]}

            # Mean slick detection probability in this region
            mask_region = np.zeros((h, w), dtype=np.uint8)
            cv2.drawContours(mask_region, [cnt], -1, 1, -1)
            mean_prob = float(np.mean(prob_map[mask_region == 1]))

            detected_polygons.append({
                "slick_id": f"SLICK_{idx+1:03d}",
                "mean_probability": round(mean_prob, 4),
                "shape_features": shape_feats,
                "geometry": geojson_geom
            })

    spill_detected = len(detected_polygons) > 0
    return filtered_mask, detected_polygons, spill_detected, round(total_area_km2, 4)
