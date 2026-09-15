import numpy as np
from typing import List, Tuple, Dict, Any


def calculate_eta_distribution(arrival_times_hours: List[float]) -> Tuple[List[int], float]:
    """
    Computes lower bound, median, and upper bound arrival times in hours, and ETA confidence.
    """
    if not arrival_times_hours:
        return [18, 24], 0.75

    arr = np.array(arrival_times_hours)
    p25 = int(np.percentile(arr, 25))
    p75 = int(np.percentile(arr, 75))

    p25 = max(1, p25)
    p75 = max(p25 + 2, p75)

    # ETA confidence derived from standard deviation spread
    std = float(np.std(arr)) if len(arr) > 1 else 3.0
    confidence = float(np.clip(1.0 - (std / 24.0), 0.50, 0.95))

    return [p25, p75], round(confidence, 2)
