import numpy as np


def normalize_sar(sar_db: np.ndarray, db_min: float = -30.0, db_max: float = 0.0) -> np.ndarray:
    """
    Normalizes SAR backscatter in dB scale to range [0.0, 1.0].
    """
    clipped = np.clip(sar_db, db_min, db_max)
    normalized = (clipped - db_min) / (db_max - db_min + 1e-8)
    return normalized.astype(np.float32)


def normalize_optical(optical_img: np.ndarray) -> np.ndarray:
    """
    Normalizes Optical multi-spectral image to range [0.0, 1.0].
    """
    normalized = np.clip(optical_img, 0.0, 1.0)
    return normalized.astype(np.float32)


def zscore_normalize(arr: np.ndarray) -> np.ndarray:
    """
    Applies standard Z-score normalization (zero mean, unit variance).
    """
    mean = np.mean(arr)
    std = np.std(arr) + 1e-8
    return ((arr - mean) / std).astype(np.float32)
