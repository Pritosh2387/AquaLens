from typing import Dict, Any

from src.utils.logging import get_logger
from src.utils.config import load_config
from src.confidence.features import compile_confidence_feature_vector
from src.confidence.scoring import calculate_weighted_confidence

logger = get_logger("OilConfidenceEngine")


class OilConfidenceEngine:
    """
    Module 4 Confidence Engine: Evaluates oil spill probability vs dark look-alikes.
    """
    def __init__(self, config_path: str = "configs/config.yaml"):
        self.cfg = load_config(config_path)
        self.thresholds = self.cfg["confidence_engine"]["thresholds"]

    def evaluate_confidence(
        self,
        model_probability: float,
        module1_features: Dict[str, Any],
        shape_features: Dict[str, Any] = None,
        has_optical: bool = True
    ) -> Dict[str, Any]:
        """
        Evaluates detection confidence and produces Module 4 API output.
        """
        feats = compile_confidence_feature_vector(
            model_probability=model_probability,
            module1_features=module1_features,
            shape_features=shape_features,
            has_optical=has_optical
        )

        confidence, adjusted_oil_prob, state, verification_required = calculate_weighted_confidence(
            features=feats,
            thresholds=self.thresholds
        )

        logger.info(
            f"[MODULE 4 CONFIDENCE] Oil Prob: {adjusted_oil_prob:.4f} | "
            f"Confidence: {confidence:.4f} | State: {state}"
        )

        return {
            "oil_probability": adjusted_oil_prob,
            "confidence": confidence,
            "lookalike_probability": feats["lookalike_probability"],
            "verification_required": verification_required,
            "verification_state": state,
            "feature_vector": feats
        }
