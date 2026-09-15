from typing import Dict, Any, Tuple


def calculate_weighted_confidence(
    features: Dict[str, float],
    thresholds: Dict[str, float] = None
) -> Tuple[float, float, str, bool]:
    """
    Computes overall confidence score, adjusted oil probability, and assigns verification state.
    
    Weights:
    - Model Probability: 0.35
    - Shape Score: 0.15
    - Texture Score: 0.15
    - Optical Agreement: 0.10
    - Environmental (Wind & Wave): 0.15
    - Lookalike Penalty: -0.20
    """
    if thresholds is None:
        thresholds = {
            "high_confidence": 0.80,
            "medium_confidence": 0.60,
            "verification_required": 0.40
        }

    p_model = features.get("model_probability", 0.5)
    shape_s = features.get("shape_score", 0.5)
    texture_s = features.get("sar_texture_score", 0.5)
    opt_s = features.get("optical_agreement", 0.5)
    wind_s = features.get("wind_condition", 0.7)
    wave_s = features.get("wave_condition", 0.7)
    p_lookalike = features.get("lookalike_probability", 0.1)

    # Weighted Score Calculation
    score = (
        0.35 * p_model +
        0.15 * shape_s +
        0.15 * texture_s +
        0.10 * opt_s +
        0.15 * (0.5 * wind_s + 0.5 * wave_s) -
        0.20 * p_lookalike
    )

    confidence = float(max(0.05, min(0.99, score)))
    adjusted_oil_prob = float(max(0.01, min(0.99, p_model * (1.0 - 0.5 * p_lookalike))))

    # State Assignment based on thresholds
    if confidence >= thresholds["high_confidence"]:
        state = "HIGH CONFIDENCE"
        verification_required = False
    elif confidence >= thresholds["medium_confidence"]:
        state = "MEDIUM CONFIDENCE"
        verification_required = True
    elif confidence >= thresholds["verification_required"]:
        state = "VERIFICATION REQUIRED"
        verification_required = True
    else:
        state = "LOW CONFIDENCE / POSSIBLE LOOK-ALIKE"
        verification_required = True

    return round(confidence, 4), round(adjusted_oil_prob, 4), state, verification_required
