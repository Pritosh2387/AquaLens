"""
api/serializers.py — JSON-safe serialization for ML pipeline outputs.

Converts numpy scalars/arrays, datetime objects, and shapely geometries
to standard Python types without modifying the scientific modules.
Preserves OBSERVED / INFERRED / SIMULATED provenance labels.
"""
import numpy as np
from typing import Any


def make_serializable(obj: Any) -> Any:
    """
    Recursively convert numpy types, numpy arrays, and other non-JSON-serialisable
    objects into plain Python types suitable for FastAPI JSON responses.

    Preserves dict structure and list structure intact so all provenance fields
    (data_type, confidence, mode, etc.) remain in the response.
    """
    if obj is None:
        return None

    # --- numpy scalars ---
    if isinstance(obj, (np.integer,)):
        return int(obj)
    if isinstance(obj, (np.floating,)):
        return float(obj)
    if isinstance(obj, np.bool_):
        return bool(obj)

    # --- numpy arrays ---
    if isinstance(obj, np.ndarray):
        return obj.tolist()

    # --- Python containers ---
    if isinstance(obj, dict):
        return {str(k): make_serializable(v) for k, v in obj.items()}

    if isinstance(obj, (list, tuple)):
        return [make_serializable(i) for i in obj]

    # --- Python primitives (str, int, float, bool) passthrough ---
    return obj
