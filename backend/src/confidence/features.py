import numpy as np
from typing import Dict, Any


def compile_confidence_feature_vector(
    model_probability: float,
    module1_features: Dict[str, Any],
    shape_features: Dict[str, Any] = None,
    has_optical: bool = True
) -> Dict[str, float]:
    """
    Compiles the 8 key confidence features into a structured dictionary and numpy array:
    1. model_probability
    2. sar_texture_score
    3. shape_score
    4. optical_agreement
    5. wind_condition
    6. wave_condition
    7. temporal_consistency
    8. lookalike_probability
    """
    if shape_features is None:
        shape_features = {}

    sar_texture = module1_features.get("sar_texture_score", 0.5)
    shape_score = shape_features.get("shape_score", 0.5)
    
    optical_agreement = module1_features.get("optical_agreement_score", 0.8) if has_optical else 0.5
    wind_cond = module1_features.get("wind_condition_score", 0.7)
    wave_cond = module1_features.get("wave_condition_score", 0.7)
    temporal_consistency = 0.85  # Default consistency

    # Look-alike indicators: Low wind (<2 m/s) or high compactness increase look-alike likelihood
    wind_speed = module1_features.get("wind_speed_ms", 5.0)
    compactness = shape_features.get("compactness", 0.5)
    
    lookalike_prob = 0.1
    if wind_speed < 2.5:
        lookalike_prob += 0.35  # Low wind calm sea slick lookalike
    if compactness > 0.6:
        lookalike_prob += 0.25  # Circular non-spill shape

    lookalike_prob = float(np.clip(lookalike_prob, 0.02, 0.95))

    vector_dict = {
        "model_probability": round(float(model_probability), 4),
        "sar_texture_score": round(float(sar_texture), 4),
        "shape_score": round(float(shape_score), 4),
        "optical_agreement": round(float(optical_agreement), 4),
        "wind_condition": round(float(wind_cond), 4),
        "wave_condition": round(float(wave_cond), 4),
        "temporal_consistency": round(float(temporal_consistency), 4),
        "lookalike_probability": round(float(lookalike_prob), 4)
    }

    return vector_dict
