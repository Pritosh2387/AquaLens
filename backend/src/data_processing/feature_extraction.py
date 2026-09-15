import numpy as np
import cv2
from typing import Dict, Any, List
from shapely.geometry import Polygon


def extract_sar_features(sar_image: np.ndarray, mask: np.ndarray = None) -> Dict[str, float]:
    """
    Extracts backscatter statistics and texture features from SAR image.
    """
    target_pixels = sar_image[mask == 1] if (mask is not None and np.any(mask == 1)) else sar_image.flatten()

    mean_val = float(np.mean(target_pixels))
    std_val = float(np.std(target_pixels))
    min_val = float(np.min(target_pixels))
    max_val = float(np.max(target_pixels))
    p10 = float(np.percentile(target_pixels, 10))
    p50 = float(np.percentile(target_pixels, 50))
    p90 = float(np.percentile(target_pixels, 90))

    # Local texture / variance
    kernel = np.ones((5, 5), np.float32) / 25.0
    local_mean = cv2.filter2D(sar_image, -1, kernel)
    local_var = cv2.filter2D(sar_image**2, -1, kernel) - local_mean**2
    texture_score = float(np.mean(np.sqrt(np.maximum(local_var, 0))))

    # Contrast score (background mean vs slick mean)
    bg_mean = float(np.mean(sar_image[mask == 0])) if (mask is not None and np.any(mask == 0)) else mean_val
    local_contrast = abs(bg_mean - mean_val)

    return {
        "sar_mean_db": round(mean_val, 2),
        "sar_std_db": round(std_val, 2),
        "sar_min_db": round(min_val, 2),
        "sar_max_db": round(max_val, 2),
        "sar_p10_db": round(p10, 2),
        "sar_p50_db": round(p50, 2),
        "sar_p90_db": round(p90, 2),
        "sar_texture_score": round(texture_score, 3),
        "sar_local_contrast": round(local_contrast, 2)
    }


def extract_optical_features(optical_image: np.ndarray, mask: np.ndarray = None) -> Dict[str, float]:
    """
    Extracts spectral statistics, NDVI, and NDWI indices from optical image.
    Bands: 0: Blue, 1: Green, 2: Red, 3: NIR
    """
    h, w, c = optical_image.shape
    b_blue = optical_image[:, :, 0]
    b_green = optical_image[:, :, 1]
    b_red = optical_image[:, :, 2]
    b_nir = optical_image[:, :, 3]

    # NDVI: (NIR - Red) / (NIR + Red)
    ndvi = (b_nir - b_red) / (b_nir + b_red + 1e-8)
    # NDWI: (Green - NIR) / (Green + NIR)
    ndwi = (b_green - b_nir) / (b_green + b_nir + 1e-8)

    target_idx = (mask == 1) if (mask is not None and np.any(mask == 1)) else np.ones((h, w), dtype=bool)

    mean_ndvi = float(np.mean(ndvi[target_idx]))
    mean_ndwi = float(np.mean(ndwi[target_idx]))
    mean_blue = float(np.mean(b_blue[target_idx]))
    mean_nir = float(np.mean(b_nir[target_idx]))

    # Optical agreement score (oil vs background spectral contrast)
    bg_idx = (mask == 0) if (mask is not None and np.any(mask == 0)) else ~target_idx
    bg_ndwi = float(np.mean(ndwi[bg_idx])) if np.any(bg_idx) else mean_ndwi
    optical_agreement = float(np.clip(1.0 - abs(mean_ndwi - bg_ndwi), 0.0, 1.0))

    return {
        "optical_mean_blue": round(mean_blue, 4),
        "optical_mean_nir": round(mean_nir, 4),
        "optical_mean_ndvi": round(mean_ndvi, 4),
        "optical_mean_ndwi": round(mean_ndwi, 4),
        "optical_agreement_score": round(optical_agreement, 3)
    }


def extract_shape_features(contour_coords: np.ndarray, pixel_size_m: float = 10.0) -> Dict[str, float]:
    """
    Extracts geometric shape metrics from a slick contour:
    area, perimeter, compactness, elongation, aspect ratio.
    """
    if contour_coords is None or len(contour_coords) < 3:
        return {
            "area_km2": 0.0,
            "perimeter_km": 0.0,
            "compactness": 0.0,
            "elongation": 0.0,
            "aspect_ratio": 1.0,
            "shape_score": 0.5
        }

    area_pixels = cv2.contourArea(contour_coords)
    perimeter_pixels = cv2.arcLength(contour_coords, True)

    area_m2 = area_pixels * (pixel_size_m ** 2)
    area_km2 = area_m2 / 1e6
    perimeter_m = perimeter_pixels * pixel_size_m
    perimeter_km = perimeter_m / 1000.0

    # Compactness (Isoperimetric Quotient): 4 * pi * Area / Perimeter^2
    # Circular shapes ~ 1.0; Elongated oil slicks << 0.5
    compactness = (4.0 * np.pi * area_pixels) / ((perimeter_pixels ** 2) + 1e-8)
    compactness = float(np.clip(compactness, 0.0, 1.0))

    # Bounding Box / Aspect Ratio & Elongation
    rect = cv2.minAreaRect(contour_coords)
    (cx, cy), (w_box, h_box), angle = rect
    major_axis = max(w_box, h_box)
    minor_axis = min(w_box, h_box)
    aspect_ratio = float(major_axis / (minor_axis + 1e-8))
    elongation = float(1.0 - (minor_axis / (major_axis + 1e-8)))

    # Higher shape score for elongated, irregular slicks (typical of oil spills)
    shape_score = float(np.clip(0.6 * elongation + 0.4 * (1.0 - compactness), 0.0, 1.0))

    return {
        "area_km2": round(area_km2, 4),
        "perimeter_km": round(perimeter_km, 3),
        "compactness": round(compactness, 3),
        "elongation": round(elongation, 3),
        "aspect_ratio": round(aspect_ratio, 2),
        "shape_score": round(shape_score, 3)
    }


def extract_environmental_features(ocean_data: Dict[str, Any]) -> Dict[str, float]:
    """
    Extracts environmental factors (wind, waves, currents, SST).
    """
    wind_speed = ocean_data.get("wind_speed_ms", 5.0)
    wave_height = ocean_data.get("wave_height_m", 1.5)
    current_speed = ocean_data.get("current_speed_ms", 0.3)

    # Wind condition suitability for SAR oil spill detection:
    # Ideal wind range: 2.0 to 12.0 m/s.
    # Low wind (<2 m/s) causes widespread dark look-alikes.
    # High wind (>12 m/s) disperses oil slicks.
    if wind_speed < 2.0 or wind_speed > 12.0:
        wind_condition = 0.3
    else:
        wind_condition = 0.9

    wave_condition = float(np.clip(1.0 - (wave_height / 5.0), 0.1, 1.0))

    return {
        "wind_speed_ms": wind_speed,
        "wind_direction_deg": ocean_data.get("wind_direction_deg", 0.0),
        "wind_condition_score": round(wind_condition, 2),
        "current_speed_ms": current_speed,
        "wave_height_m": wave_height,
        "wave_condition_score": round(wave_condition, 2),
        "sea_surface_temperature_c": ocean_data.get("sea_surface_temperature_c", 25.0)
    }
