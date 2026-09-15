import numpy as np
from typing import Tuple, List, Dict, Any

from src.data_processing.spatial_alignment import pixel_to_geo_coords


def initialize_hindcast_particles(
    spill_mask: np.ndarray = None,
    spill_polygons: List[Dict[str, Any]] = None,
    particle_count: int = 500,
    bbox_geo: Tuple[float, float, float, float] = (12.0, 72.0, 13.0, 73.0),
    seed: int = 42
) -> np.ndarray:
    """
    Initializes N particles distributed spatially across the observed oil spill region.
    
    Returns:
        particles: numpy array of shape [N, 2] containing (latitude, longitude)
    """
    np.random.seed(seed)
    min_lat, min_lon, max_lat, max_lon = bbox_geo

    if spill_mask is not None and np.any(spill_mask == 1):
        h, w = spill_mask.shape
        ys, xs = np.where(spill_mask == 1)
        
        # Sample randomly from oil slick pixels
        sample_indices = np.random.choice(len(ys), size=particle_count, replace=True)
        sample_ys = ys[sample_indices]
        sample_xs = xs[sample_indices]

        particles = []
        for py, px in zip(sample_ys, sample_xs):
            # Add small random sub-pixel jitter
            py_j = py + np.random.uniform(-0.5, 0.5)
            px_j = px + np.random.uniform(-0.5, 0.5)
            lat, lon = pixel_to_geo_coords((py_j, px_j), (h, w), bbox_geo)
            particles.append([lat, lon])

        return np.array(particles, dtype=np.float64)

    # Default: Sample around bounding box center (12.45, 72.45)
    center_lat = (min_lat + max_lat) / 2.0
    center_lon = (min_lon + max_lon) / 2.0
    lats = np.random.normal(center_lat, 0.03, particle_count)
    lons = np.random.normal(center_lon, 0.03, particle_count)

    return np.column_stack([lats, lons])
