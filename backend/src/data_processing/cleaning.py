import numpy as np
import cv2
from scipy.ndimage import uniform_filter, variance
from typing import Tuple


def apply_lee_filter(img: np.ndarray, size: int = 5) -> np.ndarray:
    """
    Applies Lee Speckle Filter for SAR image noise reduction.
    
    Formula:
    filtered = mean + weights * (img - mean)
    weight = var / (var + noise_var)
    """
    img_mean = uniform_filter(img, size)
    img_sqr_mean = uniform_filter(img**2, size)
    img_variance = img_sqr_mean - img_mean**2

    # Overall noise variance estimation
    overall_variance = variance(img)
    img_weights = img_variance / (img_variance + overall_variance + 1e-8)

    filtered = img_mean + img_weights * (img - img_mean)
    return filtered.astype(np.float32)


def preprocess_sar_data(
    sar_img: np.ndarray,
    speckle_method: str = "lee",
    kernel_size: int = 5
) -> np.ndarray:
    """
    SAR Preprocessing Pipeline:
    1. Calibration (dB scaling - mock operates on dB)
    2. Speckle noise reduction
    
    TODO [REAL DATA INTEGRATION]:
    Add radiometric calibration (Sigma0), thermal noise removal, and terrain correction (SNAP/ESA orbit file correction).
    """
    if speckle_method == "lee":
        cleaned = apply_lee_filter(sar_img, size=kernel_size)
    elif speckle_method == "median":
        cleaned = cv2.medianBlur((sar_img * 10).astype(np.float32), kernel_size) / 10.0
    else:  # box / uniform filter
        cleaned = cv2.blur(sar_img, (kernel_size, kernel_size))

    return cleaned.astype(np.float32)


def preprocess_optical_data(
    optical_img: np.ndarray,
    cloud_mask: np.ndarray = None,
    cloud_threshold: float = 0.65
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Optical Preprocessing Pipeline:
    1. Cloud detection & masking
    2. Zero out cloudy pixels or interpolate
    
    TODO [REAL DATA INTEGRATION]:
    Integrate Sentinel-2 Sen2Cor scene classification layer (SCL) cloud/shadow masking.
    """
    h, w, c = optical_img.shape
    if cloud_mask is None:
        # Detect bright cloud pixels across Blue, Red, NIR
        brightness = np.mean(optical_img[:, :, :3], axis=2)
        cloud_mask = (brightness > cloud_threshold).astype(np.uint8)

    # Mask optical imagery
    cleaned_optical = optical_img.copy()
    for band in range(c):
        cleaned_optical[:, :, band] = np.where(cloud_mask == 1, 0.0, optical_img[:, :, band])

    return cleaned_optical.astype(np.float32), cloud_mask
