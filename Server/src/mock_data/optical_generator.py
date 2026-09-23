import numpy as np
import cv2
from typing import Tuple, List, Dict, Any


def generate_synthetic_optical(
    mask: np.ndarray,
    num_channels: int = 4,
    cloud_cover: float = 0.15,
    seed: int = None
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Generates a synthetic multi-spectral optical image (4 bands: Blue, Green, Red, NIR)
    and a binary cloud mask (1 = cloud, 0 = clear).
    
    Reflectance ranges from 0.0 to 1.0.
    """
    if seed is not None:
        np.random.seed(seed)

    h, w = mask.shape
    optical = np.zeros((h, w, num_channels), dtype=np.float32)

    # 1. Base Ocean Reflectance (Low reflectance, higher in Blue/Green, low NIR)
    # Band 0 (Blue): ~0.08, Band 1 (Green): ~0.06, Band 2 (Red): ~0.03, Band 3 (NIR): ~0.01
    optical[:, :, 0] = np.random.normal(0.08, 0.005, (h, w))
    optical[:, :, 1] = np.random.normal(0.06, 0.005, (h, w))
    optical[:, :, 2] = np.random.normal(0.03, 0.003, (h, w))
    optical[:, :, 3] = np.random.normal(0.01, 0.002, (h, w))

    # 2. Oil Slick Spectral Signature
    # Oil slicks in optical can exhibit sheen (slight reflectance increase or decrease depending on sun glint)
    oil_indices = (mask == 1)
    optical[oil_indices, 0] *= 1.2  # Blue sheen boost
    optical[oil_indices, 1] *= 1.1
    optical[oil_indices, 2] *= 0.9  # Red absorption
    optical[oil_indices, 3] *= 0.8  # NIR absorption

    # 3. Clouds & Cloud Mask
    cloud_mask = np.zeros((h, w), dtype=np.uint8)
    if np.random.rand() < cloud_cover:
        # Generate diffuse cloud patch
        cx, cy = np.random.randint(50, w - 50), np.random.randint(50, h - 50)
        axes = (np.random.randint(30, 80), np.random.randint(20, 60))
        
        cloud_canvas = np.zeros((h, w), dtype=np.float32)
        cv2.ellipse(cloud_canvas, (cx, cy), axes, np.random.randint(0, 180), 0, 360, 1.0, -1)
        cloud_blurred = cv2.GaussianBlur(cloud_canvas, (45, 45), 0)
        
        cloud_mask = (cloud_blurred > 0.4).astype(np.uint8)
        
        # High cloud reflectance across all optical bands (0.6 - 0.95)
        for b in range(num_channels):
            optical[:, :, b] = np.where(cloud_mask == 1, cloud_blurred * 0.85 + 0.1, optical[:, :, b])

    optical = np.clip(optical, 0.0, 1.0)
    return optical, cloud_mask
