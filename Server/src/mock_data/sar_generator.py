import numpy as np
import cv2
from typing import Tuple, List, Dict, Any


def generate_synthetic_sar(
    mask: np.ndarray,
    ships: List[Dict[str, Any]],
    mean_backscatter_db: float = -12.0,
    noise_level: float = 0.15,
    seed: int = None
) -> np.ndarray:
    """
    Generates a 2D SAR image (intensity backscatter in dB) based on the mask and ship positions.
    
    Physics modeled:
    - Sea surface background backscatter (e.g. -12 dB)
    - Speckle noise (multiplicative noise in intensity / additive in dB)
    - Oil slick damping: reduces backscatter by 8 to 14 dB (dark features)
    - Look-alike damping: milder drop by 3 to 6 dB
    - Ships: strong metallic corner reflections (+15 to +25 dB bright spots)
    """
    if seed is not None:
        np.random.seed(seed)

    h, w = mask.shape
    
    # 1. Background ocean backscatter with multiplicative speckle
    # Linear scale amplitude
    ocean_mean = 10 ** (mean_backscatter_db / 10.0)
    # Gamma/Rayleigh distributed speckle noise
    speckle = np.random.gamma(shape=4.0, scale=0.25, size=(h, w))
    sar_linear = ocean_mean * speckle

    # Add subtle background texture (wave patterns)
    x = np.linspace(0, 4 * np.pi, w)
    y = np.linspace(0, 4 * np.pi, h)
    xx, yy = np.meshgrid(x, y)
    waves = 0.15 * np.sin(xx + yy)
    sar_linear *= (1.0 + waves)

    # 2. Apply Oil Slick Damping (Class 1)
    # Oil dampens capillary waves, lowering backscatter signal
    slick_damping = np.random.uniform(0.1, 0.25, size=(h, w))
    sar_linear[mask == 1] *= slick_damping[mask == 1]

    # 3. Apply Look-alike Damping (Class 2)
    lookalike_damping = np.random.uniform(0.4, 0.6, size=(h, w))
    sar_linear[mask == 2] *= lookalike_damping[mask == 2]

    # 4. Add Ship Bright Reflections
    for ship in ships:
        py, px = ship["pixel_center"]
        ymin, xmin, ymax, xmax = ship["pixel_bbox"]
        # Metallic target has high backscatter peak
        sar_linear[ymin:ymax, xmin:xmax] += np.random.uniform(5.0, 15.0)

    # 5. Convert to dB scale [-35 dB, 0 dB]
    sar_db = 10.0 * np.log10(np.clip(sar_linear, 1e-5, 10.0))
    sar_db = np.clip(sar_db, -35.0, 5.0)

    return sar_db.astype(np.float32)
